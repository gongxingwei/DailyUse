import axios, { type AxiosInstance,  } from 'axios';
import {
  AuthCredential,
  Session,
  Account,
  type AccountDTO,
} from '@dailyuse/domain-client';
import type { IAuthRepository, IRegistrationRepository } from '@dailyuse/domain-client';
import { type TResponse } from '../../../../shared/types/response';
import type { LoginRequestDto, LoginResponseDto } from '../../application/dtos/AuthDtos';

/**
 * Authentication API Client
 * 认证API客户端 - 封装与认证相关的HTTP请求
 */
export class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({});
  }

  /**
   * 用户登录API调用
   */
  async login(credentials: LoginRequestDto): Promise<TResponse<LoginResponseDto>> {
    const response = await this.client.post('/login', {
      username: credentials.username,
      password: credentials.password,
    });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return response.data;
  }

  /**
   * 刷新访问令牌API调用
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await this.client.post('/refresh', {
      refreshToken,
    });

    if (response.status !== 200) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return response.data;
  }

  /**
   * 用户登出API调用
   */
  async logout(refreshToken: string): Promise<void> {
    const response = await this.client.post('/logout', {
      refreshToken,
    });

    if (response.status !== 200) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }
  }

  /**
   * 验证访问令牌API调用
   */
  async validateToken(accessToken: string): Promise<{
    valid: boolean;
    userId?: string;
    expiresAt?: string;
  }> {
    const response = await this.client.post('/validate', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * 发送密码重置请求API调用
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    const response = await this.client.post('/password-reset/request', { email });
    return response.data;
  }

  /**
   * 验证密码重置令牌API调用
   */
  async validateResetRequest(
    requestId: string,
    code: string,
  ): Promise<{
    valid: boolean;
    message: string;
  }> {
    const response = await this.client.post('/password-reset/validate', { requestId, code });
    return response.data;
  }

  /**
   * 重置密码API调用
   */
  async resetPassword(
    requestId: string,
    code: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.post('/password-reset/confirm', { requestId, code, newPassword });
    return response.data;
  }

  /**
   * 修改密码API调用
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    accessToken: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.post('/password-change', { currentPassword, newPassword }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  /**
   * 发送验证码API调用
   */
  async sendVerificationCode(
    target: string,
    type: 'sms' | 'email',
  ): Promise<{
    success: boolean;
    message: string;
    codeId: string;
    expiresIn: number;
  }> {
    const response = await this.client.post('/verification-code/send', { target, type });
    return response.data;
  }

  /**
   * 验证验证码API调用
   */
  async verifyCode(
    target: string,
    code: string,
  ): Promise<{
    valid: boolean;
    message: string;
  }> {
    const response = await this.client.post('/verification-code/verify', { target, code });
    return response.data;
  }

  /**
   * 获取活跃会话API调用
   */
  async getActiveSessions(accessToken: string): Promise<{
    sessions: Array<{
      sessionId: string;
      deviceInfo: string;
      ipAddress: string;
      loginTime: string;
      lastActivity: string;
      isActive: boolean;
    }>;
  }> {
    const response = await this.client.get('/sessions', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * 注销指定设备API调用
   */
  async logoutDevice(
    sessionId: string,
    accessToken: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.delete(`/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  /**
   * 注销其他所有设备API调用
   */
  async logoutOtherDevices(accessToken: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.post('/sessions/logout-others', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }


}
