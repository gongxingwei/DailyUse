import {
  AuthSession,
  AuthCredentials,
  PasswordResetRequest,
  VerificationCode,
} from '../../domain/models/Auth';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthApiClient } from '../api/ApiClient';

/**
 * Authentication Repository Implementation
 * 认证仓储实现 - 基于API客户端和本地存储的认证仓储
 */
export class AuthRepositoryImpl implements IAuthRepository {
  private readonly apiClient: AuthApiClient;
  private readonly storageKey: string = 'auth_session';

  constructor(apiClient: AuthApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 用户登录
   */
  async login(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      const loginResponse = await this.apiClient.login(credentials);

      // 创建认证会话对象
      const session = new AuthSession(
        loginResponse.accessToken,
        loginResponse.refreshToken,
        loginResponse.user.id,
        new Date(Date.now() + loginResponse.expiresIn * 1000),
        new Date(),
        'web-client',
        this.getClientIpAddress(),
      );

      // 保存会话到本地存储
      await this.saveSession(session);

      return session;
    } catch (error) {
      console.error('Login error in repository:', error);
      throw new Error('Login failed');
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthSession> {
    try {
      const refreshResponse = await this.apiClient.refreshToken(refreshToken);

      // 获取当前会话信息
      const currentSession = await this.getCurrentSession();
      if (!currentSession) {
        throw new Error('No current session found');
      }

      // 创建新的会话对象
      const newSession = new AuthSession(
        refreshResponse.accessToken,
        refreshResponse.refreshToken,
        currentSession.userId,
        new Date(Date.now() + refreshResponse.expiresIn * 1000),
        currentSession.issuedAt,
        currentSession.deviceInfo,
        currentSession.ipAddress,
      );

      // 保存新会话
      await this.saveSession(newSession);

      return newSession;
    } catch (error) {
      console.error('Token refresh error in repository:', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await this.apiClient.logout(refreshToken);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // 清除本地会话
      await this.clearSession();
    }
  }

  /**
   * 验证访问令牌
   */
  async validateToken(accessToken: string): Promise<{
    valid: boolean;
    userId?: string;
    expiresAt?: Date;
  }> {
    try {
      const validation = await this.apiClient.validateToken(accessToken);

      return {
        valid: validation.valid,
        userId: validation.userId,
        expiresAt: validation.expiresAt ? new Date(validation.expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  }

  /**
   * 获取当前会话
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const sessionData = localStorage.getItem(this.storageKey);
      if (!sessionData) {
        return null;
      }

      const parsed = JSON.parse(sessionData);

      // 重建AuthSession对象
      const session = new AuthSession(
        parsed.accessToken,
        parsed.refreshToken,
        parsed.userId,
        new Date(parsed.expiresAt),
        new Date(parsed.issuedAt),
        parsed.deviceInfo,
        parsed.ipAddress,
      );

      // 检查会话是否过期
      if (session.isAccessTokenExpired()) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Get current session error:', error);
      await this.clearSession(); // 清除损坏的会话数据
      return null;
    }
  }

  /**
   * 保存会话到本地存储
   */
  async saveSession(session: AuthSession): Promise<void> {
    try {
      const sessionData = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
        issuedAt: session.issuedAt.toISOString(),
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
      };

      localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Save session error:', error);
      throw new Error('Failed to save session');
    }
  }

  /**
   * 清除本地会话
   */
  async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  }

  /**
   * 发送密码重置请求
   */
  async requestPasswordReset(identifier: string): Promise<PasswordResetRequest> {
    try {
      const response = await this.apiClient.requestPasswordReset(identifier);

      if (!response.success) {
        throw new Error(response.message);
      }

      // 创建密码重置请求对象
      const resetRequest = PasswordResetRequest.create(
        identifier,
        'email',
        this.getClientIpAddress(),
      );

      return resetRequest;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * 验证密码重置请求
   */
  async validateResetRequest(requestId: string, code: string): Promise<boolean> {
    try {
      const response = await this.apiClient.validateResetRequest(requestId, code);
      return response.valid;
    } catch (error) {
      console.error('Validate reset request error:', error);
      return false;
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(requestId: string, code: string, newPassword: string): Promise<void> {
    try {
      const response = await this.apiClient.resetPassword(requestId, code, newPassword);

      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await this.apiClient.changePassword(
        currentPassword,
        newPassword,
        session.accessToken,
      );

      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(target: string, type: 'sms' | 'email'): Promise<VerificationCode> {
    try {
      const response = await this.apiClient.sendVerificationCode(target, type);

      if (!response.success) {
        throw new Error(response.message);
      }

      // 创建验证码对象
      const verificationCode =
        type === 'email'
          ? VerificationCode.generateEmailCode(target)
          : VerificationCode.generateSMSCode(target);

      return verificationCode;
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(target: string, code: string): Promise<boolean> {
    try {
      const response = await this.apiClient.verifyCode(target, code);
      return response.valid;
    } catch (error) {
      console.error('Verify code error:', error);
      return false;
    }
  }

  /**
   * 获取所有活跃会话
   */
  async getActiveSessions(): Promise<AuthSession[]> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return [];
      }

      const response = await this.apiClient.getActiveSessions(session.accessToken);

      // 转换API响应为AuthSession对象
      const sessions = response.sessions.map(
        (sessionData) =>
          new AuthSession(
            session.accessToken, // 当前令牌
            session.refreshToken, // 当前刷新令牌
            session.userId,
            new Date(sessionData.lastActivity),
            new Date(sessionData.loginTime),
            sessionData.deviceInfo,
            sessionData.ipAddress,
          ),
      );

      return sessions;
    } catch (error) {
      console.error('Get active sessions error:', error);
      return [];
    }
  }

  /**
   * 注销指定设备的会话
   */
  async logoutDevice(sessionId: string): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await this.apiClient.logoutDevice(sessionId, session.accessToken);

      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Logout device error:', error);
      throw error;
    }
  }

  /**
   * 注销所有其他设备
   */
  async logoutOtherDevices(): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await this.apiClient.logoutOtherDevices(session.accessToken);

      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Logout other devices error:', error);
      throw error;
    }
  }

  // ===== Private Helper Methods =====

  /**
   * 获取客户端IP地址（简化实现）
   */
  private getClientIpAddress(): string {
    // 在实际应用中，这可能通过服务器端获取或使用第三方服务
    return 'unknown';
  }
}
