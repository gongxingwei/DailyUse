import {
  AuthCredentialCore,
  TokenType,
  type ISessionCore,
  type IMFADeviceCore,
  type ITokenCore,
  type ClientInfo,
} from '@dailyuse/domain-core';
import { type IAuthCredentialServer } from '../types';
import { Password } from '../valueObjects/Password';
import { Session } from '../entities/Session';
import { Token } from '../valueObjects/Token';
import { MFADevice } from '../entities/MFADevice';
import { addMinutes } from 'date-fns';

/**
 * 服务端认证凭据 - 包含完整的业务逻辑
 * 密码验证、会话管理等敏感操作
 */
export class AuthCredential extends AuthCredentialCore implements IAuthCredentialServer {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    password: Password;
    sessions?: Map<string, Session>;
    mfaDevices?: Map<string, MFADevice>;
    tokens?: Map<string, Token>;
    failedAttempts?: number;
    lockedUntil?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    lastAuthAt?: Date;
  }) {
    // 将具体类型转换为接口类型传递给父构造函数
    const coreParams = {
      ...params,
      password: params.password, // Password implements IPasswordCore and extends PasswordCore
      sessions: params.sessions || new Map(),
      mfaDevices: params.mfaDevices || new Map(),
      tokens: params.tokens || new Map(),
    };
    super(coreParams);
  }

  isAccountLocked(): boolean {
    return this._lockedUntil !== undefined && this._lockedUntil > new Date();
  }

  getAccessToken(): Token | undefined {
    const token = this._tokens.get(TokenType.ACCESS_TOKEN);
    if (token) {
      if (token.isValid()) {
        return token as Token;
      } else {
        token.revoke();
      }
    }
    // 创建新 access_token（有效期可自定义）
    const newToken = Token.createAccessToken(this.accountUuid); // 1小时有效
    this._tokens.set(TokenType.ACCESS_TOKEN, newToken as any);
    this._updatedAt = new Date();
    return newToken;
  }

  // ===== 实现抽象方法 =====
  authenticate(password: string): boolean {
    if (this.isAccountLocked()) {
      return false;
    }

    const isValid = (this.password as Password).verify(password);

    if (isValid) {
      this.resetFailedAttempts();
      this._lastAuthAt = new Date();
      this._updatedAt = new Date();
      return true;
    } else {
      this.incrementFailedAttempts();
      return false;
    }
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
      throw new Error('Account is locked. Please try again later.');
    }

    const isValid = this._password.verify(password);

    if (isValid) {
      this._failedAttempts = 0;
      this._lastAuthAt = new Date();
      this._updatedAt = this._lastAuthAt;
      accessToken = this.getAccessToken();
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'PasswordVerified',
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuid,
          timestamp: this._lastAuthAt,
        },
      });
    } else {
      this._failedAttempts++;
      if (this._failedAttempts >= this._maxAttempts) {
        this._lockedUntil = addMinutes(new Date(), 30); // 锁定30分钟
        this.addDomainEvent({
          aggregateId: this.uuid,
          eventType: 'AccountLocked',
          occurredOn: new Date(),
          payload: { accountUuid: this._accountUuid, timestamp: new Date() },
        });
      }
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'PasswordVerificationFailed',
        occurredOn: new Date(),
        payload: { accountUuid: this._accountUuid, timestamp: new Date() },
      });
    }

    return {
      success: isValid,
      accessToken,
    };
  }

  verifyRememberToken(token: string): {
    success: boolean;
    accessToken: Token | undefined;
  } {
    const rememberToken = this._tokens.get(token);
    if (rememberToken) {
      return {
        success: rememberToken.isValid(),
        accessToken: rememberToken.isValid() ? this.getAccessToken() : undefined,
      };
    }
    return {
      success: false,
      accessToken: undefined,
    };
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const isOldValid = (this.password as Password).verify(oldPassword);
    if (!isOldValid) {
      throw new Error('Current password is incorrect');
    }

    // 使用 Password 的静态工厂（会校验密码强度并进行异步哈希）
    const newPassword_obj = new Password(newPassword);
    (this as any)._password = newPassword_obj;
    this._updatedAt = new Date();

    // 密码更改后终止所有会话
    this.terminateAllSessions();
  }

  createSession(clientInfo: ClientInfo): Session {
    const session = Session.create({
      accountUuid: this.accountUuid,
      clientInfo: clientInfo,
    });

    this.sessions.set(session.uuid, session as any);
    this._updatedAt = new Date();

    return session;
  }

  terminateSession(sessionUuid: string): void {
    const session = this.sessions.get(sessionUuid);
    if (session) {
      session.terminate();
      this._updatedAt = new Date();
    }
  }

  terminateAllSessions(): void {
    for (const session of this.sessions.values()) {
      session.terminate();
    }
    this._updatedAt = new Date();
  }

  addMFADevice(device: IMFADeviceCore): void {
    this.mfaDevices.set(device.uuid, device);
    this._updatedAt = new Date();
  }

  removeMFADevice(deviceUuid: string): void {
    this.mfaDevices.delete(deviceUuid);
    this._updatedAt = new Date();
  }

  createToken(type: TokenType): ITokenCore {
    let token: Token;

    switch (type) {
      case TokenType.ACCESS_TOKEN:
        token = Token.createAccessToken(this.accountUuid);
        break;
      case TokenType.REFRESH_TOKEN:
        token = Token.createRefreshToken(this.accountUuid);
        break;
      case TokenType.PASSWORD_RESET:
        token = Token.createPasswordResetToken(this.accountUuid);
        break;
      case TokenType.EMAIL_VERIFICATION:
        token = Token.createEmailVerificationToken(this.accountUuid);
        break;
      case TokenType.REMEMBER_ME:
        token = Token.createRememberToken(this.accountUuid);
        break;
      default:
        throw new Error(`Unsupported token type: ${type}`);
    }

    this.tokens.set(token.value, token as any);
    this._updatedAt = new Date();
    return token;
  }

  createRememberToken(deviceInfo?: string): Token {
    // 如果指定了设备信息，先撤销该设备现有的记住我令牌
    if (deviceInfo) {
      this.revokeRememberTokenForDevice(deviceInfo);
    }

    const token = Token.createRememberToken(this.accountUuid, deviceInfo);
    this.tokens.set(token.value, token as any);
    this._updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'RememberTokenCreated',
      occurredOn: new Date(),
      payload: {
        accountUuid: this.accountUuid,
        tokenValue: token.value,
        deviceInfo,
        expiresAt: token.expiresAt,
      },
    });

    return token;
  }

  private revokeRememberTokenForDevice(deviceInfo: string): void {
    for (const token of this._tokens.values()) {
      if (
        token.type === TokenType.REMEMBER_ME &&
        token.isValid() &&
        token.deviceInfo === deviceInfo
      ) {
        token.revoke();
        this.addDomainEvent({
          aggregateId: this.uuid,
          eventType: 'RememberTokenRevoked',
          occurredOn: new Date(),
          payload: {
            accountUuid: this.accountUuid,
            tokenValue: token.value,
            deviceInfo,
            reason: 'replaced_by_new_token',
          },
        });
      }
    }
  }

  revokeToken(tokenValue: string): void {
    const token = this.tokens.get(tokenValue);
    if (token) {
      token.revoke();
      this._updatedAt = new Date();
    }
  }

  // ===== IAuthCredentialServer 方法 =====
  async saveToDatabase(): Promise<void> {
    // TODO: 实现数据库保存
  }

  async loadFromDatabase(_uuid: string): Promise<IAuthCredentialServer | null> {
    // TODO: 实现数据库加载
    return null;
  }

  async sendAuthNotification(): Promise<void> {
    // TODO: 实现认证通知
  }

  async auditLogin(_ipAddress: string, _userAgent: string): Promise<void> {
    // TODO: 实现登录审计
  }

  async enforceSecurityPolicies(): Promise<void> {
    // TODO: 实现安全策略检查
  }

  isServer(): boolean {
    return true;
  }

  isClient(): boolean {
    return false;
  } // ===== 业务方法 =====
  get activeSessions(): ISessionCore[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  getPasswordInfo(): {
    hashedValue: string;
    salt: string;
    algorithm: string;
    createdAt: Date;
  } {
    return (this.password as Password).getHashInfo();
  }

  // ===== 工厂方法 =====
  static async create(params: {
    accountUuid: string;
    plainPassword: string;
  }): Promise<AuthCredential> {
    const password = new Password(params.plainPassword);

    return new AuthCredential({
      accountUuid: params.accountUuid,
      password,
    });
  }

  static fromPersistence(params: {
    uuid: string;
    accountUuid: string;
    passwordHash: string;
    passwordSalt: string;
    failedAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): AuthCredential {
    const password = Password.fromHash(params.passwordHash, params.passwordSalt);

    return new AuthCredential({
      uuid: params.uuid,
      accountUuid: params.accountUuid,
      password,
      failedAttempts: params.failedAttempts,
      lockedUntil: params.lockedUntil,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
  }
}
