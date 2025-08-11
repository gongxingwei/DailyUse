import { Entity } from '@dailyuse/utils';

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

export class Session extends Entity {
  private _accountUuid: string;
  private _token: string;
  private _status: SessionStatus;
  private _createdAt: Date;
  private _expiresAt: Date;
  private _lastActivityAt: Date;
  private _clientInfo?: {
    ip?: string;
    userAgent?: string;
    deviceId?: string;
    location?: string;
  };

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    token: string;
    expiresAt: Date;
    clientInfo?: {
      ip?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    };
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._token = params.token;
    this._status = SessionStatus.ACTIVE;
    this._createdAt = new Date();
    this._expiresAt = params.expiresAt;
    this._lastActivityAt = this._createdAt;
    this._clientInfo = params.clientInfo;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get token(): string {
    return this._token;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get lastActivityAt(): Date {
    return this._lastActivityAt;
  }

  get clientInfo() {
    return this._clientInfo;
  }

  get isActive(): boolean {
    return this._status === SessionStatus.ACTIVE && new Date() < this._expiresAt;
  }

  get isExpired(): boolean {
    return new Date() >= this._expiresAt;
  }

  updateLastActivity(): void {
    this._lastActivityAt = new Date();
  }

  extend(additionalMinutes: number): void {
    const newExpiration = new Date(this._expiresAt.getTime() + additionalMinutes * 60 * 1000);
    this._expiresAt = newExpiration;
    this.updateLastActivity();
  }

  terminate(): void {
    this._status = SessionStatus.TERMINATED;
    this.updateLastActivity();
  }

  expire(): void {
    this._status = SessionStatus.EXPIRED;
  }

  static createSession(accountUuid: string, durationMinutes: number = 120): Session {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const sessionToken = `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    return new Session({
      accountUuid,
      token: sessionToken,
      expiresAt,
    });
  }
}
