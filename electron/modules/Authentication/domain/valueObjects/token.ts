import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

/**
 * 令牌类型枚举
 */
export enum TokenType {
  REMEMBER_ME = 'remember_me',
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset'
}

/**
 * 令牌值对象
 * 封装各种类型的令牌和相关验证逻辑
 */
export class Token {
  private readonly _value: string;
  private readonly _type: TokenType;
  private readonly _accountId: string;
  private readonly _issuedAt: DateTime;
  private readonly _expiresAt: DateTime;
  private readonly _deviceInfo?: string;
  private _isRevoked: boolean;

  constructor(
    value: string,
    type: TokenType,
    accountId: string,
    expiresAt: DateTime,
    deviceInfo?: string
  ) {
    this._value = value;
    this._type = type;
    this._accountId = accountId;
    this._issuedAt = TimeUtils.now();
    this._expiresAt = expiresAt;
    this._deviceInfo = deviceInfo;
    this._isRevoked = false;
  }

  /**
   * 创建记住我令牌
   */
  static createRememberToken(accountId: string, deviceInfo: string, daysToExpire: number = 30): Token {
    const value = Token.generateTokenValue();
    const expiresAt = TimeUtils.add(TimeUtils.now(), daysToExpire, 'days');
    
    return new Token(value, TokenType.REMEMBER_ME, accountId, expiresAt, deviceInfo);
  }

  /**
   * 创建访问令牌
   */
  static createAccessToken(accountId: string, minutesToExpire: number = 60): Token {
    const value = Token.generateTokenValue();
    const expiresAt = TimeUtils.add(TimeUtils.now(), minutesToExpire, 'minutes');
    
    return new Token(value, TokenType.ACCESS_TOKEN, accountId, expiresAt);
  }

  /**
   * 创建刷新令牌
   */
  static createRefreshToken(accountId: string, daysToExpire: number = 7): Token {
    const value = Token.generateTokenValue();
    const expiresAt = TimeUtils.add(TimeUtils.now(), daysToExpire, 'days');
    
    return new Token(value, TokenType.REFRESH_TOKEN, accountId, expiresAt);
  }

  /**
   * 创建邮箱验证令牌
   */
  static createEmailVerificationToken(accountId: string, hoursToExpire: number = 24): Token {
    const value = Token.generateTokenValue();
    const expiresAt = TimeUtils.add(TimeUtils.now(), hoursToExpire, 'hours');
    
    return new Token(value, TokenType.EMAIL_VERIFICATION, accountId, expiresAt);
  }

  /**
   * 创建密码重置令牌
   */
  static createPasswordResetToken(accountId: string, hoursToExpire: number = 2): Token {
    const value = Token.generateTokenValue();
    const expiresAt = TimeUtils.add(TimeUtils.now(), hoursToExpire, 'hours');
    
    return new Token(value, TokenType.PASSWORD_RESET, accountId, expiresAt);
  }

  /**
   * 检查令牌是否有效
   */
  isValid(): boolean {
    if (this._isRevoked) {
      return false;
    }
    
    const now = TimeUtils.now();
    return now.getTime() < this._expiresAt.getTime();
  }

  /**
   * 检查令牌是否已过期
   */
  isExpired(): boolean {
    const now = TimeUtils.now();
    return now.getTime() >= this._expiresAt.getTime();
  }

  /**
   * 撤销令牌
   */
  revoke(): void {
    this._isRevoked = true;
  }

  /**
   * 检查是否即将过期（剩余时间少于总时间的20%）
   */
  isNearExpiry(): boolean {
    const now = TimeUtils.now();
    const totalLifetime = this._expiresAt.getTime() - this._issuedAt.getTime();
    const remainingTime = this._expiresAt.getTime() - now.getTime();
    
    return remainingTime < (totalLifetime * 0.2);
  }

  /**
   * 获取剩余有效时间（毫秒）
   */
  getRemainingTime(): number {
    const now = TimeUtils.now();
    return Math.max(0, this._expiresAt.getTime() - now.getTime());
  }

  // Getters
  get value(): string {
    return this._value;
  }

  get type(): TokenType {
    return this._type;
  }

  get accountId(): string {
    return this._accountId;
  }

  get issuedAt(): DateTime {
    return this._issuedAt;
  }

  get expiresAt(): DateTime {
    return this._expiresAt;
  }

  get deviceInfo(): string | undefined {
    return this._deviceInfo;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  /**
   * 生成随机令牌值
   */
  private static generateTokenValue(): string {
    // 生成加密安全的随机令牌
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    value: string;
    type: TokenType;
    accountId: string;
    issuedAt: string;
    expiresAt: string;
    deviceInfo?: string;
    isRevoked: boolean;
  } {
    return {
      value: this._value,
      type: this._type,
      accountId: this._accountId,
      issuedAt: this._issuedAt.toISOString(),
      expiresAt: this._expiresAt.toISOString(),
      deviceInfo: this._deviceInfo,
      isRevoked: this._isRevoked
    };
  }

  /**
   * 从数据库行创建 Token 对象
   */
  static fromDatabase(
    value: string,
    type: TokenType,
    accountId: string,
    issuedAt: DateTime,
    expiresAt: DateTime,
    deviceInfo?: string,
    isRevoked: boolean = false
  ): Token {
    const token = new Token(value, type, accountId, expiresAt, deviceInfo);
    // 设置从数据库读取的签发时间和撤销状态
    (token as any)._issuedAt = issuedAt;
    (token as any)._isRevoked = isRevoked;
    return token;
  }
}
