import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { Password } from "../valueObjects/password";
import { Token } from "../valueObjects/token";
import { Session } from "../entities/session";
import { MFADevice } from "../entities/mfaDevice";

/**
 * 认证凭证聚合根
 * 
 * 职责：
 * - 验证用户身份（登录、OAuth、MFA）
 * - 管理会话（Session）和凭证（Token、密码）
 * - 实现"记住我"等快速登录功能
 * - 不直接引用Account对象，通过AccountId关联
 */
export class AuthCredential extends AggregateRoot {
  private _accountId: string; // 关联的账号ID
  private _password: Password;
  private _sessions: Map<string, Session>; // 活跃会话
  private _mfaDevices: Map<string, MFADevice>; // MFA设备
  private _rememberTokens: Map<string, Token>; // 记住我令牌
  private _createdAt: DateTime;
  private _updatedAt: DateTime;
  private _lastAuthAt?: DateTime; // 最后认证时间
  private _failedAttempts: number;
  private _maxAttempts: number;
  private _lockedUntil?: DateTime;
  private _tokens: Map<string, Token>;


  constructor(
    id: string,
    accountId: string,
    password: Password
  ) {
    super(id);
    this._accountId = accountId;
    this._password = password;
    this._sessions = new Map();
    this._mfaDevices = new Map();
    this._rememberTokens = new Map();
    this._createdAt = TimeUtils.now();
    this._updatedAt = TimeUtils.now();
    this._failedAttempts = 0;
    this._maxAttempts = 5;
    this._lockedUntil = undefined;
    this._tokens = new Map();
  }

  // Getters
  get accountId(): string {
    return this._accountId;
  }

  get createdAt(): DateTime {
    return this._createdAt;
  }

  get updatedAt(): DateTime {
    return this._updatedAt;
  }

  get lastAuthAt(): DateTime | undefined {
    return this._lastAuthAt;
  }

  get activeSessions(): Session[] {
    return Array.from(this._sessions.values()).filter(session => session.isActive);
  }

  get mfaDevices(): MFADevice[] {
    return Array.from(this._mfaDevices.values());
  }

  get failedAttempts(): number {
    return this._failedAttempts;
  }

  get maxAttempts(): number {
    return this._maxAttempts;
  }

  get lockedUntil(): DateTime | undefined {
    return this._lockedUntil;
  }

  get tokens(): Token[] { 
    return Array.from(this._tokens.values());
  }

  isAccountLocked(): boolean {
    return this._lockedUntil !== undefined && this._lockedUntil > TimeUtils.now();
  }

  /**
   * 验证密码
   */
  verifyPassword(password: string): {
    success: boolean;
    token: Token | undefined;
  } {
    let token: Token | undefined;
    if (this.isAccountLocked()) {
    throw new Error('Account is locked. Please try again later.');
  }

    const isValid = this._password.verify(password);
    
    if (isValid) {
      this._failedAttempts = 0;
      this._lastAuthAt = TimeUtils.now();
      this._updatedAt = this._lastAuthAt;
      const accessToken = Token.createAccessToken(this.id, 9999);
      token = accessToken;
      this._tokens.set('access_token', accessToken)
      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'PasswordVerified',
        occurredOn: new Date(),
        payload: { accountId: this._accountId, timestamp: this._lastAuthAt }
      });
    } else {
      this._failedAttempts++;
      if (this._failedAttempts >= this._maxAttempts) {
        this._lockedUntil = TimeUtils.add(TimeUtils.now(), 5, "minutes");
        this.addDomainEvent({
          aggregateId: this.id,
          eventType: 'AccountLocked',
          occurredOn: new Date(),
          payload: { accountId: this._accountId, timestamp: TimeUtils.now() }
        })
      }
      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'PasswordVerificationFailed',
        occurredOn: new Date(),
        payload: { accountId: this._accountId, timestamp: TimeUtils.now() }
      });
    }
    
    return {
      success: isValid,
      token,
    };
  }

  /**
   * 修改密码
   */
  changePassword(oldPassword: string, newPassword: string): void {
    if (!this._password.verify(oldPassword)) {
      throw new Error('原密码不正确');
    }

    if (!Password.validateStrength(newPassword)) {
      throw new Error('新密码强度不足');
    }

    this._password = new Password(newPassword);
    this._updatedAt = TimeUtils.now();
    
    // 密码更改后，终止所有活跃会话（除了当前会话）
    this.terminateAllSessions();
    
    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'PasswordChanged',
      occurredOn: new Date(),
      payload: { accountId: this._accountId, timestamp: this._updatedAt }
    });
  }

  /**
   * 创建新会话
   */
  createSession(deviceInfo: string, ipAddress: string, userAgent?: string): Session {
    const session = new Session(
      this.generateSessionId(),
      this._accountId,
      deviceInfo,
      ipAddress,
      userAgent
    );
    
    this._sessions.set(session.id, session);
    this._lastAuthAt = TimeUtils.now();
    this._updatedAt = this._lastAuthAt;

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'SessionCreated',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId, 
        sessionId: session.id,
        deviceInfo,
        ipAddress,
        timestamp: this._lastAuthAt 
      }
    });

    return session;
  }

  /**
   * 终止会话
   */
  terminateSession(sessionId: string): void {
    const session = this._sessions.get(sessionId);
    if (session) {
      session.terminate();
      this._updatedAt = TimeUtils.now();

      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'SessionTerminated',
        occurredOn: new Date(),
        payload: { 
          accountId: this._accountId, 
          sessionId: sessionId,
          timestamp: this._updatedAt 
        }
      });
    }
  }

  /**
   * 终止所有会话
   */
  terminateAllSessions(): void {
    for (const session of this._sessions.values()) {
      if (session.isActive) {
        session.terminate();
      }
    }
    
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AllSessionsTerminated',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId, 
        timestamp: this._updatedAt 
      }
    });
  }

  /**
   * 刷新会话
   */
  refreshSession(sessionId: string): boolean {
    const session = this._sessions.get(sessionId);
    if (session && session.isActive) {
      session.refresh();
      this._updatedAt = TimeUtils.now();
      return true;
    }
    return false;
  }

  /**
   * 绑定MFA设备
   */
  bindMFADevice(device: MFADevice): void {
    this._mfaDevices.set(device.id, device);
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'MFADeviceBound',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId, 
        deviceId: device.id,
        deviceType: device.type,
        timestamp: this._updatedAt 
      }
    });
  }

  /**
   * 解绑MFA设备
   */
  unbindMFADevice(deviceId: string): void {
    const device = this._mfaDevices.get(deviceId);
    if (device) {
      this._mfaDevices.delete(deviceId);
      this._updatedAt = TimeUtils.now();

      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'MFADeviceUnbound',
        occurredOn: new Date(),
        payload: { 
          accountId: this._accountId, 
          deviceId: deviceId,
          timestamp: this._updatedAt 
        }
      });
    }
  }

  /**
   * 验证MFA设备
   */
  verifyMFADevice(deviceId: string, code: string): boolean {
    const device = this._mfaDevices.get(deviceId);
    if (device && device.verify(code)) {
      this._lastAuthAt = TimeUtils.now();
      this._updatedAt = this._lastAuthAt;

      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'MFAVerified',
        occurredOn: new Date(),
        payload: { 
          accountId: this._accountId, 
          deviceId: deviceId,
          timestamp: this._lastAuthAt 
        }
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * 创建记住我令牌
   */
  createRememberToken(deviceInfo: string): Token {
    const token = Token.createRememberToken(this._accountId, deviceInfo);
    this._rememberTokens.set(token.value, token);
    this._updatedAt = TimeUtils.now();

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'RememberTokenCreated',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId, 
        tokenId: token.value,
        deviceInfo,
        timestamp: this._updatedAt 
      }
    });

    return token;
  }

  /**
   * 验证记住我令牌
   */
  verifyRememberToken(tokenValue: string): boolean {
    const token = this._rememberTokens.get(tokenValue);
    if (token && token.isValid()) {
      this._lastAuthAt = TimeUtils.now();
      this._updatedAt = this._lastAuthAt;
      return true;
    }
    
    return false;
  }

  /**
   * 撤销记住我令牌
   */
  revokeRememberToken(tokenValue: string): void {
    const token = this._rememberTokens.get(tokenValue);
    if (token) {
      token.revoke();
      this._updatedAt = TimeUtils.now();

      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'RememberTokenRevoked',
        occurredOn: new Date(),
        payload: { 
          accountId: this._accountId, 
          tokenId: tokenValue,
          timestamp: this._updatedAt 
        }
      });
    }
  }

  /**
   * 清理过期的会话和令牌
   */
  cleanupExpired(): void {
    let hasCleanup = false;

    // 清理过期会话
    for (const [sessionId, session] of this._sessions.entries()) {
      if (session.isExpired()) {
        this._sessions.delete(sessionId);
        hasCleanup = true;
      }
    }

    // 清理过期令牌
    for (const [tokenValue, token] of this._rememberTokens.entries()) {
      if (!token.isValid()) {
        this._rememberTokens.delete(tokenValue);
        hasCleanup = true;
      }
    }

    if (hasCleanup) {
      this._updatedAt = TimeUtils.now();
    }
  }

  /**
   * 检查是否启用了MFA
   */
  isMFAEnabled(): boolean {
    return this._mfaDevices.size > 0;
  }

  /**
   * 获取密码信息用于持久化 (仅限仓库层使用)
   * 这是一个基础设施层方法，违反了一定的封装性，但是必要的
   */
  getPasswordInfo(): {
    hashedValue: string;
    salt: string;
    algorithm: string;
    createdAt: DateTime;
    expiresAt?: DateTime;
  } {
    return {
      hashedValue: (this._password as any)._hashedValue,
      salt: (this._password as any)._salt,
      algorithm: (this._password as any)._algorithm,
      createdAt: (this._password as any)._createdAt,
      expiresAt: (this._password as any)._expiresAt
    };
  }

  /**
   * 用于仓库层重建对象时设置私有属性
   */
  static restoreFromPersistence(
    id: string,
    accountId: string,
    passwordHash: string,
    passwordSalt: string,
    passwordAlgorithm: string,
    passwordCreatedAt: DateTime,
    createdAt: DateTime,
    updatedAt: DateTime,
    lastAuthAt?: DateTime,
    passwordExpiresAt?: DateTime,
    failedAttempts?: number,
    maxAttempts?: number,
    lockedUntil?: DateTime
  ): AuthCredential {
    const password = Password.fromHashWithTimestamp(
      passwordHash, 
      passwordSalt, 
      passwordAlgorithm, 
      passwordCreatedAt,
      passwordExpiresAt
    );
    const credential = new AuthCredential(id, accountId, password);
    
    // 设置私有属性
    (credential as any)._createdAt = createdAt;
    (credential as any)._updatedAt = updatedAt;
    credential._lockedUntil = lockedUntil;
    credential._failedAttempts = failedAttempts || 0;
    credential._maxAttempts = maxAttempts || 5;
    if (lastAuthAt) {
      (credential as any)._lastAuthAt = lastAuthAt;
    }
    
    return credential;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
