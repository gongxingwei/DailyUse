import { Account, User } from '@dailyuse/domain-server';
import { AccountContracts } from '@dailyuse/contracts';

// 类型别名
type AccountDTO = AccountContracts.AccountDTO;
type AccountPersistenceDTO = AccountContracts.AccountPersistenceDTO;
type AccountStatus = AccountContracts.AccountStatus;
type AccountType = AccountContracts.AccountType;
type AccountRegistrationRequest = AccountContracts.AccountRegistrationRequest;
type AccountCreationResponse = AccountContracts.AccountCreationResponse;
type AccountUpdateData = AccountContracts.AccountUpdateData;
type AccountListResponse = AccountContracts.AccountListResponse;
type AccountInfoGetterByUsernameRequested = AccountContracts.AccountInfoGetterByUsernameRequested;
type AccountInfoGetterByUsernameResponse = AccountContracts.AccountInfoGetterByUsernameResponse;
type AccountInfoGetterByUuidRequested = AccountContracts.AccountInfoGetterByUuidRequested;
type AccountInfoGetterByUuidResponse = AccountContracts.AccountInfoGetterByUuidResponse;
type AccountStatusVerificationRequested = AccountContracts.AccountStatusVerificationRequested;
type AccountStatusVerificationResponse = AccountContracts.AccountStatusVerificationResponse;

// 向后兼容的类型别名（已废弃，建议使用 AccountUpdateData）
/** @deprecated 使用 AccountUpdateData 代替 */
export type UpdateAccountDto = AccountUpdateData;

/** @deprecated 使用 AccountListResponse 代替 */
export type AccountResponseDto = AccountListResponse;

import type { IAccountRepository } from '@dailyuse/domain-server';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma';
import { EmailService } from '../../domain/EmailService';
import { AccountValidationService } from '../../infrastructure/AccountValidationService';
// infrastructure
import { accountContainer } from '../../infrastructure/di/container';
// utils
import { eventBus, createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('AccountService');

// 枚举常量
const { AccountStatus, AccountType } = AccountContracts;

export class AccountApplicationService {
  private static instance: AccountApplicationService | null = null;
  private readonly accountRepository: IAccountRepository;

  private constructor(accountRepository?: PrismaAccountRepository) {
    this.accountRepository = accountRepository || accountContainer.resolve('accountRepository');
  }

  static async createInstance(
    accountRepository?: PrismaAccountRepository,
  ): Promise<AccountApplicationService> {
    AccountApplicationService.instance = new AccountApplicationService(accountRepository);
    return AccountApplicationService.instance;
  }

  static async getInstance(): Promise<AccountApplicationService> {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = await AccountApplicationService.createInstance();
    }
    return AccountApplicationService.instance;
  }

  /**
   * 将 AccountDTO 转换为 AccountClientDTO
   * 添加客户端需要的计算属性
   */
  private toClientDTO(dto: AccountDTO): AccountContracts.AccountClientDTO {
    const now = Date.now();
    const daysSinceLastLogin = dto.lastLoginAt
      ? Math.floor((now - dto.lastLoginAt) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      ...dto,
      isActive: dto.status === AccountStatus.ACTIVE,
      daysSinceLastLogin,
      roleNames: dto.roles?.map((role) => role.name) || [],
      hasVerifiedEmail: dto.isEmailVerified,
      hasVerifiedPhone: dto.isPhoneVerified,
    };
  }

  /**
   * 创建新账户
   */
  async createAccountByUsernameAndPwd(
    createDto: AccountRegistrationRequest,
  ): Promise<AccountCreationResponse> {
    // 创建账户聚合
    const account = Account.register({
      username: createDto.username,
      accountType: createDto.accountType || AccountType.LOCAL,
      password: createDto.password,
    });

    // 保存到数据库
    await this.accountRepository.save(account);
    console.log(`✅ [Account] 账户已保存到数据库: ${account.uuid}`);

    try {
      // 向认证模块发送请求，为该账号生成认证凭证
      console.log(`🔄 [Account] 正在为账户 ${account.uuid} 请求生成认证凭证...`);
      const credentialCreationResult = await eventBus.invoke<{
        success: boolean;
        message: string;
      }>(
        'auth.credential.create',
        {
          accountUuid: account.uuid,
          username: account.username,
          password: createDto.password,
        },
        { timeout: 10000 }, // 10秒超时
      );

      if (!credentialCreationResult.success) {
        console.error(`❌ [Account] 认证凭证生成失败: ${credentialCreationResult.message}`);

        // 使用软删除方式删除先前保存的账户
        console.log(`🗑️ [Account] 正在删除账户 ${account.uuid}...`);
        account.disable(); // 禁用账户
        await this.accountRepository.save(account);

        throw new Error(`账户注册失败: ${credentialCreationResult.message}`);
      }

      console.log(`✅ [Account] 认证凭证生成成功: ${credentialCreationResult.message}`);
    } catch (error) {
      console.error(`❌ [Account] 处理认证凭证时发生错误:`, error);

      // 使用软删除方式删除先前保存的账户
      console.log(`🗑️ [Account] 正在删除账户 ${account.uuid}...`);
      try {
        account.disable(); // 禁用账户
        await this.accountRepository.save(account);
      } catch (deleteError) {
        console.error(`❌ [Account] 删除账户失败:`, deleteError);
      }

      throw new Error(`账户注册失败: ${(error as Error).message}`);
    }

    // 发送欢迎邮件
    if (account.email) {
      console.log('发送欢迎邮件');
    }

    // 处理领域事件
    const domainEvents = account.getDomainEvents();
    for (const event of domainEvents) {
      console.log(`📢 [领域事件] ${event.eventType}:`, event.payload);
      // 通过事件总线发布给其他模块
      await eventBus.publish(event);
    }

    account.clearDomainEvents();

    const accountDTO = account.toDTO() as AccountDTO;
    const accountClientDTO = this.toClientDTO(accountDTO);

    logger.info('Account registration completed', {
      accountUuid: account.uuid,
      username: account.username,
    });

    return {
      data: {
        account: accountClientDTO,
      },
    };
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<AccountDTO | null> {
    logger.info('Fetching account by ID', { accountId: id });

    const accountPersistenceDTO = await this.accountRepository.findById(id);
    if (!accountPersistenceDTO) {
      logger.warn('Account not found', { accountId: id });
      return null;
    }
    const account = Account.fromPersistenceDTO(accountPersistenceDTO);
    const accountDTO = account.toDTO();

    logger.info('Account retrieved successfully', { accountId: id, username: accountDTO.username });
    return accountDTO;
  }

  /**
   * 根据邮箱获取账户
   */
  async getAccountByEmail(email: string): Promise<Account | null> {
    const accountDTO = await this.accountRepository.findByEmail(email);
    return accountDTO ? Account.fromPersistenceDTO(accountDTO) : null;
  }

  /**
   * 根据用户名获取账户
   */
  async getAccountByUsername(username: string): Promise<AccountDTO | null> {
    logger.info('Fetching account by username', { username });

    const accountPersistenceDTO = await this.accountRepository.findByUsername(username);
    if (!accountPersistenceDTO) {
      logger.warn('Account not found', { username });
      return null;
    }
    const account = Account.fromPersistenceDTO(accountPersistenceDTO);
    const accountDTO = account.toDTO();

    logger.info('Account retrieved successfully', { username, accountId: accountDTO.uuid });
    return accountDTO;
  }

  /**
   * 更新账户信息
   */
  async updateAccount(id: string, updateDto: AccountDTO): Promise<AccountDTO | null> {
    logger.info('Updating account', { accountId: id });

    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      logger.warn('Account not found for update', { accountId: id });
      return null;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    // 更新账户信息
    if (updateDto.email && updateDto.email !== account.email?.value) {
      logger.info('Updating email', { accountId: id, newEmail: updateDto.email });
      account.updateEmail(updateDto.email);
      // 邮箱变更需要重新验证
      console.log('发送验证邮件');
    }

    // 保存更新后的账户
    await this.accountRepository.save(account);

    logger.info('Account updated successfully', { accountId: id });
    return account.toDTO();
  }

  /**
   * 激活账户
   */
  async activateAccount(id: string): Promise<boolean> {
    logger.info('Activating account', { accountId: id });

    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      logger.warn('Account not found for activation', { accountId: id });
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.enable();
    await this.accountRepository.save(account);

    logger.info('Account activated successfully', { accountId: id });
    return true;
  }

  /**
   * 停用账户
   * 同时清理所有认证相关数据（sessions, tokens, MFA devices）
   */
  async deactivateAccount(id: string): Promise<boolean> {
    logger.info('Deactivating account', { accountId: id });

    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      logger.warn('Account not found for deactivation', { accountId: id });
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    // 1. 停用账户
    account.disable();
    await this.accountRepository.save(account);

    // 2. 发布账户停用事件，触发其他模块清理（sessions, tokens, MFA devices）
    await eventBus.publish({
      eventType: 'AccountDeactivated',
      aggregateId: id,
      occurredAt: new Date(),
      payload: {
        accountUuid: id,
        username: accountDTO.username,
        deactivatedAt: new Date(),
        reason: 'Account deactivation requested',
      },
    });

    logger.info('Account deactivated successfully', { accountId: id });
    return true;
  }

  /**
   * 暂停账户
   */
  async suspendAccount(id: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.suspend();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(id: string, token: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO || accountDTO.emailVerificationToken !== token) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.verifyEmail();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证手机号
   */
  async verifyPhone(id: string, code: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO || accountDTO.phoneVerificationCode !== code) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.verifyPhone();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 为账户添加角色
   */
  async addRole(accountId: string, roleId: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(accountId);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.addRole(roleId);
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 移除账户角色
   */
  async removeRole(accountId: string, roleId: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(accountId);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.removeRole(roleId);
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 获取所有账户（分页）
   * 返回符合新 AccountListResponse 格式的数据
   */
  async getAllAccounts(page: number = 1, limit: number = 10): Promise<AccountListResponse> {
    logger.info('Fetching account list', { page, limit });

    const { accounts: accountDTOs, total } = await this.accountRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // 转换为 DTO 然后再转换为 ClientDTO
    const accounts = accountDTOs
      .map((accountDTO) => Account.fromPersistenceDTO(accountDTO).toDTO())
      .map((dto) => this.toClientDTO(dto));

    logger.info('Account list retrieved', { total, page, limit, count: accounts.length });

    // 返回符合新 Response 格式的数据
    return {
      data: {
        accounts,
        total,
        page,
        limit,
        hasMore,
      },
    };
  }

  // /**
  //  * 根据状态获取账户
  //  */
  // async getAccountsByStatus(status: AccountStatus): Promise<AccountResponseDto[]> {
  //   const accounts = await this.accountRepository.findByStatus(status);
  //   return accounts.map((account) => this.toResponseDto(account));
  // }

  // /**
  //  * 搜索账户
  //  */
  // async searchAccounts(query: string): Promise<AccountResponseDto[]> {
  //   const accounts = await this.accountRepository.search(query);
  //   return accounts.map((account) => this.toResponseDto(account));
  // }

  /**
   * 删除账户（软删除）
   * 同时清理所有认证相关数据（sessions, tokens, MFA devices）
   */
  async deleteAccount(id: string): Promise<boolean> {
    logger.info('Deleting account (soft delete)', { accountId: id });

    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      logger.warn('Account not found for deletion', { accountId: id });
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    // 1. 执行软删除
    account.disable();
    await this.accountRepository.save(account);

    // 2. 发布账户删除事件，触发其他模块清理（sessions, tokens, MFA devices）
    await eventBus.publish({
      eventType: 'AccountDeleted',
      aggregateId: id,
      occurredAt: new Date(),
      payload: {
        accountUuid: id,
        username: accountDTO.username,
        deletedAt: new Date(),
        reason: 'Account deletion requested',
      },
    });

    logger.info('Account deleted successfully (soft delete)', { accountId: id });
    return true;
  }

  /**
   * 处理通过用户名获取账户信息的事件
   * @param event 事件对象
   * @returns {Promise<void>}
   */
  async handleAccountInfoGetterByUsernameEvent(
    event: AccountInfoGetterByUsernameRequested,
  ): Promise<void> {
    const { username, requestId } = event;
    console.log(
      '开始处理事件AccountInfoGetterByUsernameRequested，从载荷中获取username数据',
      username,
    );
    try {
      const account = await this.getAccountByUsername(username);
      console.log('获取account结果', account);
      if (!account) {
        const responseEvent: AccountInfoGetterByUsernameResponse = {
          type: 'AccountInfoGetterByUsernameResponse',
          requestId,
          success: false,
          error: '账户不存在',
          timestamp: new Date().toISOString(),
        };
        eventBus.publish(responseEvent as any);
        return;
      }
      const responseEvent: AccountInfoGetterByUsernameResponse = {
        type: 'AccountInfoGetterByUsernameResponse',
        requestId,
        success: true,
        account: account,
        timestamp: new Date().toISOString(),
      };

      eventBus.publish(responseEvent as any);
      console.log('发送AccountInfoGetterByUsernameResponse事件', responseEvent);
    } catch (error) {
      const responseEvent: AccountInfoGetterByUsernameResponse = {
        type: 'AccountInfoGetterByUsernameResponse',
        requestId,
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };

      eventBus.publish(responseEvent as any);
    }
  }

  async handleAccountInfoGetterByUuidEvent(event: AccountInfoGetterByUuidRequested): Promise<void> {
    const { accountUuid, requestId } = event;
    console.log(
      '开始处理事件AccountInfoGetterByUuidRequested，从载荷中获取accountUuid数据',
      accountUuid,
    );
    try {
      const accountPersistenceDTO = await this.accountRepository.findById(accountUuid);
      console.log('获取account结果', accountPersistenceDTO);
      if (!accountPersistenceDTO) {
        const responseEvent: AccountInfoGetterByUuidResponse = {
          type: 'AccountInfoGetterByUuidResponse',
          requestId,
          success: false,
          error: '账户不存在',
          timestamp: new Date().toISOString(),
        };
        eventBus.publish(responseEvent as any);
        return;
      }

      // 转换为领域对象
      const account = Account.fromPersistenceDTO(accountPersistenceDTO);

      const accountDTO = account.toDTO();

      const responseEvent: AccountInfoGetterByUuidResponse = {
        type: 'AccountInfoGetterByUuidResponse',
        requestId,
        success: true,
        account: accountDTO,
        timestamp: new Date().toISOString(),
      };

      eventBus.publish(responseEvent as any);
      console.log('发送AccountInfoGetterByUuidResponse事件', responseEvent);
    } catch (error) {
      const responseEvent: AccountInfoGetterByUuidResponse = {
        type: 'AccountInfoGetterByUuidResponse',
        requestId,
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };

      eventBus.publish(responseEvent as any);
    }
  }

  /**
   * 处理账户状态验证事件
   * @param event 账户状态验证请求事件
   * @returns {Promise<void>}
   */
  async handleAccountStatusVerification(
    accountUuid: string,
  ): Promise<{ isValid: boolean; status: AccountStatus | null }> {
    try {
      // 查找账号
      const account = await this.getAccountById(accountUuid);

      let accountStatus: AccountStatus | null = null;
      let isLoginAllowed = false;
      let statusMessage = '';

      if (!account) {
        // 账号不存在
        accountStatus = null;
        isLoginAllowed = false;
        statusMessage = '账号不存在';
        console.log('❌ [Account] 账号不存在:', accountUuid);
      } else if (
        account.accountType === AccountType.LOCAL ||
        account.accountType === AccountType.GUEST
      ) {
        // 本地账号和游客账号直接返回验证成功
        accountStatus = AccountStatus.ACTIVE;
        isLoginAllowed = true;
        statusMessage = '账号状态正常';
      } else {
        accountStatus = account.status as AccountStatus;
        console.log('✓ [Account] 账号状态检查完成:', {
          accountUuid,
          status: accountStatus,
          loginAllowed: isLoginAllowed,
        });
      }
      return {
        isValid: isLoginAllowed,
        status: accountStatus,
      };
    } catch (error) {
      return {
        isValid: false,
        status: null,
      };
    }
  }
}
