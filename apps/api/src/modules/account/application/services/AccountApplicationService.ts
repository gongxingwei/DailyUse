import { Account, User } from '@dailyuse/domain-server';
import type { AccountDTO } from '@dailyuse/contracts';

// Temporary types - should be moved to contracts
export interface UpdateAccountDto {
  email?: string;
  phoneNumber?: string;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
}

export interface AccountResponseDto {
  accounts: AccountDTO[];
  total: number;
}
import type { IAccountRepository } from '@dailyuse/domain-server';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma';
import { EmailService } from '../../domain/EmailService';
import { AccountValidationService } from '../../infrastructure/AccountValidationService';
import { AccountStatus, AccountType } from '@dailyuse/domain-core';
import type { AccountPersistenceDTO } from '@dailyuse/contracts';
// insfrastructure
import { accountContainer } from '../../infrastructure/di/container';
// events types
import type {
  AccountInfoGetterByUsernameRequested,
  AccountInfoGetterByUsernameResponse,
  AccountInfoGetterByUuidRequested,
  AccountInfoGetterByUuidResponse,
  AccountStatusVerificationRequested,
  AccountStatusVerificationResponse,
} from '@dailyuse/contracts';
// 请求和响应（form/api）类型
import type {
  RegistrationByUsernameAndPasswordRequestDTO,
  RegistrationResponseDTO,
} from '@dailyuse/contracts';
// utils
import { eventBus } from '@dailyuse/utils';

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
   * 创建新账户
   */
  async createAccountByUsernameAndPwd(
    createDto: RegistrationByUsernameAndPasswordRequestDTO,
  ): Promise<RegistrationResponseDTO> {
    // 创建账户聚合
    const account = Account.register({
      username: createDto.username,
      accountType: createDto.accountType,
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

    return { account: account.toDTO() as AccountDTO } as RegistrationResponseDTO;
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<Account | null> {
    const accountDTO = await this.accountRepository.findById(id);
    return accountDTO ? Account.fromPersistenceDTO(accountDTO) : null;
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
  async getAccountByUsername(username: string): Promise<Account | null> {
    const accountDTO = await this.accountRepository.findByUsername(username);
    return accountDTO ? Account.fromPersistenceDTO(accountDTO) : null;
  }

  /**
   * 更新账户信息
   */
  async updateAccount(id: string, updateDto: AccountDTO): Promise<AccountDTO | null> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      return null;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    // 更新账户信息
    if (updateDto.email && updateDto.email !== account.email?.value) {
      account.updateEmail(updateDto.email);
      // 邮箱变更需要重新验证
      console.log('发送验证邮件');
    }

    // 保存更新后的账户
    await this.accountRepository.save(account);
    return account.toDTO();
  }

  /**
   * 激活账户
   */
  async activateAccount(id: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.enable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 停用账户
   */
  async deactivateAccount(id: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    account.disable();
    await this.accountRepository.save(account);
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
   */
  async getAllAccounts(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    accounts: AccountDTO[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { accounts: accountDTOs, total } = await this.accountRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      accounts: accountDTOs.map((accountDTO) => Account.fromPersistenceDTO(accountDTO).toDTO()),
      total,
      page,
      totalPages,
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
   */
  async deleteAccount(id: string): Promise<boolean> {
    const accountDTO = await this.accountRepository.findById(id);
    if (!accountDTO) {
      return false;
    }

    // 转换为领域对象以便进行业务操作
    const account = Account.fromPersistenceDTO(accountDTO);

    // 执行软删除
    account.disable();
    await this.accountRepository.save(account);
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
    const { username, requestId } = event.payload;
    console.log(
      '开始处理事件AccountInfoGetterByUsernameRequested，从载荷中获取username数据',
      username,
    );
    try {
      const account = await this.getAccountByUsername(username);
      console.log('获取account结果', account);
      if (!account) {
        const responseEvent: AccountInfoGetterByUsernameResponse = {
          eventType: 'AccountInfoGetterByUsernameResponse',
          aggregateId: username,
          occurredOn: new Date(),
          payload: {
            requestId,
            account: null,
          },
        };
        eventBus.publish(responseEvent);
        return;
      }
      const responseEvent: AccountInfoGetterByUsernameResponse = {
        eventType: 'AccountInfoGetterByUsernameResponse',
        aggregateId: account.uuid,
        occurredOn: new Date(),
        payload: {
          requestId,
          account: account,
        },
      };

      eventBus.publish(responseEvent);
      console.log('发送AccountInfoGetterByUsernameResponse事件', responseEvent);
    } catch (error) {
      const responseEvent: AccountInfoGetterByUsernameResponse = {
        eventType: 'AccountInfoGetterByUsernameResponse',
        aggregateId: username,
        occurredOn: new Date(),
        payload: {
          requestId,
          account: null,
        },
      };

      eventBus.publish(responseEvent);
    }
  }

  async handleAccountInfoGetterByUuidEvent(event: AccountInfoGetterByUuidRequested): Promise<void> {
    const { accountUuid, requestId } = event.payload;
    console.log(
      '开始处理事件AccountInfoGetterByUuidRequested，从载荷中获取accountUuid数据',
      accountUuid,
    );
    try {
      const accountDTO = await this.accountRepository.findById(accountUuid);
      console.log('获取account结果', accountDTO);
      if (!accountDTO) {
        const responseEvent: AccountInfoGetterByUuidResponse = {
          eventType: 'AccountInfoGetterByUuidResponse',
          aggregateId: accountUuid,
          occurredOn: new Date(),
          payload: {
            requestId,
            account: null,
          },
        };
        eventBus.publish(responseEvent);
        return;
      }

      // 转换为领域对象
      const account = Account.fromPersistenceDTO(accountDTO);

      const responseEvent: AccountInfoGetterByUuidResponse = {
        eventType: 'AccountInfoGetterByUuidResponse',
        aggregateId: account.uuid,
        occurredOn: new Date(),
        payload: {
          requestId,
          account: account,
        },
      };

      eventBus.publish(responseEvent);
      console.log('发送AccountInfoGetterByUuidResponse事件', responseEvent);
    } catch (error) {
      const responseEvent: AccountInfoGetterByUuidResponse = {
        eventType: 'AccountInfoGetterByUuidResponse',
        aggregateId: accountUuid,
        occurredOn: new Date(),
        payload: {
          requestId,
          account: null,
        },
      };

      eventBus.publish(responseEvent);
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

      let accountStatus: AccountStatusVerificationResponse['payload']['accountStatus'];
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
        accountStatus = account.status;
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
