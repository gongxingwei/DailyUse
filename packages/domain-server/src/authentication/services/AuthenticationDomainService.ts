/**
 * AuthenticationDomainService 域服务
 * 认证领域服务
 */

import { AuthCredential } from '../aggregates/AuthCredential';
import { AuthSession } from '../aggregates/AuthSession';
import { DeviceInfo } from '../value-objects/DeviceInfo';
import type { IAuthCredentialRepository } from '../repositories/IAuthCredentialRepository';
import type { IAuthSessionRepository } from '../repositories/IAuthSessionRepository';
import crypto from 'crypto';

export class AuthenticationDomainService {
  constructor(
    private readonly credentialRepository: IAuthCredentialRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {}

  /**
   * 创建密码凭证
   */
  async createPasswordCredential(params: {
    accountUuid: string;
    hashedPassword: string;
  }): Promise<AuthCredential> {
    // Check if credential already exists
    const existing = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (existing) {
      throw new Error('Credential already exists for this account');
    }

    const credential = AuthCredential.create({
      accountUuid: params.accountUuid,
      type: 'PASSWORD',
      hashedPassword: params.hashedPassword,
    });

    await this.credentialRepository.save(credential);
    return credential;
  }

  /**
   * 获取凭证
   */
  async getCredential(credentialUuid: string): Promise<AuthCredential | null> {
    return this.credentialRepository.findByUuid(credentialUuid);
  }

  /**
   * 根据账户 UUID 获取凭证
   */
  async getCredentialByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    return this.credentialRepository.findByAccountUuid(accountUuid);
  }

  /**
   * 验证密码
   */
  async verifyPassword(accountUuid: string, hashedPassword: string): Promise<boolean> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) return false;

    return credential.verifyPassword(hashedPassword);
  }

  /**
   * 修改密码
   */
  async changePassword(accountUuid: string, newHashedPassword: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.setPassword(newHashedPassword);
    await this.credentialRepository.save(credential);
  }

  /**
   * 记录失败登录
   */
  async recordFailedLogin(accountUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.recordFailedLogin();
    await this.credentialRepository.save(credential);
  }

  /**
   * 重置失败尝试次数
   */
  async resetFailedAttempts(accountUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.resetFailedAttempts();
    await this.credentialRepository.save(credential);
  }

  /**
   * 检查凭证是否锁定
   */
  async isCredentialLocked(accountUuid: string): Promise<boolean> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) return false;

    return credential.isLocked();
  }

  /**
   * 生成记住我令牌
   */
  async generateRememberMeToken(params: {
    accountUuid: string;
    deviceInfo: DeviceInfo;
    expiresInDays?: number;
  }): Promise<string> {
    const credential = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const token = credential.generateRememberMeToken(params.deviceInfo, params.expiresInDays);
    await this.credentialRepository.save(credential);

    return token.token;
  }

  /**
   * 验证记住我令牌
   */
  async verifyRememberMeToken(params: {
    accountUuid: string;
    token: string;
    deviceFingerprint: string;
  }): Promise<boolean> {
    const credential = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (!credential) return false;

    const verifiedToken = credential.verifyRememberMeToken(params.token, params.deviceFingerprint);
    return verifiedToken !== null;
  }

  /**
   * 刷新记住我令牌
   */
  async refreshRememberMeToken(params: {
    accountUuid: string;
    oldToken: string;
    deviceFingerprint: string;
  }): Promise<string | null> {
    const credential = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (!credential) return null;

    const newToken = credential.refreshRememberMeToken(params.oldToken, params.deviceFingerprint);
    if (!newToken) return null;

    await this.credentialRepository.save(credential);
    return newToken.token;
  }

  /**
   * 撤销记住我令牌
   */
  async revokeRememberMeToken(accountUuid: string, tokenUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.revokeRememberMeToken(tokenUuid);
    await this.credentialRepository.save(credential);
  }

  /**
   * 撤销所有记住我令牌
   */
  async revokeAllRememberMeTokens(accountUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.revokeAllRememberMeTokens();
    await this.credentialRepository.save(credential);
  }

  /**
   * 生成 API 密钥
   */
  async generateApiKey(params: {
    accountUuid: string;
    name: string;
    expiresInDays?: number;
  }): Promise<string> {
    const credential = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const apiKey = credential.generateApiKey(params.name, params.expiresInDays);
    await this.credentialRepository.save(credential);

    return apiKey.key;
  }

  /**
   * 撤销 API 密钥
   */
  async revokeApiKey(accountUuid: string, keyUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.revokeApiKey(keyUuid);
    await this.credentialRepository.save(credential);
  }

  /**
   * 启用双因素认证
   */
  async enableTwoFactor(params: {
    accountUuid: string;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
  }): Promise<string> {
    const credential = await this.credentialRepository.findByAccountUuid(params.accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const secret = credential.enableTwoFactor(params.method);
    await this.credentialRepository.save(credential);

    return secret;
  }

  /**
   * 禁用双因素认证
   */
  async disableTwoFactor(accountUuid: string): Promise<void> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    credential.disableTwoFactor();
    await this.credentialRepository.save(credential);
  }

  /**
   * 验证双因素代码
   */
  async verifyTwoFactorCode(accountUuid: string, code: string): Promise<boolean> {
    const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
    if (!credential) return false;

    return credential.verifyTwoFactorCode(code);
  }

  /**
   * 创建会话
   */
  async createSession(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfo;
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): Promise<AuthSession> {
    const session = AuthSession.create({
      accountUuid: params.accountUuid,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      device: params.device as any,
      ipAddress: params.ipAddress,
      location: params.location,
    });

    await this.sessionRepository.save(session);
    return session;
  }

  /**
   * 获取会话
   */
  async getSession(sessionUuid: string): Promise<AuthSession | null> {
    return this.sessionRepository.findByUuid(sessionUuid);
  }

  /**
   * 根据访问令牌获取会话
   */
  async getSessionByAccessToken(accessToken: string): Promise<AuthSession | null> {
    return this.sessionRepository.findByAccessToken(accessToken);
  }

  /**
   * 根据刷新令牌获取会话
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    return this.sessionRepository.findByRefreshToken(refreshToken);
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(params: {
    sessionUuid: string;
    newAccessToken: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const session = await this.sessionRepository.findByUuid(params.sessionUuid);
    if (!session) {
      throw new Error('Session not found');
    }

    session.refreshAccessToken(params.newAccessToken, params.expiresInMinutes);
    await this.sessionRepository.save(session);
  }

  /**
   * 刷新刷新令牌
   */
  async refreshRefreshToken(sessionUuid: string): Promise<void> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error('Session not found');
    }

    session.refreshRefreshToken();
    await this.sessionRepository.save(session);
  }

  /**
   * 验证会话
   */
  async validateSession(sessionUuid: string): Promise<boolean> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) return false;

    return session.isValid();
  }

  /**
   * 记录活动
   */
  async recordActivity(sessionUuid: string, activityType: string): Promise<void> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error('Session not found');
    }

    session.recordActivity(activityType);
    await this.sessionRepository.save(session);
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionUuid: string): Promise<void> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error('Session not found');
    }

    session.revoke();
    await this.sessionRepository.save(session);
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(accountUuid: string): Promise<void> {
    const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);
    for (const session of sessions) {
      session.revoke();
      await this.sessionRepository.save(session);
    }
  }

  /**
   * 获取活跃会话
   */
  async getActiveSessions(accountUuid: string): Promise<AuthSession[]> {
    return this.sessionRepository.findActiveSessions(accountUuid);
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.sessionRepository.deleteExpired();
  }

  /**
   * 清理过期凭证
   */
  async cleanupExpiredCredentials(): Promise<number> {
    return this.credentialRepository.deleteExpired();
  }
}
