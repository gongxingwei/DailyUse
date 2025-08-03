
import { IToken, TokenType, ITokenDTO } from "@common/modules/authentication/types/authentication";
import { isValid, addDays, addMinutes, addHours } from "date-fns";
import { ValueObject } from "@common/shared/domain/valueObject";

/**
 * 令牌值对象
 * 封装各种类型的令牌和相关验证逻辑
 */
export class Token extends ValueObject<string> implements IToken {
  private _type: TokenType;
  private _accountUuUuid: string;
  private _issuedAt: Date;
  private _expiresAt: Date;
  private _deviceInfo?: string;
  private _isRevoked: boolean;

  constructor(params: {
    value?: string;
    type: TokenType;
    accountUuid: string;
    issuedAt?: Date;
    expiresAt: Date;
    deviceInfo?: string;
    isRevoked?: boolean;
  }) {
    super(params.value || Token.generateTokenValue());
    this._type = params.type;
    this._accountUuUuid = params.accountUuid;
    this._issuedAt = params.issuedAt ?? new Date();
    this._expiresAt = params.expiresAt;
    this._deviceInfo = params.deviceInfo;
    this._isRevoked = params.isRevoked ?? false;
  }

  /**
   * 创建记住我令牌
   */
  static createRememberToken(accountUuid: string, deviceInfo: string, daysToExpire: number = 30): Token {
    const value = Token.generateTokenValue();
    const expiresAt = addDays(new Date(), daysToExpire);
    return new Token({ value, type: TokenType.REMEMBER_ME, accountUuid, expiresAt, deviceInfo });
  }

  /**
   * 创建访问令牌
   */
  static createAccessToken(accountUuid: string, minutesToExpire: number = 60): Token {
    const value = Token.generateTokenValue();
    const expiresAt = addMinutes(new Date(), minutesToExpire);
    return new Token({ value, type: TokenType.ACCESS_TOKEN, accountUuid, expiresAt });
  }

  /**
   * 创建刷新令牌
   */
  static createRefreshToken(accountUuid: string, daysToExpire: number = 7): Token {
    const value = Token.generateTokenValue();
    const expiresAt = addDays(new Date(), daysToExpire);
    return new Token({ value, type: TokenType.REFRESH_TOKEN, accountUuid, expiresAt });
  }

  /**
   * 创建邮箱验证令牌
   */
  static createEmailVerificationToken(accountUuid: string, hoursToExpire: number = 24): Token {
    const value = Token.generateTokenValue();
    const expiresAt = addHours(new Date(), hoursToExpire);
    return new Token({ value, type: TokenType.EMAIL_VERIFICATION, accountUuid, expiresAt });
  }

  /**
   * 创建密码重置令牌
   */
  static createPasswordResetToken(accountUuid: string, hoursToExpire: number = 2): Token {
    const value = Token.generateTokenValue();
    const expiresAt = addHours(new Date(), hoursToExpire);
    return new Token({ value, type: TokenType.PASSWORD_RESET, accountUuid, expiresAt });
  }

  /**
   * 检查令牌是否有效
   */
  isValid(): boolean {
    if (this._isRevoked) {
      return false;
    }
    const now = new Date();
    return now.getTime() < this._expiresAt.getTime();
  }

  /**
   * 检查令牌是否已过期
   */
  isExpired(): boolean {
    const now = new Date();
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
    const now = new Date();
    const totalLifetime = this._expiresAt.getTime() - this._issuedAt.getTime();
    const remainingTime = this._expiresAt.getTime() - now.getTime();
    return remainingTime < (totalLifetime * 0.2);
  }

  /**
   * 获取剩余有效时间（毫秒）
   */
  getRemainingTime(): number {
    const now = new Date();
    return Math.max(0, this._expiresAt.getTime() - now.getTime());
  }

  extendExpiry(days: number = 30): void {
    this._expiresAt = addDays(new Date(), days);
  }

  // Getters
  get value(): string {
    return this._value;
  }

  get type(): TokenType {
    return this._type;
  }

  get accountUuid(): string {
    return this._accountUuUuid;
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

  /**
   * 生成随机令牌值
   */
  private static generateTokenValue(): string {
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
  toDTO(): ITokenDTO {
    return {
      value: this._value,
      type: this._type,
      accountUuid: this._accountUuUuid,
      issuedAt: this._issuedAt.toISOString(),
      expiresAt: this._expiresAt.toISOString(),
      deviceInfo: this._deviceInfo,
      isRevoked: this._isRevoked
    };
  }

  /**
   * 从DTO对象创建 Token
   */
  static fromDTO(dto: ITokenDTO): Token {
    return new Token({
      value: dto.value,
      type: dto.type,
      accountUuid: dto.accountUuid,
      issuedAt: isValid(dto.issuedAt) ? new Date(dto.issuedAt) : new Date(),
      expiresAt: isValid(dto.expiresAt) ? new Date(dto.expiresAt) : new Date(),
      deviceInfo: dto.deviceInfo,
      isRevoked: dto.isRevoked
    });
  }
}