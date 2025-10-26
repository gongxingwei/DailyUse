/**
 * AuthCredential 聚合根实现 (Client)
 * 兼容 AuthCredentialClient 接口
 */

import {
  AuthenticationContracts,
  CredentialType,
  CredentialStatus,
  TwoFactorMethod,
  BiometricType,
} from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { PasswordCredential } from '../entities/PasswordCredential';
import { ApiKeyCredential } from '../entities/ApiKeyCredential';
import { RememberMeToken } from '../entities/RememberMeToken';
import { CredentialHistory } from '../entities/CredentialHistory';

type IAuthCredentialClient = AuthenticationContracts.AuthCredentialClient;
type AuthCredentialClientDTO = AuthenticationContracts.AuthCredentialClientDTO;
type AuthCredentialServerDTO = AuthenticationContracts.AuthCredentialServerDTO;

/**
 * AuthCredential 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理认证凭证信息
 * - 管理子实体（密码凭证、API密钥、记住我令牌等）
 * - 提供认证相关的业务逻辑
 */
export class AuthCredential extends AggregateRoot implements IAuthCredentialClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _type: CredentialType;
  private _passwordCredential: PasswordCredential | null;
  private _apiKeyCredentials: ApiKeyCredential[];
  private _rememberMeTokens: RememberMeToken[];
  private _twoFactor: {
    enabled: boolean;
    method: TwoFactorMethod;
    verifiedAt?: number | null;
  } | null;
  private _biometric: {
    enabled: boolean;
    type: BiometricType;
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  private _status: CredentialStatus;
  private _security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  private _history: CredentialHistory[];
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    type: CredentialType;
    passwordCredential?: PasswordCredential | null;
    apiKeyCredentials: ApiKeyCredential[];
    rememberMeTokens: RememberMeToken[];
    twoFactor?: {
      enabled: boolean;
      method: TwoFactorMethod;
      verifiedAt?: number | null;
    } | null;
    biometric?: {
      enabled: boolean;
      type: BiometricType;
      deviceId?: string | null;
      enrolledAt?: number | null;
    } | null;
    status: CredentialStatus;
    security: {
      requirePasswordChange: boolean;
      passwordExpiresAt?: number | null;
      failedLoginAttempts: number;
      lastFailedLoginAt?: number | null;
      lockedUntil?: number | null;
      lastPasswordChangeAt?: number | null;
    };
    history: CredentialHistory[];
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._type = params.type;
    this._passwordCredential = params.passwordCredential ?? null;
    this._apiKeyCredentials = params.apiKeyCredentials;
    this._rememberMeTokens = params.rememberMeTokens;
    this._twoFactor = params.twoFactor ?? null;
    this._biometric = params.biometric ?? null;
    this._status = params.status;
    this._security = params.security;
    this._history = params.history;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get type(): CredentialType {
    return this._type;
  }
  public get passwordCredential(): PasswordCredential | null {
    return this._passwordCredential;
  }
  public get apiKeyCredentials(): ApiKeyCredential[] {
    return [...this._apiKeyCredentials];
  }
  public get rememberMeTokens(): RememberMeToken[] {
    return [...this._rememberMeTokens];
  }
  public get twoFactor(): AuthCredential['_twoFactor'] {
    return this._twoFactor ? { ...this._twoFactor } : null;
  }
  public get biometric(): AuthCredential['_biometric'] {
    return this._biometric ? { ...this._biometric } : null;
  }
  public get status(): CredentialStatus {
    return this._status;
  }
  public get security(): AuthCredential['_security'] {
    return { ...this._security };
  }
  public get history(): CredentialHistory[] {
    return [...this._history];
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的认证凭证
   */
  public static create(params: { accountUuid: string; type: CredentialType }): AuthCredential {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new AuthCredential({
      uuid,
      accountUuid: params.accountUuid,
      type: params.type,
      apiKeyCredentials: [],
      rememberMeTokens: [],
      status: CredentialStatus.ACTIVE,
      security: {
        requirePasswordChange: false,
        failedLoginAttempts: 0,
      },
      history: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  public clone(): AuthCredential {
    return AuthCredential.fromClientDTO(this.toClientDTO());
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AuthCredentialClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      type: this._type,
      passwordCredential: this._passwordCredential?.toClientDTO() || null,
      apiKeyCredentials: this._apiKeyCredentials.map((k) => k.toClientDTO()),
      rememberMeTokens: this._rememberMeTokens.map((t) => t.toClientDTO()),
      twoFactor: this._twoFactor ? { ...this._twoFactor } : null,
      biometric: this._biometric ? { ...this._biometric } : null,
      status: this._status,
      security: { ...this._security },
      history: this._history.map((h) => h.toClientDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromClientDTO(dto: AuthCredentialClientDTO): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type as CredentialType,
      passwordCredential: dto.passwordCredential
        ? PasswordCredential.fromClientDTO(dto.passwordCredential)
        : null,
      apiKeyCredentials: dto.apiKeyCredentials.map((k) => ApiKeyCredential.fromClientDTO(k)),
      rememberMeTokens: dto.rememberMeTokens.map((t) => RememberMeToken.fromClientDTO(t)),
      twoFactor: dto.twoFactor
        ? {
            ...dto.twoFactor,
            method: dto.twoFactor.method as TwoFactorMethod,
          }
        : null,
      biometric: dto.biometric
        ? {
            ...dto.biometric,
            type: dto.biometric.type as BiometricType,
          }
        : null,
      status: dto.status as CredentialStatus,
      security: { ...dto.security },
      history: dto.history.map((h) => CredentialHistory.fromClientDTO(h)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromServerDTO(dto: AuthCredentialServerDTO): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type as CredentialType,
      passwordCredential: dto.passwordCredential
        ? PasswordCredential.fromClientDTO(dto.passwordCredential)
        : null,
      apiKeyCredentials: dto.apiKeyCredentials.map((k) => ApiKeyCredential.fromClientDTO(k)),
      rememberMeTokens: dto.rememberMeTokens.map((t) => RememberMeToken.fromClientDTO(t)),
      twoFactor: dto.twoFactor
        ? {
            ...dto.twoFactor,
            method: dto.twoFactor.method as TwoFactorMethod,
          }
        : null,
      biometric: dto.biometric
        ? {
            ...dto.biometric,
            type: dto.biometric.type as BiometricType,
          }
        : null,
      status: dto.status as CredentialStatus,
      security: { ...dto.security },
      history: dto.history.map((h) => CredentialHistory.fromClientDTO(h)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
