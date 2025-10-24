import { UserSession, SessionStatus, SessionData } from '../domain/types';
import { ISessionRepository } from '../domain/repositories/sessionRepository';
import type { ApiResponse } from '@dailyuse/contracts';
import { addDays, isBefore } from 'date-fns';
/**
 * 会话管理服务
 * 负责用户会话的创建、维护、验证和销毁
 */
export class SessionManagementService {
  private static instance: SessionManagementService;

  constructor(private sessionRepository: ISessionRepository) {}

  public static getInstance(sessionRepository: ISessionRepository): SessionManagementService {
    if (!SessionManagementService.instance) {
      SessionManagementService.instance = new SessionManagementService(sessionRepository);
    }
    return SessionManagementService.instance;
  }

  /**
   * 创建用户会话
   */
  async createSession(
    accountUuid: string,
    username: string,
    accountType: string,
    options: {
      rememberMe?: boolean;
      autoLogin?: boolean;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<ApiResponse<UserSession>> {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();

      // 计算过期时间
      let expiresAt;
      if (options.rememberMe) {
        // 记住我：30天过期
        expiresAt = addDays(now, 30);
      } else {
        // 默认：24小时过期
        expiresAt = addDays(now, 1);
      }

      const session: UserSession = {
        uuid: sessionId,
        accountUuid,
        username,
        accountType,
        token: this.generateToken(),
        refreshToken: this.generateToken(),
        rememberMe: options.rememberMe || false,
        autoLogin: options.autoLogin || false,
        status: SessionStatus.ACTIVE,
        createdAt: now,
        lastAccessAt: now,
        expiresAt,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      };

      await this.sessionRepository.save(session);

      return {
        success: true,
        message: '会话创建成功',
        data: session,
      };
    } catch (error) {
      console.error('创建会话失败:', error);
      return {
        success: false,
        message: '创建会话失败',
        data: undefined,
      };
    }
  }

  /**
   * 验证会话
   */
  async validateSession(token: string): Promise<ApiResponse<UserSession>> {
    try {
      const session = await this.sessionRepository.findByToken(token);

      if (!session) {
        return {
          success: false,
          message: '会话不存在',
          data: undefined,
        };
      }

      // 检查会话状态
      if (session.status !== SessionStatus.ACTIVE) {
        return {
          success: false,
          message: '会话已失效',
          data: undefined,
        };
      }

      // 检查是否过期
      if (session.expiresAt && isBefore(session.expiresAt, new Date())) {
        session.status = SessionStatus.EXPIRED;
        await this.sessionRepository.save(session);

        return {
          success: false,
          message: '会话已过期',
          data: undefined,
        };
      }

      // 更新最后访问时间
      session.lastAccessAt = new Date();
      await this.sessionRepository.save(session);

      return {
        success: true,
        message: '会话有效',
        data: session,
      };
    } catch (error) {
      console.error('验证会话失败:', error);
      return {
        success: false,
        message: '验证会话失败',
        data: undefined,
      };
    }
  }

  /**
   * 刷新会话
   */
  async refreshSession(refreshToken: string): Promise<ApiResponse<UserSession>> {
    try {
      // 找到使用此刷新令牌的会话
      const sessions = await this.sessionRepository.findActiveSessions();
      const session = sessions.find((s) => s.refreshToken === refreshToken);

      if (!session) {
        return {
          success: false,
          message: '刷新令牌无效',
          data: undefined,
        };
      }

      // 生成新的令牌
      session.token = this.generateToken();
      session.refreshToken = this.generateToken();
      session.lastAccessAt = new Date();

      // 更新过期时间
      if (session.rememberMe) {
        session.expiresAt = addDays(new Date(), 30);
      } else {
        session.expiresAt = addDays(new Date(), 1);
      }

      await this.sessionRepository.save(session);

      return {
        success: true,
        message: '会话刷新成功',
        data: session,
      };
    } catch (error) {
      console.error('刷新会话失败:', error);
      return {
        success: false,
        message: '刷新会话失败',
        data: undefined,
      };
    }
  }

  /**
   * 销毁会话（登出）
   */
  async destroySession(token: string): Promise<ApiResponse> {
    try {
      const session = await this.sessionRepository.findByToken(token);

      if (!session) {
        return {
          success: false,
          message: '会话不存在',
          data: undefined,
        };
      }

      session.status = SessionStatus.REVOKED;
      await this.sessionRepository.save(session);

      return {
        success: true,
        message: '登出成功',
        data: undefined,
      };
    } catch (error) {
      console.error('销毁会话失败:', error);
      return {
        success: false,
        message: '登出失败',
        data: undefined,
      };
    }
  }

  /**
   * 销毁用户的所有会话
   */
  async destroyAllUserSessions(accountUuid: string): Promise<ApiResponse> {
    try {
      const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);

      for (const session of sessions) {
        session.status = SessionStatus.REVOKED;
        await this.sessionRepository.save(session);
      }

      return {
        success: true,
        message: '所有会话已销毁',
        data: undefined,
      };
    } catch (error) {
      console.error('销毁所有会话失败:', error);
      return {
        success: false,
        message: '销毁会话失败',
        data: undefined,
      };
    }
  }

  /**
   * 获取用户活动会话
   */
  async getUserActiveSessions(accountUuid: string): Promise<ApiResponse<UserSession[]>> {
    try {
      const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);
      const activeSessions = sessions.filter((s) => s.status === SessionStatus.ACTIVE);

      return {
        success: true,
        message: '获取成功',
        data: activeSessions,
      };
    } catch (error) {
      console.error('获取用户会话失败:', error);
      return {
        success: false,
        message: '获取会话失败',
        data: undefined,
      };
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.sessionRepository.cleanup();
    } catch (error) {
      console.error('清理过期会话失败:', error);
    }
  }

  /**
   * 将旧的会话数据转换为新格式
   */
  convertLegacySessionData(sessionData: SessionData): UserSession {
    const now = new Date();
    const lastLoginTime = new Date(sessionData.lastLoginTime);

    return {
      uuid: this.generateSessionId(),
      accountUuid: sessionData.username, // 临时使用用户名作为ID
      username: sessionData.username,
      accountType: sessionData.accountType,
      token: sessionData.token,
      rememberMe: sessionData.rememberMe === 1,
      autoLogin: sessionData.autoLogin === 1,
      status: sessionData.isActive === 1 ? SessionStatus.ACTIVE : SessionStatus.EXPIRED,
      createdAt: lastLoginTime,
      lastAccessAt: now,
      expiresAt:
        sessionData.rememberMe === 1 ? addDays(lastLoginTime, 30) : addDays(lastLoginTime, 1),
    };
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成令牌
   */
  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString()
    );
  }
}
