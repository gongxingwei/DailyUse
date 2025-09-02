import { Account, User, type AccountDTO } from '@dailyuse/domain-server';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma';
import { EmailService } from '../../domain/EmailService';
import { AccountValidationService } from '../../infrastructure/AccountValidationService';
import { AccountStatus, AccountType } from '@dailyuse/domain-core';
// insfrastructure
import { accountContainer } from '../../infrastructure/di/container';
// events types
import type {
  AccountInfoGetterByUsernameRequested,
  AccountInfoGetterByUsernameResponse,
  AccountInfoGetterByUuidRequested,
  AccountInfoGetterByUuidResponse,
  AccountStatusVerificationRequested,
  AccountStatusVerificationEvent,
} from '@dailyuse/contracts';
import type {
  RegistrationByUsernameAndPasswordRequestDTO,
  RegistrationResponseDTO,
} from '../../../../tempTypes';
// utils
import { eventBus } from '@dailyuse/utils';

export interface UpdateAccountDto {
  email?: string;
  phoneNumber?: string;
  address?: any;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface AccountResponseDto {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  status: any;
  accountType: any;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    socialAccounts: { [key: string]: string };
  };
  roleIds: string[];
}

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
    const savedAccount = await this.accountRepository.save(account);

    // 发送欢迎邮件
    if (savedAccount.email) {
      console.log('发送邮件');
    }

    const domainEvents = account.getDomainEvents();
    for (const event of domainEvents) {
      console.log(`📢 [领域事件] ${event.eventType}:`, event.payload);
      // 通过事件总线发布给其他模块
      await eventBus.publish(event);
    }

    account.clearDomainEvents();

    return { account: savedAccount.toDTO() as AccountDTO } as RegistrationResponseDTO;
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findById(id);
    return account ? this.toResponseDto(account) : null;
  }

  /**
   * 根据邮箱获取账户
   */
  async getAccountByEmail(email: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findByEmail(email);
    return account ? this.toResponseDto(account) : null;
  }

  /**
   * 根据用户名获取账户
   */
  async getAccountByUsername(username: string): Promise<Account | null> {
    const account = await this.accountRepository.findByUsername(username);
    return account ? account : null;
  }

  /**
   * 更新账户信息
   */
  async updateAccount(id: string, updateDto: UpdateAccountDto): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return null;
    }

    // 更新账户信息
    if (updateDto.email && updateDto.email !== account.email?.value) {
      account.updateEmail(updateDto.email);
      // 邮箱变更需要重新验证
      console.log('发送验证邮件');
    }

    if (updateDto.phoneNumber) {
      account.updatePhone(updateDto.phoneNumber);
    }

    if (updateDto.address) {
      account.updateAddress(updateDto.address);
    }

    if (updateDto.userProfile) {
      // 更新用户信息 - 使用User实体的更新方法
      const user = account.user as User;

      if (
        updateDto.userProfile.firstName ||
        updateDto.userProfile.lastName ||
        updateDto.userProfile.bio
      ) {
        user.updateProfile(
          updateDto.userProfile.firstName,
          updateDto.userProfile.lastName,
          updateDto.userProfile.bio,
        );
      }

      if (updateDto.userProfile.avatar) {
        user.updateAvatar(updateDto.userProfile.avatar);
      }
    }

    const updatedAccount = await this.accountRepository.save(account);
    return this.toResponseDto(updatedAccount);
  }

  /**
   * 激活账户
   */
  async activateAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.enable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 停用账户
   */
  async deactivateAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.disable();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 暂停账户
   */
  async suspendAccount(id: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

    account.suspend();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(id: string, token: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account || account.emailVerificationToken !== token) {
      return false;
    }

    account.verifyEmail();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 验证手机号
   */
  async verifyPhone(id: string, code: string): Promise<boolean> {
    const account = await this.accountRepository.findById(id);
    if (!account || account.phoneVerificationCode !== code) {
      return false;
    }

    account.verifyPhone();
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 为账户添加角色
   */
  async addRole(accountId: string, roleId: string): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return false;
    }

    account.addRole(roleId);
    await this.accountRepository.save(account);
    return true;
  }

  /**
   * 移除账户角色
   */
  async removeRole(accountId: string, roleId: string): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return false;
    }

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
    accounts: AccountResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { accounts, total } = await this.accountRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      accounts: accounts.map((account) => this.toResponseDto(account)),
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
    const account = await this.accountRepository.findById(id);
    if (!account) {
      return false;
    }

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
            username,
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
          username,
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

  async handleAccountInfoGetterByUuidEvent(
    event: AccountInfoGetterByUuidRequestedEvent,
  ): Promise<void> {
    const { accountUuid, requestId } = event.payload;
    console.log(
      '开始处理事件AccountInfoGetterByUuidRequested，从载荷中获取accountUuid数据',
      accountUuid,
    );
    try {
      const account = await this.accountRepository.findById(accountUuid);
      console.log('获取account结果', account);
      if (!account) {
        const responseEvent: AccountInfoGetterByUuidResponseEvent = {
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
      const responseEvent: AccountInfoGetterByUuidResponseEvent = {
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
      const responseEvent: AccountInfoGetterByUuidResponseEvent = {
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
  async handleAccountStatusVerificationEvent(
    event: AccountStatusVerificationRequestedEvent,
  ): Promise<void> {
    const { accountUuid, username, requestId } = event.payload;
    console.log('🔍 [Account] 处理账号状态验证请求:', username);

    try {
      // 查找账号
      const account = await this.getAccountByUsername(username);
      console.log('🔍 [Account] 查找账号结果:', account);

      let accountStatus: AccountStatusVerificationResponseEvent['payload']['accountStatus'];
      let isLoginAllowed = false;
      let statusMessage = '';

      if (!account) {
        // 账号不存在
        accountStatus = 'not_found';
        isLoginAllowed = false;
        statusMessage = '账号不存在';
        console.log('❌ [Account] 账号不存在:', accountUuid);
      } else if (account.accountType === AccountType.LOCAL) {
        // 本地账号直接返回验证成功
        accountStatus = 'active';
        isLoginAllowed = true;
        statusMessage = '账号状态正常';
      } else {
        // 检查账号状态
        switch (account.status) {
          case AccountStatus.ACTIVE:
            accountStatus = 'active';
            isLoginAllowed = true;
            statusMessage = '账号状态正常';
            break;
          case AccountStatus.PENDING_VERIFICATION:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号待验证';
            break;
          case AccountStatus.DISABLED:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号已禁用';
            break;
          case AccountStatus.SUSPENDED:
            accountStatus = 'suspended';
            isLoginAllowed = false;
            statusMessage = '账号已被暂停';
            break;
          default:
            accountStatus = 'inactive';
            isLoginAllowed = false;
            statusMessage = '账号状态异常';
        }

        console.log('✓ [Account] 账号状态检查完成:', {
          accountUuid,
          username,
          status: accountStatus,
          loginAllowed: isLoginAllowed,
        });
      }

      // 发布状态验证响应事件
      const responseEvent: AccountStatusVerificationResponseEvent = {
        eventType: 'AccountStatusVerificationResponse',
        aggregateId: accountUuid,
        occurredOn: new Date(),
        payload: {
          accountUuid,
          username,
          requestId,
          accountStatus,
          isLoginAllowed,
          statusMessage,
          verifiedAt: new Date(),
        },
      };

      await eventBus.publish(responseEvent);
      console.log('📤 [Account] 已发送账号状态验证响应:', requestId);
    } catch (error) {
      console.error('❌ [Account] 处理账号状态验证请求失败:', error);

      // 发送错误响应
      const errorResponseEvent: AccountStatusVerificationResponseEvent = {
        eventType: 'AccountStatusVerificationResponse',
        aggregateId: accountUuid,
        occurredOn: new Date(),
        payload: {
          accountUuid,
          username,
          requestId,
          accountStatus: 'not_found',
          isLoginAllowed: false,
          statusMessage: '系统异常，无法验证账号状态',
          verifiedAt: new Date(),
        },
      };

      await eventBus.publish(errorResponseEvent);
    }
  }

  /**
   * 转换为响应DTO
   */
  private toResponseDto(account: Account): AccountResponseDto {
    return {
      id: account.uuid,
      username: account.username,
      email: account.email?.value,
      phoneNumber: account.phoneNumber?.fullNumber,
      status: account.status,
      accountType: account.accountType,
      isEmailVerified: account.isEmailVerified,
      isPhoneVerified: account.isPhoneVerified,
      lastLoginAt: account.lastLoginAt?.toISOString(),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      user: {
        id: account.user.uuid,
        firstName: account.user.firstName,
        lastName: account.user.lastName,
        displayName: account.user.displayName,
        avatar: account.user.avatar,
        bio: account.user.bio,
        socialAccounts: account.user.socialAccounts,
      },
      roleIds: Array.from(account.roleIds),
    };
  }
}
