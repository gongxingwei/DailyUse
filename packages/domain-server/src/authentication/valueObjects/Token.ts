import { ValueObject } from '@dailyuse/utils';
import { TokenType } from '@dailyuse/domain-core';
import { type ITokenServer } from '../types';
import * as jwt from 'jsonwebtoken';

/**
 * Token值对象 - JWT令牌管理
 */
export class Token extends ValueObject implements ITokenServer {
  private readonly _value: string;
  private readonly _type: TokenType;
  private readonly _accountUuid: string;
  private readonly _issuedAt: Date;
  private readonly _expiresAt: Date;
  private readonly _deviceInfo?: string;
  private _isRevoked: boolean;

  constructor(params: {
    value: string;
    type: TokenType;
    accountUuid: string;
    issuedAt?: Date;
    expiresAt: Date;
    deviceInfo?: string;
    isRevoked?: boolean;
  }) {
    super();
    this._value = params.value;
    this._type = params.type;
    this._accountUuid = params.accountUuid;
    this._issuedAt = params.issuedAt || new Date();
    this._expiresAt = params.expiresAt;
    this._deviceInfo = params.deviceInfo;
    this._isRevoked = params.isRevoked || false;
  }

  // ===== ITokenCore 属性访问器 =====
  get value(): string {
    return this._value;
  }

  get type(): TokenType {
    return this._type;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get issuedAt(): Date {
    return this._issuedAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get deviceInfo(): string | undefined {
    return this._deviceInfo;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  // ===== ITokenCore 方法 =====
  isValid(): boolean {
    return !this.isExpired() && !this._isRevoked;
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  revoke(): void {
    this._isRevoked = true;
  }

  isNearExpiry(): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return this._expiresAt.getTime() - Date.now() < fiveMinutes;
  }

  getRemainingTime(): number {
    return Math.max(0, this._expiresAt.getTime() - Date.now());
  }

  // ===== ITokenServer 方法 =====
  async saveToDatabase(): Promise<void> {
    // TODO: 实现数据库保存
  }

  async validateWithJWT(): Promise<boolean> {
    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(this._value, secret) as any;
      return decoded.accountUuid === this._accountUuid && decoded.type === this._type;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<ITokenServer> {
    // TODO: 实现令牌刷新
    throw new Error('Not implemented');
  }

  async blacklistToken(): Promise<void> {
    this._isRevoked = true;
    await this.saveToDatabase();
  }

  isServer(): boolean {
    return true;
  }

  isClient(): boolean {
    return false;
  }

  // ===== 业务方法 =====
  equals(other: ValueObject): boolean {
    if (!(other instanceof Token)) {
      return false;
    }
    return this._value === other._value;
  }

  // ===== 静态工厂方法 =====
  static createAccessToken(accountUuid: string, secret: string = 'default-secret'): Token {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    const payload = {
      accountUuid,
      type: TokenType.ACCESS_TOKEN,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const value = jwt.sign(payload, secret);

    return new Token({
      value,
      type: TokenType.ACCESS_TOKEN,
      accountUuid,
      expiresAt,
    });
  }

  static createRefreshToken(accountUuid: string, secret: string = 'default-secret'): Token {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
    const payload = {
      accountUuid,
      type: TokenType.REFRESH_TOKEN,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const value = jwt.sign(payload, secret);

    return new Token({
      value,
      type: TokenType.REFRESH_TOKEN,
      accountUuid,
      expiresAt,
    });
  }

  static createPasswordResetToken(accountUuid: string, secret: string = 'default-secret'): Token {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时
    const payload = {
      accountUuid,
      type: TokenType.PASSWORD_RESET,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const value = jwt.sign(payload, secret);

    return new Token({
      value,
      type: TokenType.PASSWORD_RESET,
      accountUuid,
      expiresAt,
    });
  }

  static createEmailVerificationToken(
    accountUuid: string,
    secret: string = 'default-secret',
  ): Token {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    const payload = {
      accountUuid,
      type: TokenType.EMAIL_VERIFICATION,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const value = jwt.sign(payload, secret);

    return new Token({
      value,
      type: TokenType.EMAIL_VERIFICATION,
      accountUuid,
      expiresAt,
    });
  }

  static fromPersistence(params: {
    value: string;
    type: TokenType;
    accountUuid: string;
    issuedAt: Date;
    expiresAt: Date;
    deviceInfo?: string;
    isRevoked: boolean;
  }): Token {
    return new Token(params);
  }
}
