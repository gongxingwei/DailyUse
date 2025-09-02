import { ValueObject } from '@dailyuse/utils';
import { TokenType, TokenCore } from '@dailyuse/domain-core';
import { type ITokenServer } from '../types';
import jwt from 'jsonwebtoken';

/**
 * Token值对象 - JWT令牌管理
 */
export class Token extends TokenCore implements ITokenServer {
  // ===== ITokenCore 方法 =====
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  revoke(): void {
    super.revoke();
  }

  isNearExpiry(): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return this.expiresAt.getTime() - Date.now() < fiveMinutes;
  }

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  // ===== ITokenServer 方法 =====
  async saveToDatabase(): Promise<void> {
    // TODO: 实现数据库保存
  }

  async validateWithJWT(): Promise<boolean> {
    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(this.value, secret) as any;
      return decoded.accountUuid === this.accountUuid && decoded.type === this.type;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<ITokenServer> {
    // TODO: 实现令牌刷新
    throw new Error('Not implemented');
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
    return this.value === other.value;
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

  static createRememberToken(
    accountUuid: string,
    deviceInfo?: string,
    secret: string = 'default-secret',
  ): Token {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
    const payload = {
      accountUuid,
      type: TokenType.REMEMBER_ME,
      exp: Math.floor(expiresAt.getTime() / 1000),
      deviceInfo,
    };

    const value = jwt.sign(payload, secret);

    return new Token({
      value,
      type: TokenType.REMEMBER_ME,
      accountUuid,
      expiresAt,
      deviceInfo,
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
