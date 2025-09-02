import { AggregateRoot } from '@dailyuse/utils';
import {
  type IAuthCredentialCore,
  type IPasswordCore,
  type ISessionCore,
  type IMFADeviceCore,
  type ITokenCore,
  TokenType,
} from '../types';
import { PasswordCore } from '../valueObjects/PasswordCore';
import { TokenCore } from '../valueObjects/TokenCore';
import { SessionCore } from '../entities/SessionCore';
import { MFADeviceCore } from '../entities/MFADeviceCore';
import type { ClientInfo } from '../../shared/types';
/**
 * 核心认证凭据 - 仅包含数据和基础计算
 * 前后端共享的基础模型
 */
export abstract class AuthCredentialCore extends AggregateRoot implements IAuthCredentialCore {
  protected _accountUuid: string;
  protected _password: PasswordCore;
  protected _sessions: Map<string, SessionCore>;
  protected _mfaDevices: Map<string, MFADeviceCore>;
  protected _tokens: Map<string, TokenCore>;
  protected _failedAttempts: number;
  protected _maxAttempts: number;
  protected _lockedUntil?: Date;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _lastAuthAt?: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    password: PasswordCore;
    sessions?: Map<string, SessionCore>;
    mfaDevices?: Map<string, MFADeviceCore>;
    tokens?: Map<string, TokenCore>;
    failedAttempts?: number;
    lockedUntil?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    lastAuthAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._password = params.password;
    this._sessions = params.sessions || new Map();
    this._mfaDevices = params.mfaDevices || new Map();
    this._tokens = params.tokens || new Map();
    this._failedAttempts = params.failedAttempts || 0;
    this._maxAttempts = 5; // 默认最大尝试次数
    this._lockedUntil = params.lockedUntil;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._lastAuthAt = params.lastAuthAt;
  }

  // ===== 共享属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }

  get password(): IPasswordCore {
    return this._password;
  }

  get sessions(): Map<string, ISessionCore> {
    return this._sessions;
  }

  get mfaDevices(): Map<string, IMFADeviceCore> {
    return this._mfaDevices;
  }

  get tokens(): Map<string, ITokenCore> {
    return this._tokens;
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastAuthAt(): Date | undefined {
    return this._lastAuthAt;
  }

  // ===== 共享计算属性 =====
  get isLocked(): boolean {
    return this._lockedUntil !== undefined && this._lockedUntil > new Date();
  }

  get lockTimeRemaining(): number {
    if (!this._lockedUntil) return 0;
    return Math.max(0, this._lockedUntil.getTime() - Date.now());
  }

  get canAttemptLogin(): boolean {
    return !this.isLocked && this._failedAttempts < 5;
  }

  // ===== 记住我令牌相关方法 =====
  getRememberTokens(): ITokenCore[] {
    const rememberTokens: ITokenCore[] = [];
    for (const token of this._tokens.values()) {
      if (token.type === TokenType.REMEMBER_ME && token.isValid()) {
        rememberTokens.push(token);
      }
    }
    return rememberTokens;
  }

  getRememberTokenForDevice(deviceInfo: string): ITokenCore | undefined {
    for (const token of this._tokens.values()) {
      if (
        token.type === TokenType.REMEMBER_ME &&
        token.isValid() &&
        token.deviceInfo === deviceInfo
      ) {
        return token;
      }
    }
    return undefined;
  }

  hasValidRememberToken(deviceInfo?: string): boolean {
    if (deviceInfo) {
      return this.getRememberTokenForDevice(deviceInfo) !== undefined;
    }
    return this.getRememberTokens().length > 0;
  }

  // ===== 共享业务规则 =====
  protected incrementFailedAttempts(): void {
    this._failedAttempts++;
    if (this._failedAttempts >= 5) {
      this._lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    this._updatedAt = new Date();
  }

  protected resetFailedAttempts(): void {
    this._failedAttempts = 0;
    this._lockedUntil = undefined;
    this._updatedAt = new Date();
  }

  // ===== 抽象方法 - 需要具体实现 =====
  // abstract authenticate(password: string): boolean;
  // abstract changePassword(oldPassword: string, newPassword: string): void;
  // abstract createSession(deviceInfo: ClientInfo): ISessionCore;
  // abstract terminateSession(sessionUuid: string): void;
  // abstract terminateAllSessions(): void;
  // abstract addMFADevice(device: IMFADeviceCore): void;
  // abstract removeMFADevice(deviceUuid: string): void;
  // abstract createToken(type: TokenType): ITokenCore;
  // abstract createRememberToken(deviceInfo?: string): ITokenCore;
  // abstract revokeToken(tokenValue: string): void;
}
