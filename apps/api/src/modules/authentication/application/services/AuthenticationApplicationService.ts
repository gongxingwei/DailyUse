import type { IAuthCredentialRepository, IAuthSessionRepository } from '@dailyuse/domain-server';
import { AuthenticationDomainService } from '@dailyuse/domain-server';
import { AuthenticationContainer } from '../../infrastructure/di/AuthenticationContainer';
import { createLogger } from '@dailyuse/utils';
import { AuthenticationContracts } from '@dailyuse/contracts';

// Type aliases at top
type AuthCredentialClientDTO = AuthenticationContracts.AuthCredentialClientDTO;
type AuthSessionClientDTO = AuthenticationContracts.AuthSessionClientDTO;
type DeviceInfo = AuthenticationContracts.DeviceInfoServer;

const logger = createLogger('AuthenticationApplicationService');

/**
 * Authentication 应用服务
 * 处理认证相关业务逻辑
 */
export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService;
  private authService: AuthenticationDomainService;
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;

  private constructor(
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
  ) {
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.authService = new AuthenticationDomainService(credentialRepository, sessionRepository);
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
  ): Promise<AuthenticationApplicationService> {
    const container = AuthenticationContainer.getInstance();
    const credRepo = credentialRepository || container.getAuthCredentialRepository();
    const sessRepo = sessionRepository || container.getAuthSessionRepository();

    AuthenticationApplicationService.instance = new AuthenticationApplicationService(
      credRepo,
      sessRepo,
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
   * 创建密码凭证
   */
  async createPasswordCredential(params: {
    accountUuid: string;
    hashedPassword: string;
  }): Promise<AuthCredentialClientDTO> {
    const credential = await this.authService.createPasswordCredential(params);
    return credential.toClientDTO();
  }

  /**
   * 获取凭证
   */
  async getCredential(credentialUuid: string): Promise<AuthCredentialClientDTO | null> {
    try {
      const credential = await this.authService.getCredential(credentialUuid);
      return credential ? credential.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting credential', { error });
      return null;
    }
  }

  /**
   * 根据账户 UUID 获取凭证
   */
  async getCredentialByAccountUuid(accountUuid: string): Promise<AuthCredentialClientDTO | null> {
    try {
      const credential = await this.authService.getCredentialByAccountUuid(accountUuid);
      return credential ? credential.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting credential by account', { error });
      return null;
    }
  }

  /**
   * 验证密码
   */
  async verifyPassword(accountUuid: string, hashedPassword: string): Promise<boolean> {
    return this.authService.verifyPassword(accountUuid, hashedPassword);
  }

  /**
   * 修改密码
   */
  async changePassword(accountUuid: string, newHashedPassword: string): Promise<void> {
    await this.authService.changePassword(accountUuid, newHashedPassword);
  }

  /**
   * 记录失败登录
   */
  async recordFailedLogin(accountUuid: string): Promise<void> {
    await this.authService.recordFailedLogin(accountUuid);
  }

  /**
   * 重置失败尝试次数
   */
  async resetFailedAttempts(accountUuid: string): Promise<void> {
    await this.authService.resetFailedAttempts(accountUuid);
  }

  /**
   * 检查凭证是否锁定
   */
  async isCredentialLocked(accountUuid: string): Promise<boolean> {
    return this.authService.isCredentialLocked(accountUuid);
  }

  /**
   * 生成记住我令牌
   */
  async generateRememberMeToken(params: {
    accountUuid: string;
    deviceInfo: any; // DeviceInfo from domain
    expiresInDays?: number;
  }): Promise<string> {
    return this.authService.generateRememberMeToken(params);
  }

  /**
   * 验证记住我令牌
   */
  async verifyRememberMeToken(params: {
    accountUuid: string;
    token: string;
    deviceFingerprint: string;
  }): Promise<boolean> {
    return this.authService.verifyRememberMeToken(params);
  }

  /**
   * 刷新记住我令牌
   */
  async refreshRememberMeToken(params: {
    accountUuid: string;
    oldToken: string;
    deviceFingerprint: string;
  }): Promise<string | null> {
    return this.authService.refreshRememberMeToken(params);
  }

  /**
   * 撤销记住我令牌
   */
  async revokeRememberMeToken(accountUuid: string, tokenUuid: string): Promise<void> {
    await this.authService.revokeRememberMeToken(accountUuid, tokenUuid);
  }

  /**
   * 撤销所有记住我令牌
   */
  async revokeAllRememberMeTokens(accountUuid: string): Promise<void> {
    await this.authService.revokeAllRememberMeTokens(accountUuid);
  }

  /**
   * 生成 API 密钥
   */
  async generateApiKey(params: {
    accountUuid: string;
    name: string;
    expiresInDays?: number;
  }): Promise<string> {
    return this.authService.generateApiKey(params);
  }

  /**
   * 撤销 API 密钥
   */
  async revokeApiKey(accountUuid: string, keyUuid: string): Promise<void> {
    await this.authService.revokeApiKey(accountUuid, keyUuid);
  }

  /**
   * 启用双因素认证
   */
  async enableTwoFactor(params: {
    accountUuid: string;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
  }): Promise<string> {
    return this.authService.enableTwoFactor(params);
  }

  /**
   * 禁用双因素认证
   */
  async disableTwoFactor(accountUuid: string): Promise<void> {
    await this.authService.disableTwoFactor(accountUuid);
  }

  /**
   * 验证双因素代码
   */
  async verifyTwoFactorCode(accountUuid: string, code: string): Promise<boolean> {
    return this.authService.verifyTwoFactorCode(accountUuid, code);
  }

  /**
   * 创建会话
   */
  async createSession(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: any; // DeviceInfo from domain
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): Promise<AuthSessionClientDTO> {
    const session = await this.authService.createSession(params);
    return session.toClientDTO();
  }

  /**
   * 获取会话
   */
  async getSession(sessionUuid: string): Promise<AuthSessionClientDTO | null> {
    try {
      const session = await this.authService.getSession(sessionUuid);
      return session ? session.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting session', { error });
      return null;
    }
  }

  /**
   * 根据访问令牌获取会话
   */
  async getSessionByAccessToken(accessToken: string): Promise<AuthSessionClientDTO | null> {
    try {
      const session = await this.authService.getSessionByAccessToken(accessToken);
      return session ? session.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting session by access token', { error });
      return null;
    }
  }

  /**
   * 根据刷新令牌获取会话
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<AuthSessionClientDTO | null> {
    try {
      const session = await this.authService.getSessionByRefreshToken(refreshToken);
      return session ? session.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting session by refresh token', { error });
      return null;
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(params: {
    sessionUuid: string;
    newAccessToken: string;
    expiresInMinutes: number;
  }): Promise<void> {
    await this.authService.refreshAccessToken(params);
  }

  /**
   * 验证会话
   */
  async validateSession(sessionUuid: string): Promise<boolean> {
    return this.authService.validateSession(sessionUuid);
  }

  /**
   * 记录活动
   */
  async recordActivity(sessionUuid: string, activityType: string): Promise<void> {
    await this.authService.recordActivity(sessionUuid, activityType);
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionUuid: string): Promise<void> {
    await this.authService.revokeSession(sessionUuid);
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(accountUuid: string): Promise<void> {
    await this.authService.revokeAllSessions(accountUuid);
  }

  /**
   * 获取活跃会话
   */
  async getActiveSessions(accountUuid: string): Promise<AuthSessionClientDTO[]> {
    const sessions = await this.authService.getActiveSessions(accountUuid);
    return sessions.map((session) => session.toClientDTO());
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.authService.cleanupExpiredSessions();
  }

  /**
   * 清理过期凭证
   */
  async cleanupExpiredCredentials(): Promise<number> {
    return this.authService.cleanupExpiredCredentials();
  }
}
