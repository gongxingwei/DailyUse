/**
 * Authentication Application Service
 * 认证应用服务 - 负责用户登录和认证流程编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 用户登录验证
 * - 密码验证
 * - 创建会话（Session）
 * - 记录失败登录
 * - 锁定/解锁凭证
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
  IAccountRepository,
  AuthCredential,
  AuthSession,
  Account,
} from '@dailyuse/domain-server';
import { AuthenticationDomainService } from '@dailyuse/domain-server';
import { AuthenticationContainer } from '../../infrastructure/di/AuthenticationContainer';
import { AccountContainer } from '../../../account/infrastructure/di/AccountContainer';
import { eventBus, createLogger } from '@dailyuse/utils';
import { prisma } from '@/config/prisma';
import bcrypt from 'bcryptjs';

const logger = createLogger('AuthenticationApplicationService');

/**
 * 登录请求接口
 */
export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'WEB' | 'MOBILE' | 'DESKTOP' | 'TABLET' | 'OTHER';
    platform: string;
    browser?: string;
    osVersion?: string;
  };
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean;
  session: {
    sessionUuid: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  account: {
    uuid: string;
    username: string;
    email: string;
    displayName: string;
  };
  message: string;
}

/**
 * Authentication Application Service
 * 负责认证流程的核心业务逻辑编排
 */
export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService;

  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private accountRepository: IAccountRepository;
  private authenticationDomainService: AuthenticationDomainService;

  private constructor(
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    accountRepository: IAccountRepository,
  ) {
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.accountRepository = accountRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
    accountRepository?: IAccountRepository,
  ): Promise<AuthenticationApplicationService> {
    const authContainer = AuthenticationContainer.getInstance();
    const accountContainer = AccountContainer.getInstance();

    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepository || authContainer.getAuthSessionRepository();
    const accRepo = accountRepository || accountContainer.getAccountRepository();

    AuthenticationApplicationService.instance = new AuthenticationApplicationService(
      credRepo,
      sessRepo,
      accRepo,
    );
    return AuthenticationApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<AuthenticationApplicationService> {
    if (!AuthenticationApplicationService.instance) {
      AuthenticationApplicationService.instance =
        await AuthenticationApplicationService.createInstance();
    }
    return AuthenticationApplicationService.instance;
  }

  /**
   * 用户登录主流程
   *
   * 步骤：
   * 1. 查询账户（通过用户名）
   * 2. 查询凭证（通过 accountUuid）
   * 3. 检查凭证是否锁定（调用 DomainService）
   * 4. 验证密码（调用 DomainService）
   * 5. 生成访问令牌和刷新令牌
   * 6. 创建会话（调用 DomainService）
   * 7. 持久化会话
   * 8. 重置失败尝试次数
   * 9. 发布登录成功事件
   * 10. 返回登录响应
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    logger.info('[AuthenticationApplicationService] Starting login', {
      username: request.username,
      deviceType: request.deviceInfo.deviceType,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findByUsername(request.username);
      if (!account) {
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 2: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(account.uuid);
      if (!credential) {
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 3: 检查凭证是否锁定 =====
      const isLocked = this.authenticationDomainService.isCredentialLocked(credential);
      if (isLocked) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // ===== 步骤 4: 验证密码 =====
      const hashedPassword = await bcrypt.hash(request.password, 12);
      const isPasswordValid = this.authenticationDomainService.verifyPassword(
        credential,
        hashedPassword,
      );

      if (!isPasswordValid) {
        // 记录失败登录
        await this.recordFailedLogin(account.uuid);
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 5: 生成令牌 =====
      const { accessToken, refreshToken, expiresAt } = this.generateTokens();

      // ===== 步骤 6: 创建会话 =====
      const session = await this.createSession({
        accountUuid: account.uuid,
        accessToken,
        refreshToken,
        deviceInfo: request.deviceInfo,
        ipAddress: request.ipAddress,
        location: request.location,
      });

      // ===== 步骤 7: 重置失败尝试次数 =====
      await this.resetFailedAttempts(account.uuid);

      // ===== 步骤 8: 发布登录成功事件 =====
      await this.publishLoginSuccessEvent(account, session);

      logger.info('[AuthenticationApplicationService] Login successful', {
        accountUuid: account.uuid,
        username: request.username,
      });

      return {
        success: true,
        session: {
          sessionUuid: session.uuid,
          accessToken,
          refreshToken,
          expiresAt,
        },
        account: {
          uuid: account.uuid,
          username: account.username,
          email: account.email,
          displayName: account.profile?.displayName || account.username,
        },
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Login failed', {
        username: request.username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 创建会话
   *
   * 步骤：
   * 1. 调用 DomainService 创建会话聚合根（不持久化）
   * 2. ApplicationService 持久化会话
   * 3. 发布会话创建事件
   */
  async createSession(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    deviceInfo: any;
    ipAddress: string;
    location?: any;
  }): Promise<AuthSession> {
    logger.debug('[AuthenticationApplicationService] Creating session', {
      accountUuid: params.accountUuid,
    });

    try {
      // ===== 步骤 1: 调用 DomainService 创建会话聚合根 =====
      const session = this.authenticationDomainService.createSession({
        accountUuid: params.accountUuid,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        device: params.deviceInfo,
        ipAddress: params.ipAddress,
        location: params.location,
      });

      logger.debug('[AuthenticationApplicationService] Session aggregate created', {
        sessionUuid: session.uuid,
      });

      // ===== 步骤 2: ApplicationService 持久化会话 =====
      await this.sessionRepository.save(session);

      logger.info('[AuthenticationApplicationService] Session persisted successfully', {
        sessionUuid: session.uuid,
      });

      // ===== 步骤 3: 发布会话创建事件 =====
      await this.publishSessionCreatedEvent(session);

      return session;
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Session creation failed', {
        accountUuid: params.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 记录失败登录
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法记录失败登录
   * 3. 持久化
   * 4. 发布失败登录事件
   */
  async recordFailedLogin(accountUuid: string): Promise<void> {
    logger.debug('[AuthenticationApplicationService] Recording failed login', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法记录失败登录 =====
      credential.recordFailedLogin();

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[AuthenticationApplicationService] Failed login recorded', {
        accountUuid,
        failedAttempts: credential.security.failedLoginAttempts,
      });

      // ===== 步骤 4: 发布失败登录事件 =====
      await this.publishFailedLoginEvent(accountUuid, credential);
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Failed to record failed login', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 重置失败尝试次数
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法重置失败尝试次数
   * 3. 持久化
   */
  async resetFailedAttempts(accountUuid: string): Promise<void> {
    logger.debug('[AuthenticationApplicationService] Resetting failed attempts', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法重置失败尝试次数 =====
      credential.resetFailedAttempts();

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[AuthenticationApplicationService] Failed attempts reset', {
        accountUuid,
      });
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Failed to reset failed attempts', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private generateTokens(): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } {
    // 简化实现：实际应该使用 JWT
    const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = Date.now() + 3600000; // 1 小时后过期

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * 发布登录成功事件
   */
  private async publishLoginSuccessEvent(account: Account, session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:login_success',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        sessionUuid: session.uuid,
        deviceType: session.device.deviceType,
        ipAddress: session.ipAddress,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Login success event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布会话创建事件
   */
  private async publishSessionCreatedEvent(session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:session_created',
      payload: {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
        deviceType: session.device.deviceType,
      },
      timestamp: Date.now(),
      aggregateId: session.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Session created event published', {
      sessionUuid: session.uuid,
    });
  }

  /**
   * 发布失败登录事件
   */
  private async publishFailedLoginEvent(
    accountUuid: string,
    credential: AuthCredential,
  ): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:login_failed',
      payload: {
        accountUuid,
        failedAttempts: credential.security.failedLoginAttempts,
        isLocked: credential.isLocked(),
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Failed login event published', {
      accountUuid,
    });
  }
}
