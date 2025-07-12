import { IAuthCredentialRepository } from "../../domain/repositories/authenticationRepository";
import { ISessionRepository } from "../../../SessionManagement/domain/repositories/sessionRepository";
import { 
  UserLoggedOutEvent,
  SessionTerminatedEvent,
  AllSessionsTerminatedEvent
} from "../../domain/events/authenticationEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { generateUUID } from "@/shared/utils/uuid";
import { UserSession } from "../../../SessionManagement/domain/types";
import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";


/**
 * 注销请求数据
 */
export interface LogoutRequest {
  sessionId?: string;
  accountId?: string;
  username?: string;
  logoutType: 'manual' | 'forced' | 'expired' | 'system';
  reason?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 注销结果
 */
export interface LogoutResult {
  success: boolean;
  sessionId?: string;
  accountId?: string;
  username?: string;
  message: string;
  terminatedSessionsCount?: number;
  errorCode?: 'SESSION_NOT_FOUND' | 'ALREADY_LOGGED_OUT' | 'INVALID_REQUEST';
}

/**
 * Authentication 模块的注销服务
 */
export class AuthenticationLogoutService {
  private static instance: AuthenticationLogoutService;
  private authCredentialRepository: IAuthCredentialRepository;
  constructor(authCredentialRepository: IAuthCredentialRepository) {
    
    this.authCredentialRepository = authCredentialRepository;
  }
  static async createInstance(): Promise<AuthenticationLogoutService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    const authCredentialRepository = authenticationContainer.getAuthCredentialRepository();
    return new AuthenticationLogoutService(authCredentialRepository);
  }
  static async getInstance(): Promise<AuthenticationLogoutService> {
    if (!AuthenticationLogoutService.instance) {
      AuthenticationLogoutService.instance = await this.createInstance();
    }
    return AuthenticationLogoutService.instance;
  }

  /**
   * 处理用户注销请求
   */
  async logout(request: LogoutRequest): Promise<LogoutResult> {
    const { sessionId, accountId, username, logoutType, reason, clientInfo } = request;

    try {
      // 1. 查找会话
      let session: UserSession | null = null;
      let targetAccountId = accountId;
      let targetUsername = username;

      if (sessionId) {
        session = await this.sessionRepository.findById(sessionId);
        if (!session) {
          return {
            success: false,
            message: '会话不存在',
            errorCode: 'SESSION_NOT_FOUND'
          };
        }
        targetAccountId = session.accountId;
      } else if (accountId) {
        // 如果只提供了 accountId，终止该用户的所有会话
        return await this.logoutAllSessions({
          accountId,
          username: targetUsername || '',
          logoutType,
          reason,
          clientInfo
        });
      } else {
        return {
          success: false,
          message: '必须提供 sessionId 或 accountId',
          errorCode: 'INVALID_REQUEST'
        };
      }

      // 2. 检查会话是否已经过期或无效
      if (session && !this.isSessionActive(session)) {
        return {
          success: false,
          message: '会话已经失效',
          errorCode: 'ALREADY_LOGGED_OUT'
        };
      }

      // 3. 获取用户名（如果没有提供）
      if (!targetUsername && targetAccountId) {
        const credential = await this.authCredentialRepository.findByAccountId(targetAccountId);
        if (credential) {
          // 这里需要通过其他方式获取username，暂时使用accountId
          targetUsername = targetAccountId;
        }
      }

      // 4. 终止会话
      if (session) {
        await this.sessionRepository.delete(session.id);
      }

      // 5. 发布会话终止事件
      if (session) {
        const remainingActiveSessions = await this.getRemainingActiveSessionsCount(targetAccountId!);
        
        await eventBus.publish<SessionTerminatedEvent>({
          aggregateId: targetAccountId!,
          eventType: 'SessionTerminated',
          occurredOn: new Date(),
          payload: {
            sessionId: session.id,
            accountId: targetAccountId!,
            terminationType: this.mapLogoutTypeToTerminationType(logoutType),
            terminatedAt: new Date(),
            remainingActiveSessions
          }
        });
      }

      // 6. 发布用户注销事件
      await eventBus.publish<UserLoggedOutEvent>({
        aggregateId: targetAccountId!,
        eventType: 'UserLoggedOut',
        occurredOn: new Date(),
        payload: {
          accountId: targetAccountId!,
          username: targetUsername || '',
          sessionId: session?.id || '',
          logoutType,
          logoutReason: reason,
          loggedOutAt: new Date(),
          clientInfo
        }
      });

      return {
        success: true,
        sessionId: session?.id,
        accountId: targetAccountId,
        username: targetUsername,
        message: '注销成功',
        terminatedSessionsCount: 1
      };

    } catch (error) {
      console.error('注销处理失败:', error);
      return {
        success: false,
        message: '注销处理失败',
        errorCode: 'INVALID_REQUEST'
      };
    }
  }

  /**
   * 注销用户的所有会话
   */
  async logoutAllSessions(request: {
    accountId: string;
    username: string;
    logoutType: 'manual' | 'forced' | 'expired' | 'system';
    reason?: string;
    clientInfo?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    };
  }): Promise<LogoutResult> {
    const { accountId, username, logoutType, reason, clientInfo } = request;

    try {
      // 1. 获取用户的所有活跃会话
      const activeSessions = await this.sessionRepository.findByAccountId(accountId);
      const activeSessionsCount = activeSessions.filter(s => this.isSessionActive(s)).length;

      // 2. 删除所有会话
      await this.sessionRepository.deleteByAccountId(accountId);

      // 3. 发布全部会话终止事件
      await eventBus.publish<AllSessionsTerminatedEvent>({
        aggregateId: accountId,
        eventType: 'AllSessionsTerminated',
        occurredOn: new Date(),
        payload: {
          accountId,
          username,
          terminationType: this.mapLogoutTypeToTerminationType(logoutType) as any,
          terminatedSessionCount: activeSessionsCount,
          terminatedAt: new Date()
        }
      });

      // 4. 为每个会话发布注销事件
      for (const session of activeSessions) {
        if (this.isSessionActive(session)) {
          await eventBus.publish<UserLoggedOutEvent>({
            aggregateId: accountId,
            eventType: 'UserLoggedOut',
            occurredOn: new Date(),
            payload: {
              accountId,
              username,
              sessionId: session.id,
              logoutType,
              logoutReason: reason,
              loggedOutAt: new Date(),
              clientInfo
            }
          });
        }
      }

      return {
        success: true,
        accountId,
        username,
        message: `成功注销 ${activeSessionsCount} 个活跃会话`,
        terminatedSessionsCount: activeSessionsCount
      };

    } catch (error) {
      console.error('批量注销处理失败:', error);
      return {
        success: false,
        accountId,
        username,
        message: '批量注销处理失败',
        errorCode: 'INVALID_REQUEST'
      };
    }
  }

  /**
   * 强制注销指定用户（管理员操作）
   */
  async forceLogout(accountId: string, reason: string, adminInfo?: {
    adminId: string;
    adminUsername: string;
  }): Promise<LogoutResult> {
    // 获取用户名
    let username = '';
    try {
      const credential = await this.authCredentialRepository.findByAccountId(accountId);
      if (credential) {
        username = accountId; // 暂时使用accountId作为username
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }

    return await this.logoutAllSessions({
      accountId,
      username,
      logoutType: 'forced',
      reason: `管理员强制注销: ${reason}${adminInfo ? ` (操作员: ${adminInfo.adminUsername})` : ''}`,
      clientInfo: adminInfo ? {
        userAgent: `Admin: ${adminInfo.adminUsername}`,
        deviceId: `admin-${adminInfo.adminId}`
      } : undefined
    });
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      // 获取所有活跃会话
      const allSessions = await this.sessionRepository.findActiveSessions();
      let cleanedCount = 0;

      for (const session of allSessions) {
        if (!this.isSessionActive(session)) {
          await this.logout({
            sessionId: session.id,
            logoutType: 'expired',
            reason: '会话过期自动清理'
          });
          cleanedCount++;
        }
      }

      // 执行仓库层的清理
      await this.sessionRepository.cleanup();

      return cleanedCount;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      return 0;
    }
  }

  /**
   * 检查会话是否仍然活跃
   */
  private isSessionActive(session: UserSession): boolean {
    if (!session.expiresAt) {
      return true; // 永不过期的会话
    }
    return new Date() < session.expiresAt;
  }

  /**
   * 获取用户剩余的活跃会话数量
   */
  private async getRemainingActiveSessionsCount(accountId: string): Promise<number> {
    try {
      const sessions = await this.sessionRepository.findByAccountId(accountId);
      return sessions.filter(s => this.isSessionActive(s)).length;
    } catch (error) {
      console.error('获取活跃会话数量失败:', error);
      return 0;
    }
  }

  /**
   * 映射注销类型到终止类型
   */
  private mapLogoutTypeToTerminationType(
    logoutType: 'manual' | 'forced' | 'expired' | 'system'
  ): 'logout' | 'timeout' | 'forced' | 'concurrent_login' {
    switch (logoutType) {
      case 'manual':
        return 'logout';
      case 'expired':
        return 'timeout';
      case 'forced':
      case 'system':
        return 'forced';
      default:
        return 'logout';
    }
  }
}
