import { authenticationContainer } from '../../infrastructure/di/container';
import type {
  IAuthCredentialRepository,
  ITokenRepository,
  ISessionRepository,
  AccountRegisteredEvent,
} from '@dailyuse/domain-server';
import { sharedContracts, AuthenticationContracts } from '@dailyuse/contracts';

// 类型别名
type ClientInfo = sharedContracts.ClientInfo;
type AuthByPasswordRequestDTO = AuthenticationContracts.AuthByPasswordRequestDTO;
type AuthResponseDTO = AuthenticationContracts.AuthResponse;

// domains
import { AuthCredential } from '@dailyuse/domain-server';
// utils
import { eventBus, createLogger } from '@dailyuse/utils';
import { AuthenticationLoginService } from './AuthenticationLoginService';
import type { TResponse } from '../../../../tempTypes';

// 创建 logger 实例
const logger = createLogger('AuthenticationApplicationService');

/**
 * AuthenticationApplicationService
 *
 * 负责处理用户登录流程、凭证验证、账号状态校验、事件发布等。
 * 支持依赖注入、事件驱动、异步处理，保证登录流程的解耦与可扩展性。
 */
export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService | null = null;

  private authCredentialRepository: IAuthCredentialRepository;
  private tokenRepository: ITokenRepository;
  private sessionRepository: ISessionRepository;
  private loginService: AuthenticationLoginService;

  /**
   * 构造函数
   * @param authCredentialRepository 认证凭证仓库
   * @param tokenRepository 令牌仓库
   * 构造时自动注册事件监听器
   */
  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    tokenRepository: ITokenRepository,
    sessionRepository: ISessionRepository,
  ) {
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.sessionRepository = sessionRepository;
    this.loginService = new AuthenticationLoginService(
      authCredentialRepository,
      tokenRepository,
      sessionRepository,
    );
  }

  // ===================== 静态方法（单例/工厂） =====================

  /**
   * 创建服务实例（支持依赖注入）
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @returns AuthenticationApplicationService 实例
   */
  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    tokenRepository?: ITokenRepository,
    sessionRepository?: ISessionRepository,
  ): Promise<AuthenticationApplicationService> {
    authCredentialRepository =
      authCredentialRepository ??
      (authenticationContainer.resolve('authCredentialRepository') as IAuthCredentialRepository);
    tokenRepository =
      tokenRepository ?? (authenticationContainer.resolve('tokenRepository') as ITokenRepository);
    sessionRepository =
      sessionRepository ??
      (authenticationContainer.resolve('sessionRepository') as ISessionRepository);

    return new AuthenticationApplicationService(
      authCredentialRepository,
      tokenRepository,
      sessionRepository,
    );
  }

  /**
   * 获取单例实例（全局唯一）
   */
  static async getInstance(): Promise<AuthenticationApplicationService> {
    if (!AuthenticationApplicationService.instance) {
      AuthenticationApplicationService.instance =
        await AuthenticationApplicationService.createInstance();
    }
    return AuthenticationApplicationService.instance;
  }

  // ===================== 实例方法（业务主流程） =====================

  /**
   * 用户名密码登录
   * @param request 登录请求参数
   * @returns 登录响应对象
   */
  async loginByPassword(
    request: AuthByPasswordRequestDTO & { clientInfo: ClientInfo },
  ): Promise<TResponse<AuthResponseDTO>> {
    logger.info('Processing password authentication', { username: request.username });

    try {
      const result = await this.loginService.PasswordAuthentication(request);

      if (result.success) {
        logger.info('Password authentication successful', {
          username: request.username,
          accountUuid: result.data?.accountUuid,
        });
      } else {
        logger.warn('Password authentication failed', {
          username: request.username,
          reason: result.message,
        });
      }

      return result;
    } catch (error) {
      logger.error('Password authentication error', error, { username: request.username });
      throw error;
    }
  }

  async function() {
    void this.authCredentialRepository;
    void this.tokenRepository;
    void this.sessionRepository;
  }

  /**
   * 登出单个会话
   * @param sessionId 要终止的会话ID
   * @param accountUuid 账户UUID（用于验证）
   * @returns 是否成功登出
   */
  async logout(
    sessionId: string,
    accountUuid?: string,
  ): Promise<TResponse<{ sessionsClosed: number }>> {
    logger.info('Processing logout', { sessionId });

    try {
      // 1. 查找会话
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        logger.warn('Session not found', { sessionId });
        return {
          success: false,
          message: '会话不存在或已失效',
          data: { sessionsClosed: 0 },
        };
      }

      // 2. 验证账户所有权（如果提供了accountUuid）
      if (accountUuid && session.accountUuid !== accountUuid) {
        logger.warn('Session does not belong to account', { sessionId, accountUuid });
        return {
          success: false,
          message: '无权操作此会话',
          data: { sessionsClosed: 0 },
        };
      }

      // 3. 终止会话
      await this.sessionRepository.terminateSession(sessionId);

      // 4. 撤销该会话的所有令牌
      await this.tokenRepository.revokeAllTokensByAccount(
        session.accountUuid,
        `Session ${sessionId} terminated`,
      );

      // 5. 发布会话终止事件
      await eventBus.publish({
        eventType: 'SessionTerminated',
        aggregateId: sessionId,
        occurredAt: new Date(),
        payload: {
          sessionUuid: session.uuid,
          accountUuid: session.accountUuid,
          terminationType: 'logout',
          terminatedAt: new Date(),
          remainingActiveSessions: (
            await this.sessionRepository.findActiveByAccountUuid(session.accountUuid)
          ).length,
        },
      });

      logger.info('Logout successful', { sessionId, accountUuid: session.accountUuid });

      return {
        success: true,
        message: '登出成功',
        data: { sessionsClosed: 1 },
      };
    } catch (error) {
      logger.error('Logout error', error, { sessionId });
      throw error;
    }
  }

  /**
   * 登出所有会话
   * @param accountUuid 账户UUID
   * @returns 关闭的会话数
   */
  async logoutAll(accountUuid: string): Promise<TResponse<{ sessionsClosed: number }>> {
    logger.info('Processing logout all sessions', { accountUuid });

    try {
      // 1. 获取所有活跃会话
      const activeSessions = await this.sessionRepository.findActiveByAccountUuid(accountUuid);
      const sessionCount = activeSessions.length;

      if (sessionCount === 0) {
        logger.info('No active sessions to terminate', { accountUuid });
        return {
          success: true,
          message: '没有需要关闭的会话',
          data: { sessionsClosed: 0 },
        };
      }

      // 2. 终止所有会话
      await this.sessionRepository.terminateAllByAccount(accountUuid);

      // 3. 撤销所有令牌
      await this.tokenRepository.revokeAllTokensByAccount(accountUuid, 'All sessions terminated');

      // 4. 发布全部会话终止事件
      await eventBus.publish({
        eventType: 'AllSessionsTerminated',
        aggregateId: accountUuid,
        occurredAt: new Date(),
        payload: {
          accountUuid,
          username: activeSessions[0]?.accountUuid || 'unknown', // TODO: 从账户服务获取用户名
          terminationType: 'admin_action',
          terminatedSessionCount: sessionCount,
          terminatedAt: new Date(),
        },
      });

      logger.info('All sessions terminated successfully', { accountUuid, sessionCount });

      return {
        success: true,
        message: `成功登出 ${sessionCount} 个会话`,
        data: { sessionsClosed: sessionCount },
      };
    } catch (error) {
      logger.error('Logout all sessions error', error, { accountUuid });
      throw error;
    }
  }

  async createCredentialForAccount(
    accountUuid: string,
    plainPassword: string,
  ): Promise<AuthCredential> {
    logger.info('Creating credential for account', { accountUuid });

    try {
      // 1. 使用聚合工厂（内部会校验密码并哈希）
      const authCredential = await AuthCredential.create({
        accountUuid,
        plainPassword,
      });

      // 2. 保存
      await this.authCredentialRepository.save(authCredential);
      logger.info('Credential saved successfully', { accountUuid });

      // 3. 发布事件
      const domainEvents = authCredential.getDomainEvents?.() ?? [];
      for (const domainEvent of domainEvents) {
        await eventBus.publish(domainEvent);
      }
      authCredential.clearDomainEvents?.();

      return authCredential;
    } catch (err) {
      logger.error('Failed to create credential for account', err, { accountUuid });
      throw err;
    }
  }

  // =================== event services ===================

  async handleAccountRegistered(
    accountUuid: string,
    plainPassword: string,
    requiresAuthentication: boolean = true,
  ): Promise<boolean> {
    logger.info('Handling account registered event', { accountUuid, requiresAuthentication });

    if (!requiresAuthentication) {
      logger.info('Account does not require authentication, skipping', { accountUuid });
      return false;
    }

    if (!plainPassword) {
      logger.error('Password is required for authentication');
      throw new Error('密码不能为空');
    }

    // 检查是否已存在认证凭证
    const existingCredential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
    if (existingCredential) {
      logger.warn('Authentication credential already exists, skipping', { accountUuid });
      return false;
    }

    // 1. 创建认证凭证
    const authCredential = await this.createCredentialForAccount(accountUuid, plainPassword);

    if (!authCredential) {
      logger.warn('Failed to create credential', { accountUuid });
      return false;
    }

    logger.info('Account registered event handled successfully', { accountUuid });
    return true;
    // // 2. 发送欢迎邮件
    // await this.sendWelcomeEmail(email);

    // // 3. 记录注册事件
    // await this.logAccountRegisteredEvent(event);
  }
}
