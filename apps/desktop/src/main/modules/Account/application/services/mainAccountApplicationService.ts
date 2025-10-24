import type { AccountDTO, IAccountRepository } from '../../../Account';
// import type { IUserRepository } from "../../../Account";
import { Account } from '../../domain/aggregates/account';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/valueObjects/email';
import { PhoneNumber } from '../../domain/valueObjects/phoneNumber';
import type { ApiResponse } from '@dailyuse/contracts';
import {
  AccountRegistrationRequest,
  AccountType,
} from '../../../../../common/modules/account/types/account';
import { generateUUID } from '@dailyuse/utils';
import { eventBus } from '@dailyuse/utils';
import { AccountContainer } from '../../infrastructure/di/accountContainer';

/**
 * 主进程中的账号应用服务
 * 专注于账号身份信息管理，不包含认证功能
 * 认证功能已迁移到 Authentication 模块
 */
export class MainAccountApplicationService {
  private static instance: MainAccountApplicationService;
  private accountRepository: IAccountRepository;
  // private userRepository: IUserRepository;

  constructor() {
    const container = AccountContainer.getInstance();
    this.accountRepository = container.getAccountRepository();
    // this.userRepository = container.getUserRepository();
  }

  public static getMainAccountApplicationService(): MainAccountApplicationService {
    if (!MainAccountApplicationService.instance) {
      MainAccountApplicationService.instance = new MainAccountApplicationService();
    }
    return MainAccountApplicationService.instance;
  }

  /**
   * 注册账号
   */
  async register(registerData: AccountRegistrationRequest): Promise<ApiResponse<Account>> {
    console.log('🔄 [主进程-注册] 开始注册账号流程', registerData);
    try {
      // 1. 检查用户名是否已存在
      const isAccountExists = await this.accountRepository.existsByUsername(registerData.username);
      if (isAccountExists) {
        return {
          success: false,
          message: '用户名已存在',
          data: undefined,
        };
      }

      // 2. 检查邮箱是否已存在（如果提供）
      if (registerData.email) {
        const isEmailExists = await this.accountRepository.existsByEmail(registerData.email);
        if (isEmailExists) {
          return {
            success: false,
            message: '邮箱已被使用',
            data: undefined,
          };
        }
      }

      // 3. 检查手机号是否已存在（如果提供）
      if (registerData.phone) {
        const isPhoneExists = await this.accountRepository.existsByPhone(registerData.phone);
        if (isPhoneExists) {
          return {
            success: false,
            message: '手机号已被使用',
            data: undefined,
          };
        }
      }

      // 4. 创建 User 实体（个人资料）
      const user = new User({
        uuid: generateUUID(),
        firstName: registerData.firstName || '',
        lastName: registerData.lastName || '',
        sex: registerData.sex || '2',
        avatar: registerData.avatar || '',
        bio: registerData.bio || '',
      });

      // 5. 创建 Account 聚合根（身份信息）
      const account = Account.register({
        username: registerData.username,
        password: registerData.password,
        accountType: registerData.accountType || AccountType.LOCAL,
        user: user,
        email: registerData.email ? new Email(registerData.email) : undefined,
        phoneNumber: registerData.phone ? new PhoneNumber(registerData.phone) : undefined,
      });

      // 6. 保存 Account（包含 User）
      await this.accountRepository.save(account);

      console.log('✅ [主进程-注册] 账号身份信息创建成功');

      // 7. 发布领域事件，通知其他模块
      const domainEvents = account.getDomainEvents();
      for (const event of domainEvents) {
        console.log(`📢 [领域事件] ${event.eventType}:`, event.payload);
        // 通过事件总线发布给其他模块
        await eventBus.publish(event);
      }

      account.clearDomainEvents();

      return {
        success: true,
        message: '账号注册成功，请完成认证设置',
        data: account,
      };
    } catch (error) {
      console.error('❌ [主进程-注册] 注册账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '注册失败',
        data: undefined,
      };
    }
  }

  async updateUserProfile(accountUuid: string, userDTO: User): Promise<ApiResponse<void>> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }
      const user = User.fromDTO(userDTO);

      account.user = user;

      console.log('✅ [主进程-更新] 用户信息开始持久化');
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '用户信息更新成功',
      };
    } catch (error) {
      console.error('❌ [主进程-更新] 更新用户信息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新用户信息失败',
        data: undefined,
      };
    }
  }

  /**
   * 获取所有账号
   */
  async getAllUsers(): Promise<ApiResponse<Account[]>> {
    try {
      console.log('🔄 [主进程-查询] 开始获取用户列表');

      const accounts = await this.accountRepository.findAll();

      console.log('✅ [主进程-查询] 获取用户列表完成');

      return {
        success: true,
        message: '获取成功',
        data: accounts,
      };
    } catch (error) {
      console.error('❌ [主进程-查询] 获取用户列表失败:', error);
      return {
        success: false,
        message: '获取失败',
        data: undefined,
      };
    }
  }

  /**
   * 根据ID获取账号
   */
  async getAccountById(accountUuid: string): Promise<ApiResponse<Account>> {
    try {
      const account = await this.accountRepository.findById(accountUuid);

      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      return {
        success: true,
        message: '获取成功',
        data: account,
      };
    } catch (error) {
      console.error('❌ [主进程-查询] 获取账号失败:', error);
      return {
        success: false,
        message: '获取账号失败',
        data: undefined,
      };
    }
  }

  /**
   * 根据用户名获取账号
   */
  async getAccountByUsername(username: string): Promise<ApiResponse<Account>> {
    try {
      const account = await this.accountRepository.findByUsername(username);

      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      return {
        success: true,
        message: '获取成功',
        data: account,
      };
    } catch (error) {
      console.error('❌ [主进程-查询] 获取账号失败:', error);
      return {
        success: false,
        message: '获取账号失败',
        data: undefined,
      };
    }
  }

  /**
   * 更新账号信息
   */
  async updateAccountInfo(
    accountUuid: string,
    updateData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatar?: string;
    },
  ): Promise<ApiResponse<Account>> {
    try {
      console.log('🔄 [主进程-更新] 开始更新账号信息流程');

      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      if (updateData.email) {
        account.updateEmail(updateData.email);
      }

      if (updateData.phone) {
        account.updatePhone(updateData.phone);
      }

      // 更新用户实体信息
      if (updateData.firstName || updateData.lastName || updateData.bio) {
        account.user.updateProfile(updateData.firstName, updateData.lastName, updateData.bio);
      }

      if (updateData.avatar) {
        account.user.updateAvatar(updateData.avatar);
      }

      await this.accountRepository.save(account);

      console.log('✅ [主进程-更新] 账号信息更新成功');

      return {
        success: true,
        message: '账号信息更新成功',
        data: account,
      };
    } catch (error) {
      console.error('❌ [主进程-更新] 更新账号信息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新账号信息失败',
        data: undefined,
      };
    }
  }

  /**
   * 禁用账号
   */
  async disableAccount(accountUuid: string): Promise<ApiResponse> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      account.disable();
      await this.accountRepository.save(account);

      // TODO: 发布 AccountDisabledEvent 领域事件
      // 通知 Authentication 模块终止相关会话

      return {
        success: true,
        message: '账号禁用成功',
        data: undefined,
      };
    } catch (error) {
      console.error('❌ [主进程-禁用] 禁用账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '禁用账号失败',
        data: undefined,
      };
    }
  }

  /**
   * 启用账号
   */
  async enableAccount(accountUuid: string): Promise<ApiResponse> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      account.enable();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '账号启用成功',
        data: undefined,
      };
    } catch (error) {
      console.error('❌ [主进程-启用] 启用账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '启用账号失败',
        data: undefined,
      };
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(accountUuid: string): Promise<ApiResponse> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      account.verifyEmail();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '邮箱验证成功',
        data: undefined,
      };
    } catch (error) {
      console.error('❌ [主进程-验证] 邮箱验证失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '邮箱验证失败',
        data: undefined,
      };
    }
  }

  /**
   * 验证手机号
   */
  async verifyPhone(accountUuid: string): Promise<ApiResponse> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      account.verifyPhone();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '手机号验证成功',
        data: undefined,
      };
    } catch (error) {
      console.error('❌ [主进程-验证] 手机号验证失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '手机号验证失败',
        data: undefined,
      };
    }
  }

  /**
   * 通过 username 获取 account_uuid
   */
  async getAccountUuidByUsername(username: string): Promise<ApiResponse<Account>> {
    try {
      const account = await this.accountRepository.findByUsername(username);

      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      return {
        success: true,
        message: '获取账号ID成功',
        data: account,
      };
    } catch (error) {
      console.error('❌ [主进程-获取] 获取账号ID失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取账号ID失败',
        data: undefined,
      };
    }
  }

  async getCurrentAccount(accountUuid: string): Promise<ApiResponse<AccountDTO>> {
    try {
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        return {
          success: false,
          message: '当前账号不存在',
          data: undefined,
        };
      }

      return {
        success: true,
        message: '获取当前账号成功',
        data: account.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程-获取] 获取当前账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取当前账号失败',
        data: undefined,
      };
    }
  }
}
