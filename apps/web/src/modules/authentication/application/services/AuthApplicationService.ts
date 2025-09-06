import {
  type AuthByPasswordForm,
  type AuthResponseDTO,
  type AuthByPasswordRequestDTO,
  type SuccessResponse,
  type ApiResponse,
} from '@dailyuse/contracts';
import type { IAuthRepository, IRegistrationRepository } from '@dailyuse/domain-client';
import { AccountType } from '@dailyuse/domain-client';
import { AuthApiService } from '../../infrastructure/api/ApiClient';
import { AuthManager } from '../../../../shared/api/core/interceptors';

/**
 * Authentication Application Service
 * 认证应用服务 - 协调领域对象和基础设施，实现认证相关用例
 */
export class AuthApplicationService {
  private static instance: AuthApplicationService | null = null;
  // private readonly authRepository: IAuthRepository | null = null;
  // private readonly registrationRepository: IRegistrationRepository | null = null;

  private constructor() {
    // 不再需要实例化ApiClient，直接使用静态方法
  }

  static async createInstance(
    authRepository?: IAuthRepository,
    registrationRepository?: IRegistrationRepository,
  ): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  static async getInstance(): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  // ===== Login Use Cases =====

  /**
   * User Login
   * 用户登录用例
   */
  async login(request: AuthByPasswordForm): Promise<SuccessResponse<AuthResponseDTO | null>> {
    try {
      const authRequest: AuthByPasswordRequestDTO = {
        ...request,
        accountType: AccountType.GUEST,
      };
      const response = await AuthApiService.loginCompat(authRequest);
      if (!response.success) {
        throw new Error(response.message);
      }

      // 使用 AuthManager 保存令牌
      if (response.data?.accessToken && response.data?.refreshToken) {
        AuthManager.setTokens(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.rememberToken,
          response.data.expiresIn || 3600, // 默认1小时
        );
      }

      console.log('登录成功，你好', response.data);
      return {
        status: 'SUCCESS',
        success: true,
        message: 'Login successful',
        data: response.data,
        metadata: {
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * User Logout
   * 用户登出用例
   */
  async logout(): Promise<void> {
    try {
      // 调用后端登出API
      // TODO: 实现登出API调用
      // await AuthApiService.logout();
    } catch (err: any) {
      console.warn('登出API调用失败:', err.message);
    } finally {
      // 清除所有令牌
      AuthManager.clearTokens();
    }
  }

  /**
   * Refresh User Info
   * 刷新用户信息用例
   */
  async refreshUser(): Promise<AuthResponseDTO> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('用户未认证');
    }

    try {
      // TODO: 实现获取用户信息API
      // const userInfo = await AuthApiService.getCurrentUser();
      // return userInfo;
      throw new Error('获取用户信息API未实现');
    } catch (err: any) {
      throw new Error(err.message || '获取用户信息失败');
    }
  }

  /**
   * Initialize Authentication
   * 初始化认证状态用例
   */
  async initAuth(): Promise<AuthResponseDTO | null> {
    if (!AuthManager.isAuthenticated()) return null;

    // 检查 Token 是否过期
    if (AuthManager.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        // Token 刷新失败，清除认证状态
        await this.logout();
        throw error;
      }
    }

    try {
      return await this.refreshUser();
    } catch (err) {
      // 如果获取用户信息失败，清除认证状态
      await this.logout();
      throw err;
    }
  }

  /**
   * Refresh Token
   * 刷新令牌用例
   */
  async refreshToken(): Promise<void> {
    const refreshToken = AuthManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // TODO: 实现刷新 Token API
      // const response = await AuthApiService.refreshToken(refreshToken);
      // AuthManager.updateAccessToken(response.accessToken, response.expiresIn);
      throw new Error('刷新令牌API未实现');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  } /**
   * Change Password
   * 修改密码用例
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // TODO: 实现修改密码API
      // await AuthApiService.changePassword({
      //   currentPassword,
      //   newPassword,
      // });
      throw new Error('修改密码API未实现');
    } catch (err: any) {
      throw new Error(err.message || '修改密码失败');
    }
  }

  /**
   * Check Permission
   * 检查权限
   */
  hasPermission(permission: string): boolean {
    // TODO: 实现权限检查逻辑
    return false;
  }

  /**
   * Check Role
   * 检查角色
   */
  hasRole(role: string): boolean {
    // TODO: 实现角色检查逻辑
    return false;
  }
}
