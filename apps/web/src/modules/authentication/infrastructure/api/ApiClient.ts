/**
 * 认证API服务
 * 基于新的API客户端系统，提供类型安全的认证相关API调用
 */

import { api, publicApiClient } from '../../../../shared/api/instances';
import type { RequestOptions } from '../../../../shared/api/core/types';
import type {
  FrontendLoginRequest,
  FrontendLoginResponse,
  FrontendUserInfo,
  RefreshTokenRequest,
  SessionInfo,
  MFAVerifyRequest,
  AuthByPasswordRequestDTO,
  AuthResponseDTO,
  AuthByPasswordForm,
  SuccessResponse,
  ApiResponse,
} from '@dailyuse/contracts';

// 重新导出常用类型
export type LoginRequest = FrontendLoginRequest;
export type LoginResponse = FrontendLoginResponse;
export type UserInfo = FrontendUserInfo;
export type { RefreshTokenRequest, SessionInfo, MFAVerifyRequest };

/**
 * 认证API服务
 * 负责与后端认证API的通信，提供完整的认证功能
 */
export class AuthApiService {
  /**
   * 用户登录
   */
  static async login(data: LoginRequest, options?: RequestOptions): Promise<LoginResponse> {
    return api.post('/auth/login', data, options);
  }

  /**
   * 用户登录（兼容旧格式）
   */
  static async loginCompat(
    credentials: AuthByPasswordRequestDTO,
  ): Promise<SuccessResponse<AuthResponseDTO>> {
    const loginData: LoginRequest = {
      username: credentials.username,
      password: credentials.password,
      rememberMe: credentials.remember,
      deviceInfo: {
        deviceId: 'web-client',
        deviceName: 'Web Browser',
        userAgent: navigator.userAgent,
      },
    };

    const result = await this.login(loginData);

    // 转换为标准响应格式以保持兼容性
    return {
      status: 'SUCCESS',
      success: true,
      message: 'Login successful',
      data: {
        accountUuid: result.user.uuid,
        username: result.user.username,
        sessionUuid: '', // 新API中没有sessionUuid
        rememberToken: undefined, // 新API中没有rememberToken
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
      },
      metadata: {
        timestamp: Date.now(),
      },
    } as SuccessResponse<AuthResponseDTO>;
  }

  /**
   * MFA验证
   */
  static async verifyMFA(data: MFAVerifyRequest, options?: RequestOptions): Promise<LoginResponse> {
    return api.post('/auth/mfa/verify', data, options);
  }

  /**
   * 用户登出
   */
  static async logout(options?: RequestOptions): Promise<void> {
    return api.post('/auth/logout', {}, options);
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(
    data: RefreshTokenRequest,
    options?: RequestOptions,
  ): Promise<LoginResponse> {
    return api.post('/auth/refresh', data, options);
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(options?: RequestOptions): Promise<UserInfo> {
    return api.get('/auth/user', options);
  }

  /**
   * 修改密码
   */
  static async changePassword(
    data: {
      currentPassword: string;
      newPassword: string;
    },
    options?: RequestOptions,
  ): Promise<void> {
    return api.post('/auth/change-password', data, options);
  }

  /**
   * 获取用户会话列表
   */
  static async getSessions(options?: RequestOptions): Promise<SessionInfo[]> {
    return api.get('/auth/sessions', options);
  }

  /**
   * 终止指定会话
   */
  static async terminateSession(sessionId: string, options?: RequestOptions): Promise<void> {
    return api.delete(`/auth/sessions/${sessionId}`, options);
  }

  /**
   * 终止其他所有会话
   */
  static async terminateOtherSessions(options?: RequestOptions): Promise<void> {
    return api.post('/auth/sessions/terminate-others', {}, options);
  }

  /**
   * 验证访问令牌
   */
  static async validateToken(
    options?: RequestOptions,
  ): Promise<{ valid: boolean; user?: UserInfo }> {
    return api.get('/auth/validate', options);
  }

  /**
   * 发送密码重置邮件
   */
  static async requestPasswordReset(
    email: string,
    options?: RequestOptions,
  ): Promise<{ message: string }> {
    return api.post('/auth/password-reset/request', { email }, options);
  }

  /**
   * 重置密码
   */
  static async resetPassword(
    data: {
      token: string;
      newPassword: string;
    },
    options?: RequestOptions,
  ): Promise<{ message: string }> {
    return api.post('/auth/password-reset/confirm', data, options);
  }
}

/**
 * @deprecated 旧的ApiClient类已废弃，请使用AuthApiService
 * 保留此类仅为了向后兼容
 */
export class ApiClient {
  private static instance: ApiClient;

  constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * 用户登录API调用（兼容旧接口）
   */
  async login(credentials: AuthByPasswordRequestDTO): Promise<SuccessResponse<AuthResponseDTO>> {
    return AuthApiService.loginCompat(credentials);
  }

  /**
   * 刷新访问令牌API调用
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const result = await AuthApiService.refreshToken({ refreshToken });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * 用户登出API调用
   */
  async logout(refreshToken?: string): Promise<void> {
    return AuthApiService.logout();
  }

  /**
   * 验证访问令牌API调用
   */
  async validateToken(accessToken?: string): Promise<{
    valid: boolean;
    userId?: string;
    expiresAt?: string;
  }> {
    const result = await AuthApiService.validateToken();
    return {
      valid: result.valid,
      userId: result.user?.id,
      expiresAt: undefined, // 不在新API中提供
    };
  }

  /**
   * 发送密码重置请求API调用
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    const result = await AuthApiService.requestPasswordReset(email);
    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * 修改密码API调用
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    accessToken?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await AuthApiService.changePassword({ currentPassword, newPassword });
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * 获取活跃会话API调用
   */
  async getActiveSessions(accessToken?: string): Promise<{
    sessions: Array<{
      sessionId: string;
      deviceInfo: string;
      ipAddress: string;
      loginTime: string;
      lastActivity: string;
      isActive: boolean;
    }>;
  }> {
    const sessions = await AuthApiService.getSessions();
    return {
      sessions: sessions.map((session) => ({
        sessionId: session.id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        loginTime: session.lastActivity, // 映射到可用字段
        lastActivity: session.lastActivity,
        isActive: session.isCurrent,
      })),
    };
  }

  /**
   * 注销指定设备API调用
   */
  async logoutDevice(
    sessionId: string,
    accessToken?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await AuthApiService.terminateSession(sessionId);
    return {
      success: true,
      message: 'Session terminated successfully',
    };
  }

  /**
   * 注销其他所有设备API调用
   */
  async logoutOtherDevices(accessToken?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    await AuthApiService.terminateOtherSessions();
    return {
      success: true,
      message: 'Other sessions terminated successfully',
    };
  }
}
