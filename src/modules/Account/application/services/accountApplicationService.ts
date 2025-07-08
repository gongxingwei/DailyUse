import { AuthenticationService } from "@/modules/Authentication/services/authenticationService";
import { SessionManagementService } from "@/modules/SessionManagement/services/sessionManagementService";
import { IAccountRepository } from "../../domain/repositories/accountRepository";
import { Account } from "../../domain/aggregates/account";
import type { TResponse } from "@/shared/types/response";
import type { LoginCredentials, RegisterData } from "@/modules/Authentication/domain/types";
import type { UserSession } from "@/modules/SessionManagement/domain/types";

/**
 * 账号应用服务
 * 协调账号、认证和会话管理的业务流程
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;
  
  constructor(
    private authService: AuthenticationService,
    private sessionService: SessionManagementService,
    private accountRepository: IAccountRepository
  ) {}

  public static getInstance(
    authService: AuthenticationService,
    sessionService: SessionManagementService,
    accountRepository: IAccountRepository
  ): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService(
        authService, 
        sessionService, 
        accountRepository
      );
    }
    return AccountApplicationService.instance;
  }

  /**
   * 用户登录流程
   * 包含认证和会话创建
   */
  async login(credentials: LoginCredentials, sessionOptions?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<TResponse<{ session: UserSession; account: Account }>> {
    try {
      // 1. 认证用户
      const authResult = await this.authService.login(credentials);
      
      if (!authResult.success || !authResult.accountId) {
        return {
          success: false,
          message: authResult.message,
          data: undefined
        };
      }

      // 2. 获取账号信息
      const account = await this.accountRepository.findById(authResult.accountId);
      if (!account) {
        return {
          success: false,
          message: '账号信息不存在',
          data: undefined
        };
      }

      // 3. 创建会话
      const sessionResult = await this.sessionService.createSession(
        authResult.accountId,
        authResult.username!,
        account.accountType,
        {
          rememberMe: credentials.remember,
          autoLogin: credentials.remember,
          ipAddress: sessionOptions?.ipAddress,
          userAgent: sessionOptions?.userAgent
        }
      );

      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          message: '创建会话失败',
          data: undefined
        };
      }

      return {
        success: true,
        message: '登录成功',
        data: {
          session: sessionResult.data,
          account
        }
      };

    } catch (error) {
      console.error('登录流程失败:', error);
      return {
        success: false,
        message: '登录失败，请稍后重试',
        data: undefined
      };
    }
  }

  /**
   * 用户注册流程
   */
  async register(registerData: RegisterData): Promise<TResponse<Account>> {
    try {
      // 1. 注册账号
      const authResult = await this.authService.register(registerData);
      
      if (!authResult.success || !authResult.accountId) {
        return {
          success: false,
          message: authResult.message,
          data: undefined
        };
      }

      // 2. 获取创建的账号
      const account = await this.accountRepository.findById(authResult.accountId);
      if (!account) {
        return {
          success: false,
          message: '注册失败，无法获取账号信息',
          data: undefined
        };
      }

      return {
        success: true,
        message: '注册成功',
        data: account
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

  /**
   * 用户登出流程
   */
  async logout(token: string): Promise<TResponse> {
    try {
      // 销毁会话
      const result = await this.sessionService.destroySession(token);
      
      return result;

    } catch (error) {
      console.error('登出流程失败:', error);
      return {
        success: false,
        message: '登出失败，请稍后重试',
        data: undefined
      };
    }
  }

  /**
   * 注销账号流程
   */
  async deregisterAccount(accountId: string): Promise<TResponse> {
    try {
      // 1. 销毁所有会话
      await this.sessionService.destroyAllUserSessions(accountId);

      // 2. 删除账号
      await this.accountRepository.delete(accountId);

      return {
        success: true,
        message: '账号注销成功',
        data: undefined
      };

    } catch (error) {
      console.error('注销账号失败:', error);
      return {
        success: false,
        message: '注销失败，请稍后重试',
        data: undefined
      };
    }
  }

  /**
   * 修改密码流程
   */
  async changePassword(
    accountId: string, 
    oldPassword: string, 
    newPassword: string
  ): Promise<TResponse> {
    try {
      // 1. 获取账号
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      // 2. 修改密码
      account.changePassword(oldPassword, newPassword);

      // 3. 保存账号
      await this.accountRepository.save(account);

      // 4. 销毁其他会话（强制重新登录）
      await this.sessionService.destroyAllUserSessions(accountId);

      return {
        success: true,
        message: '密码修改成功',
        data: undefined
      };

    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '修改密码失败',
        data: undefined
      };
    }
  }

  /**
   * 更新账号信息
   */
  async updateAccountInfo(
    accountId: string,
    updateData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatar?: string;
    }
  ): Promise<TResponse<Account>> {
    try {
      // 1. 获取账号
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      // 2. 更新信息
      if (updateData.email) {
        account.updateEmail(updateData.email);
      }
      
      if (updateData.phone) {
        account.updatePhone(updateData.phone);
      }

      if (updateData.firstName || updateData.lastName || updateData.bio) {
        account.user.updateProfile(
          updateData.firstName, 
          updateData.lastName, 
          updateData.bio
        );
      }

      if (updateData.avatar) {
        account.user.updateAvatar(updateData.avatar);
      }

      // 3. 保存账号
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '信息更新成功',
        data: account
      };

    } catch (error) {
      console.error('更新账号信息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新失败',
        data: undefined
      };
    }
  }

  /**
   * 验证会话
   */
  async validateSession(token: string): Promise<TResponse<{ session: UserSession; account: Account }>> {
    try {
      // 1. 验证会话
      const sessionResult = await this.sessionService.validateSession(token);
      
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          message: sessionResult.message,
          data: undefined
        };
      }

      // 2. 获取账号信息
      const account = await this.accountRepository.findById(sessionResult.data.accountId);
      if (!account) {
        return {
          success: false,
          message: '账号信息不存在',
          data: undefined
        };
      }

      return {
        success: true,
        message: '会话有效',
        data: {
          session: sessionResult.data,
          account
        }
      };

    } catch (error) {
      console.error('验证会话失败:', error);
      return {
        success: false,
        message: '验证失败',
        data: undefined
      };
    }
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<TResponse<Account[]>> {
    try {
      const accounts = await this.accountRepository.findAll();
      
      return {
        success: true,
        message: '获取成功',
        data: accounts
      };

    } catch (error) {
      console.error('获取用户列表失败:', error);
      return {
        success: false,
        message: '获取失败',
        data: undefined
      };
    }
  }
}
