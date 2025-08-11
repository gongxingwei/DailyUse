import {
  AuthCredentialCore,
  TokenType,
  type ISessionCore,
  type IMFADeviceCore,
  type ITokenCore,
} from '@dailyuse/domain-core';
import { type IAuthCredentialServer } from '../types';
import { Password } from '../valueObjects/Password';
import { Session } from '../entities/Session';
import { Token } from '../valueObjects/Token';
import { MFADevice } from '../entities/MFADevice';

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
      password: params.password as any, // Password implements IPasswordCore
      sessions: (params.sessions as Map<string, ISessionCore>) || new Map(),
      mfaDevices: (params.mfaDevices as Map<string, IMFADeviceCore>) || new Map(),
      tokens: (params.tokens as Map<string, ITokenCore>) || new Map(),
    };
    super(coreParams);
  }

  // ===== 实现抽象方法 =====
  authenticate(password: string): boolean {
    if (this.isLocked) {
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

  changePassword(oldPassword: string, newPassword: string): void {
    const isOldValid = (this.password as Password).verify(oldPassword);
    if (!isOldValid) {
      throw new Error('Current password is incorrect');
    }

    // 创建新密码替换旧密码
    const newPassword_obj = new Password(newPassword);
    (this as any)._password = newPassword_obj;
    this._updatedAt = new Date();

    // 密码更改后终止所有会话
    this.terminateAllSessions();
  }

  createSession(deviceInfo: string, ipAddress: string): ISessionCore {
    const session = Session.create({
      accountUuid: this.accountUuid,
      deviceInfo,
      ipAddress,
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
      default:
        throw new Error(`Unsupported token type: ${type}`);
    }

    this.tokens.set(token.value, token as any);
    this._updatedAt = new Date();
    return token;
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
    const password = Password.fromHash({
      hashedValue: params.passwordHash,
      salt: params.passwordSalt,
    });

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
