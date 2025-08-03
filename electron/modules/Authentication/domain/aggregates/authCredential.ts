import { AggregateRoot } from "@/shared/domain/aggregateRoot";
// domains
import { Password } from "../valueObjects/password";
import { Token } from "../valueObjects/token";
import { Session } from "../entities/session";
import { MFADevice } from "../entities/mfaDevice";
// types
import {
  IMainProcessAuthCredential, TokenType
} from "@common/modules/authentication/types/authentication";
// utils
import { addMinutes } from "date-fns";

/**
 * 认证凭证聚合根
 *
 * 职责：
 * - 验证用户身份（登录、OAuth、MFA）
 * - 管理会话（Session）和凭证（Token、密码）
 * - 实现"记住我"等快速登录功能
 * - 不直接引用Account对象，通过accountUuid关联
 */
export class AuthCredential
  extends AggregateRoot
  implements IMainProcessAuthCredential
{
  private _accountUuUuid: string; // 关联的账号ID
  private _password: Password;
  private _sessions: Map<string, Session>; // 活跃会话
  private _mfaDevices: Map<string, MFADevice>; // MFA设备
  private _rememberTokens: Map<string, Token>; // 记住我令牌
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastAuthAt?: Date; // 最后认证时间
  private _failedAttempts: number;
  private _maxAttempts: number;
  private _lockedUntil?: Date;
  private _tokens: Map<string, Token>;

  constructor(uuid: string, accountUuid: string, password: Password) {
    super(uuid);
    this._accountUuUuid = accountUuid;
    this._password = password;
    this._sessions = new Map();
    this._mfaDevices = new Map();
    this._rememberTokens = new Map();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._failedAttempts = 0;
    this._maxAttempts = 5;
    this._lockedUntil = undefined;
    this._tokens = new Map();
  }

  // Getters
  get accountUuid(): string {
    return this._accountUuUuid;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastAuthAt(): Date | undefined {
    return this._lastAuthAt;
  }

  get activeSessions(): Session[] {
    return Array.from(this._sessions.values()).filter(
      (session) => session.isActive
    );
  }

  get mfaDevices(): Map<string, MFADevice> {
    return this._mfaDevices;
  }

  get failedAttempts(): number {
    return this._failedAttempts;
  }

  get maxAttempts(): number {
    return this._maxAttempts;
  }

  get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }

  get tokens(): Map<string, Token> {
    return this._tokens;
  }

  get tokenList(): Token[] {
    return Array.from(this._tokens.values());
  }
  get password(): Password {
    return this._password;
  }
  get rememberTokens(): Map<string, Token> {
    return this._rememberTokens;
  }
  get rememberTokenList(): Token[] {
    return Array.from(this._rememberTokens.values());
  }
  get sessions(): Map<string, Session> {
    return this._sessions;
  }

  isAccountLocked(): boolean {
    return this._lockedUntil !== undefined && this._lockedUntil > new Date();
  }

  getAccessToken(): Token | undefined {
    const token = this._tokens.get(TokenType.ACCESS_TOKEN);
  if (token) {
    if (token.isValid()) {
      return token;
    } else {
      token.revoke();
    }
  }
  // 创建新 access_token（有效期可自定义）
  const newToken = Token.createAccessToken(this.accountUuid, 3600); // 1小时有效
  this._tokens.set(TokenType.ACCESS_TOKEN, newToken);
  this._updatedAt = new Date();
  return newToken;
  }

  /**
   * 验证密码
   */
  verifyPassword(password: string): {
    success: boolean;
    accessToken: Token | undefined;
  } {
    let accessToken: Token | undefined;
    if (this.isAccountLocked()) {
      throw new Error("Account is locked. Please try again later.");
    }

    const isValid = this._password.verify(password);

    if (isValid) {
      this._failedAttempts = 0;
      this._lastAuthAt = new Date();
      this._updatedAt = this._lastAuthAt;
      accessToken = this.getAccessToken();
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "PasswordVerified",
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuUuid,
          timestamp: this._lastAuthAt,
        },
      });
    } else {
      this._failedAttempts++;
      if (this._failedAttempts >= this._maxAttempts) {
        this._lockedUntil = addMinutes(new Date(), 30); // 锁定30分钟
        this.addDomainEvent({
          aggregateId: this.uuid,
          eventType: "AccountLocked",
          occurredOn: new Date(),
          payload: { accountUuid: this._accountUuUuid, timestamp: new Date() },
        });
      }
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "PasswordVerificationFailed",
        occurredOn: new Date(),
        payload: { accountUuid: this._accountUuUuid, timestamp: new Date() },
      });
    }

    return {
      success: isValid,
      accessToken,
    };
  }

  /**
   * 修改密码
   */
  changePassword(oldPassword: string, newPassword: string): void {
    if (!this._password.verify(oldPassword)) {
      throw new Error("原密码不正确");
    }

    if (!Password.validateStrength(newPassword)) {
      throw new Error("新密码强度不足");
    }

    this._password = new Password(newPassword);
    this._updatedAt = new Date();

    // 密码更改后，终止所有活跃会话（除了当前会话）
    this.terminateAllSessions();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: "PasswordChanged",
      occurredOn: new Date(),
      payload: { accountUuid: this._accountUuUuid, timestamp: this._updatedAt },
    });
  }

  /**
   * 创建新会话
   */
  createSession(
    tokenValue: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent?: string
  ): Session {
    const session = new Session({
      accountUuid: this._accountUuUuid,
      token: tokenValue,
      deviceInfo,
      ipAddress,
      userAgent: userAgent,
    });

    this._sessions.set(session.uuid, session);
    this._lastAuthAt = new Date();
    this._updatedAt = this._lastAuthAt;

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: "SessionCreated",
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuUuid,
        sessionId: session.uuid,
        deviceInfo,
        ipAddress,
        timestamp: this._lastAuthAt,
      },
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
      this._updatedAt = new Date();

      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "SessionTerminated",
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuUuid,
          sessionId: sessionId,
          timestamp: this._updatedAt,
        },
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

    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: "AllSessionsTerminated",
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuUuid,
        timestamp: this._updatedAt,
      },
    });
  }

  /**
   * 刷新会话
   */
  refreshSession(sessionId: string): boolean {
    const session = this._sessions.get(sessionId);
    if (session && session.isActive) {
      session.refresh();
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * 绑定MFA设备
   */
  bindMFADevice(device: MFADevice): void {
    this._mfaDevices.set(device.uuid, device);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: "MFADeviceBound",
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuUuid,
        deviceId: device.uuid,
        deviceType: device.type,
        timestamp: this._updatedAt,
      },
    });
  }

  /**
   * 解绑MFA设备
   */
  unbindMFADevice(deviceId: string): void {
    const device = this._mfaDevices.get(deviceId);
    if (device) {
      this._mfaDevices.delete(deviceId);
      this._updatedAt = new Date();

      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "MFADeviceUnbound",
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuUuid,
          deviceId: deviceId,
          timestamp: this._updatedAt,
        },
      });
    }
  }

  /**
   * 验证MFA设备
   */
  verifyMFADevice(deviceId: string, code: string): boolean {
    const device = this._mfaDevices.get(deviceId);
    if (device && device.verify(code)) {
      this._lastAuthAt = new Date();
      this._updatedAt = this._lastAuthAt;

      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "MFAVerified",
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuUuid,
          deviceId: deviceId,
          timestamp: this._lastAuthAt,
        },
      });

      return true;
    }

    return false;
  }

  /**
   * 创建记住我令牌
   */
  createRememberToken(deviceInfo: string): Token {
    const token = Token.createRememberToken(this._accountUuUuid, deviceInfo);
    this._rememberTokens.set(token.value, token);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: "RememberTokenCreated",
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuUuid,
        tokenId: token.value,
        deviceInfo,
        timestamp: this._updatedAt,
      },
    });

    return token;
  }

  /**
   * 验证记住我令牌
   */
  verifyRememberToken(tokenValue: string): {
    success: boolean;
    accessToken: Token | undefined;
  } {
    const token = this._rememberTokens.get(TokenType.REMEMBER_ME);
    if (token && token.isValid() && token.value === tokenValue) {
      this._lastAuthAt = new Date();
      this._updatedAt = this._lastAuthAt;
      token.extendExpiry(30); // 延长30天有效期
      return {
        success: true,
        accessToken: this.getAccessToken(),
      };
    }

    return {
      success: false,
      accessToken: undefined,
    };
  }

  /**
   * 撤销记住我令牌
   */
  revokeRememberToken(tokenValue: string): void {
    const token = this._rememberTokens.get(tokenValue);
    if (token) {
      token.revoke();
      this._updatedAt = new Date();

      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: "RememberTokenRevoked",
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuUuid,
          tokenId: tokenValue,
          timestamp: this._updatedAt,
        },
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
      this._updatedAt = new Date();
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
    createdAt: Date;
    expiresAt?: Date;
  } {
    return {
      hashedValue: (this._password as any)._hashedValue,
      salt: (this._password as any)._salt,
      algorithm: (this._password as any)._algorithm,
      createdAt: (this._password as any)._createdAt,
      expiresAt: (this._password as any)._expiresAt,
    };
  }

  /**
   * 用于仓库层重建对象时设置私有属性
   */
  static restoreFromPersistenceWithEntities(params: {
    uuid: string,
    accountUuid: string,
    passwordHash: string,
    passwordSalt: string,
    passwordAlgorithm: string,
    passwordCreatedAt: Date,
    createdAt: Date,
    updatedAt: Date,
    lastAuthAt?: Date,
    passwordExpiresAt?: Date,
    failedAttempts?: number,
    maxAttempts?: number,
    lockedUntil?: Date,
    tokens: Map<string, Token>,
    rememberTokens: Map<string, Token>,
    sessions: Map<string, Session>,
    mfaDevices: Map<string, MFADevice>
  }): AuthCredential {
    const password = Password.fromHashWithTimestamp(
      params.passwordHash,
      params.passwordSalt,
      params.passwordAlgorithm,
      params.passwordCreatedAt,
      params.passwordExpiresAt
    );
    const credential = new AuthCredential(params.uuid, params.accountUuid, password);

    // 设置私有属性
    (credential as any)._createdAt = params.createdAt;
    (credential as any)._updatedAt = params.updatedAt;
    credential._lockedUntil = params.lockedUntil;
    credential._failedAttempts = params.failedAttempts || 0;
    credential._maxAttempts = params.maxAttempts || 5;
    if (params.lastAuthAt) {
      (credential as any)._lastAuthAt = params.lastAuthAt;
    }
    credential._tokens = params.tokens;
    credential._rememberTokens = params.rememberTokens;
    credential._sessions = params.sessions;
    credential._mfaDevices = params.mfaDevices;

    return credential;
  }

}
