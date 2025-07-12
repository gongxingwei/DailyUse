//services
import { localAccountService } from "../../domain/services/localAccountService";
import { Account } from "../../domain/aggregates/account";
import type { TResponse } from "@/shared/types/response";
import type { AccountRegistrationRequest } from "../../index";
import type { UserSession } from "@/modules/SessionManagement/domain/types";

/**
 * 账号应用服务
 * 协调账号、认证和会话管理的业务流程
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;
  private localAccountService: typeof localAccountService;
  constructor() {
    this.localAccountService = localAccountService;
  }

  public static getInstance(): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  // /**
  //  * 用户登录流程
  //  * 包含认证和会话创建
  //  */
  // async login(credentials: LoginCredentials, sessionOptions?: {
  //   ipAddress?: string;
  //   userAgent?: string;
  // }): Promise<TResponse<{ session: UserSession; account: Account }>> {
  //   try {
  //     // 1. 认证用户
  //     const response = await this.authService.login(credentials);
      
  //     if (!response.success || !response.accountId) {
  //       return {
  //         success: false,
  //         message: response.message,
  //         data: undefined
  //       };
  //     }

  //     // 2. 获取账号信息
  //     const account = await this.accountRepository.findById(response.accountId);
  //     if (!account) {
  //       return {
  //         success: false,
  //         message: '账号信息不存在',
  //         data: undefined
  //       };
  //     }

  //     // 3. 创建会话
  //     const sessionResult = await this.sessionService.createSession(
  //       response.accountId,
  //       response.username!,
  //       account.accountType,
  //       {
  //         rememberMe: credentials.remember,
  //         autoLogin: credentials.remember,
  //         ipAddress: sessionOptions?.ipAddress,
  //         userAgent: sessionOptions?.userAgent
  //       }
  //     );

  //     if (!sessionResult.success || !sessionResult.data) {
  //       return {
  //         success: false,
  //         message: '创建会话失败',
  //         data: undefined
  //       };
  //     }

  //     return {
  //       success: true,
  //       message: '登录成功',
  //       data: {
  //         session: sessionResult.data,
  //         account
  //       }
  //     };

  //   } catch (error) {
  //     console.error('登录流程失败:', error);
  //     return {
  //       success: false,
  //       message: '登录失败，请稍后重试',
  //       data: undefined
  //     };
  //   }
  // }

  /**
   * 用户注册流程
   */
  async register(registerData: AccountRegistrationRequest): Promise<TResponse<Account>> {
    try {
      // 1. 注册账号
      const response = await this.localAccountService.register(registerData);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          message: response.message,
          data: undefined
        };
      }

      return {
        success: true,
        message: '注册成功',
        data: response.data
      };

    } catch (error) {
      console.error('注册流程失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试',
        data: undefined
      };
    }
  }

  // /**
  //  * 更新账号信息
  //  */
  // async updateAccountInfo(
  //   accountId: string,
  //   updateData: {
  //     email?: string;
  //     phone?: string;
  //     firstName?: string;
  //     lastName?: string;
  //     bio?: string;
  //     avatar?: string;
  //   }
  // ): Promise<TResponse<Account>> {
  //   try {
  //     // 1. 获取账号
  //     const account = await this.accountRepository.findById(accountId);
  //     if (!account) {
  //       return {
  //         success: false,
  //         message: '账号不存在',
  //         data: undefined
  //       };
  //     }

  //     // 2. 更新信息
  //     if (updateData.email) {
  //       account.updateEmail(updateData.email);
  //     }
      
  //     if (updateData.phone) {
  //       account.updatePhone(updateData.phone);
  //     }

  //     if (updateData.firstName || updateData.lastName || updateData.bio) {
  //       account.user.updateProfile(
  //         updateData.firstName, 
  //         updateData.lastName, 
  //         updateData.bio
  //       );
  //     }

  //     if (updateData.avatar) {
  //       account.user.updateAvatar(updateData.avatar);
  //     }

  //     // 3. 保存账号
  //     await this.accountRepository.save(account);

  //     return {
  //       success: true,
  //       message: '信息更新成功',
  //       data: account
  //     };

  //   } catch (error) {
  //     console.error('更新账号信息失败:', error);
  //     return {
  //       success: false,
  //       message: error instanceof Error ? error.message : '更新失败',
  //       data: undefined
  //     };
  //   }
  // }

  // /**
  //  * 验证会话
  //  */
  // async validateSession(token: string): Promise<TResponse<{ session: UserSession; account: Account }>> {
  //   try {
  //     // 1. 验证会话
  //     const sessionResult = await this.sessionService.validateSession(token);
      
  //     if (!sessionResult.success || !sessionResult.data) {
  //       return {
  //         success: false,
  //         message: sessionResult.message,
  //         data: undefined
  //       };
  //     }

  //     // 2. 获取账号信息
  //     const account = await this.accountRepository.findById(sessionResult.data.accountId);
  //     if (!account) {
  //       return {
  //         success: false,
  //         message: '账号信息不存在',
  //         data: undefined
  //       };
  //     }

  //     return {
  //       success: true,
  //       message: '会话有效',
  //       data: {
  //         session: sessionResult.data,
  //         account
  //       }
  //     };

  //   } catch (error) {
  //     console.error('验证会话失败:', error);
  //     return {
  //       success: false,
  //       message: '验证失败',
  //       data: undefined
  //     };
  //   }
  // }

  // /**
  //  * 获取所有用户
  //  */
  // async getAllUsers(): Promise<TResponse<Account[]>> {
  //   try {
  //     const accounts = await this.accountRepository.findAll();
      
  //     return {
  //       success: true,
  //       message: '获取成功',
  //       data: accounts
  //     };

  //   } catch (error) {
  //     console.error('获取用户列表失败:', error);
  //     return {
  //       success: false,
  //       message: '获取失败',
  //       data: undefined
  //     };
  //   }
  // }
}
