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
