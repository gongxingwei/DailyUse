import { ValueObject } from '@dailyuse/utils';

export enum TokenType {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  REMEMBER_ME = 'remember_me',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
}

export class Token extends ValueObject {
  private readonly _value: string;
  private readonly _type: TokenType;
  private readonly _accountUuid: string;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _isRevoked: boolean;

  constructor(params: {
    value: string;
    type: TokenType;
    accountUuid: string;
    expiresAt: Date;
    createdAt?: Date;
    isRevoked?: boolean;
  }) {
    super();
    this._value = params.value;
    this._type = params.type;
    this._accountUuid = params.accountUuid;
    this._expiresAt = params.expiresAt;
    this._createdAt = params.createdAt || new Date();
    this._isRevoked = params.isRevoked || false;
  }

  get value(): string {
    return this._value;
  }

  get type(): TokenType {
    return this._type;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  isValid(): boolean {
    if (this._isRevoked) {
      return false;
    }
    return new Date() < this._expiresAt;
  }

  revoke(): void {
    this._isRevoked = true;
  }

  static createAccessToken(accountUuid: string, expirationMinutes: number = 60): Token {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);
    const tokenValue = `access_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    return new Token({
      value: tokenValue,
      type: TokenType.ACCESS_TOKEN,
      accountUuid,
      expiresAt,
      createdAt: now,
    });
  }

  static createRefreshToken(accountUuid: string, expirationDays: number = 30): Token {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    const tokenValue = `refresh_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    return new Token({
      value: tokenValue,
      type: TokenType.REFRESH_TOKEN,
      accountUuid,
      expiresAt,
      createdAt: now,
    });
  }

  static createRememberMeToken(accountUuid: string, expirationDays: number = 90): Token {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    const tokenValue = `remember_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    return new Token({
      value: tokenValue,
      type: TokenType.REMEMBER_ME,
      accountUuid,
      expiresAt,
      createdAt: now,
    });
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Token)) {
      return false;
    }
    return this._value === other._value;
  }
}
