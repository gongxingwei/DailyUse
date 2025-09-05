/**
 * 认证相关API服务
 */

import { api } from '../instances';
import type { RequestOptions } from '../core/types';
import type {
  FrontendLoginRequest,
  FrontendLoginResponse,
  FrontendUserInfo,
  RefreshTokenRequest,
  SessionInfo,
  MFAVerifyRequest,
} from '@dailyuse/contracts';

// 重新导出常用类型
export type LoginRequest = FrontendLoginRequest;
export type LoginResponse = FrontendLoginResponse;
export type UserInfo = FrontendUserInfo;
export type { RefreshTokenRequest, SessionInfo, MFAVerifyRequest };

/**
 * 认证API服务
 */
export class AuthService {
  /**
   * 用户登录
   */
  static async login(data: LoginRequest, options?: RequestOptions): Promise<LoginResponse> {
    return api.post('/auth/login', data, options);
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
    return api.get('/auth/me', options);
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
}
