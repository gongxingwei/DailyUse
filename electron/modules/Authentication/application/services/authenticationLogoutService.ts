import { IAuthCredentialRepository, ISessionRepository } from "../../domain/repositories/authenticationRepository";
import { eventBus } from "../../../../shared/events/eventBus";
import { Session } from "../../domain/entities/session";
import { AuthenticationContainer } from "../../infrastructure/di/authenticationContainer";
import { LogoutRequest, LogoutResult } from "../../domain/types";
import { authSession } from "../../application/services/authSessionStore";


/**
 * Authentication 模块的注销服务
 */
export class AuthenticationLogoutService {
  private static instance: AuthenticationLogoutService;
  private authCredentialRepository: IAuthCredentialRepository;
  private sessionRepository: ISessionRepository;

  constructor(authCredentialRepository: IAuthCredentialRepository, sessionRepository: ISessionRepository) {
    this.authCredentialRepository = authCredentialRepository;
    this.sessionRepository = sessionRepository;
  }
  static async createInstance(authCredentialRepository?: IAuthCredentialRepository, sessionRepository?: ISessionRepository): Promise<AuthenticationLogoutService> {
    const authenticationContainer = await AuthenticationContainer.getInstance();
    const authCredentialRepo = authCredentialRepository || authenticationContainer.getAuthCredentialRepository();
    const sessionRepo = sessionRepository || authenticationContainer.getSessionRepository();
    return new AuthenticationLogoutService(authCredentialRepo, sessionRepo);
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
    const { sessionUuid, accountUuid, username, logoutType, reason, clientInfo } = request;

    try {
      // 1. 查找会话
      let session: Session | null = null;
      let targetAccountUuid = accountUuid;
      let targetUsername = username;

      if (sessionUuid) {
        session = await this.sessionRepository.findById(sessionUuid);
        if (!session) {
          return {
            success: false,
            message: '会话不存在',
            errorCode: 'SESSION_NOT_FOUND'
          };
        }
        targetAccountUuid = session.accountUuid;
      } else if (accountUuid) {
        // 如果只提供了 accountUuid，终止该用户的所有会话
        return await this.logoutAllSessions({
          accountUuid,
          username: targetUsername || '',
          logoutType,
          reason,
          clientInfo
        });
      } else {
        return {
          success: false,
          message: '必须提供 sessionUuid 或 accountUuid',
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
      if (!targetUsername && targetAccountUuid) {
        const credential = await this.authCredentialRepository.findByAccountUuid(targetAccountUuid);
        if (credential) {
          // 这里需要通过其他方式获取username，暂时使用accountUuid
          targetUsername = targetAccountUuid;
        }
      }

      // 4. 终止会话
      if (session) {
        await this.sessionRepository.delete(session.uuid);
      }

      authSession.clearAuthInfo(); // 清除当前会话的认证信息

      // 5. 发布会话终止事件
      if (session) {
        const remainingActiveSessions = await this.getRemainingActiveSessionsCount(targetAccountUuid!);
        
        await eventBus.publish({
          aggregateId: targetAccountUuid!,
          eventType: 'SessionTerminated',
          occurredOn: new Date(),
          payload: {
            sessionUuid: session.uuid,
            accountUuid: targetAccountUuid!,
            terminationType: this.mapLogoutTypeToTerminationType(logoutType),
            terminatedAt: new Date(),
            remainingActiveSessions
          }
        });
      }

      // 6. 发布用户登出事件
      await eventBus.publish({
        aggregateId: targetAccountUuid!,
        eventType: 'UserLoggedOut',
        occurredOn: new Date(),
        payload: {
          accountUuid: targetAccountUuid!,
          username: targetUsername || '',
          sessionUuid: session?.uuid || '',
          logoutType,
          logoutReason: reason,
          loggedOutAt: new Date(),
          clientInfo
        }
      });

      return {
        success: true,
        sessionUuid: session?.uuid,
        accountUuid: targetAccountUuid,
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
    accountUuid: string;
    username: string;
    logoutType: 'manual' | 'forced' | 'expired' | 'system';
    reason?: string;
    clientInfo?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    };
  }): Promise<LogoutResult> {
    const { accountUuid, username, logoutType, reason, clientInfo } = request;

    try {
      // 1. 获取用户的所有活跃会话
      const activeSessions = await this.sessionRepository.findByAccountUuid(accountUuid);
      const activeSessionsCount = activeSessions.filter(s => this.isSessionActive(s)).length;

      // 2. 删除所有会话
      await this.sessionRepository.deleteByAccountUuid(accountUuid);

      // 3. 发布全部会话终止事件
      await eventBus.publish({
        aggregateId: accountUuid,
        eventType: 'AllSessionsTerminated',
        occurredOn: new Date(),
        payload: {
          accountUuid,
          username,
          terminationType: this.mapLogoutTypeToTerminationType(logoutType) as any,
          terminatedSessionCount: activeSessionsCount,
          terminatedAt: new Date()
        }
      });

      // 4. 为每个会话发布注销事件
      for (const session of activeSessions) {
        if (this.isSessionActive(session)) {
          await eventBus.publish({
            aggregateId: accountUuid,
            eventType: 'UserLoggedOut',
            occurredOn: new Date(),
            payload: {
              accountUuid,
              username,
              sessionUuid: session.uuid,
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
        accountUuid,
        username,
        message: `成功注销 ${activeSessionsCount} 个活跃会话`,
        terminatedSessionsCount: activeSessionsCount
      };

    } catch (error) {
      console.error('批量注销处理失败:', error);
      return {
        success: false,
        accountUuid,
        username,
        message: '批量注销处理失败',
        errorCode: 'INVALID_REQUEST'
      };
    }
  }

  /**
   * 强制注销指定用户（管理员操作）
   */
  async forceLogout(accountUuid: string, reason: string, adminInfo?: {
    adminId: string;
    adminUsername: string;
  }): Promise<LogoutResult> {
    // 获取用户名
    let username = '';
    try {
      const credential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (credential) {
        username = accountUuid; // 暂时使用accountUuid作为username
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }

    return await this.logoutAllSessions({
      accountUuid,
      username,
      logoutType: 'forced',
      reason: `管理员强制注销: ${reason}${adminInfo ? ` (操作员: ${adminInfo.adminUsername})` : ''}`,
      clientInfo: adminInfo ? {
        userAgent: `Admin: ${adminInfo.adminUsername}`,
        deviceId: `admin-${adminInfo.adminId}`
      } : undefined
    });
  }

  // /**
  //  * 清理过期会话
  //  */
  // async cleanupExpiredSessions(): Promise<number> {
  //   try {
  //     // 获取所有活跃会话
  //     const allSessions = await this.sessionRepository.findActiveSessions();
  //     let cleanedCount = 0;

  //     for (const session of allSessions) {
  //       if (!this.isSessionActive(session)) {
  //         await this.logout({
  //           sessionUuid: session.uuid,
  //           logoutType: 'expired',
  //           reason: '会话过期自动清理'
  //         });
  //         cleanedCount++;
  //       }
  //     }

  //     // 执行仓库层的清理
  //     await this.sessionRepository.cleanup();

  //     return cleanedCount;
  //   } catch (error) {
  //     console.error('清理过期会话失败:', error);
  //     return 0;
  //   }
  // }

  /**
   * 检查会话是否仍然活跃
   */
  private isSessionActive(session: Session): boolean {
    if (!session.expiresAt) {
      return true; // 永不过期的会话
    }
    return new Date() < session.expiresAt;
  }

  /**
   * 获取用户剩余的活跃会话数量
   */
  private async getRemainingActiveSessionsCount(accountUuid: string): Promise<number> {
    try {
      const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);
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
