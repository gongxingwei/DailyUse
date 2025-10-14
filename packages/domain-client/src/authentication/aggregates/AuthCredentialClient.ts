/**
 * AuthCredential Aggregate Root - Client Implementation
 * 认证凭证聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';
import { PasswordCredentialClient } from '../entities/PasswordCredentialClient';
import { ApiKeyCredentialClient } from '../entities/ApiKeyCredentialClient';
import { RememberMeTokenClient } from '../entities/RememberMeTokenClient';
import { CredentialHistoryClient } from '../entities/CredentialHistoryClient';

type CredentialType = AuthC.CredentialType;
type CredentialStatus = AuthC.CredentialStatus;
type TwoFactorMethod = AuthC.TwoFactorMethod;
type BiometricType = AuthC.BiometricType;

const CredentialType = AuthC.CredentialType;
const CredentialStatus = AuthC.CredentialStatus;

export class AuthCredentialClient extends AggregateRoot implements AuthC.AuthCredentialClient {
  constructor(
    uuid: string,
    public readonly accountUuid: string,
    public readonly type: CredentialType,
    public readonly passwordCredential: PasswordCredentialClient | null | undefined,
    public readonly apiKeyCredentials: ApiKeyCredentialClient[],
    public readonly rememberMeTokens: RememberMeTokenClient[],
    public readonly twoFactor:
      | {
          enabled: boolean;
          method: TwoFactorMethod;
          verifiedAt?: number | null;
        }
      | null
      | undefined,
    public readonly biometric:
      | {
          enabled: boolean;
          type: BiometricType;
          deviceId?: string | null;
          enrolledAt?: number | null;
        }
      | null
      | undefined,
    public readonly status: CredentialStatus,
    public readonly security: {
      requirePasswordChange: boolean;
      passwordExpiresAt?: number | null;
      failedLoginAttempts: number;
      lastFailedLoginAt?: number | null;
      lockedUntil?: number | null;
      lastPasswordChangeAt?: number | null;
    },
    public readonly history: CredentialHistoryClient[],
    public readonly createdAt: number,
    public readonly updatedAt: number,
  ) {
    super(uuid);
  }

  // ========== UI 计算属性 ==========

  get statusText(): string {
    const map = {
      [CredentialStatus.ACTIVE]: '活跃',
      [CredentialStatus.SUSPENDED]: '已暂停',
      [CredentialStatus.EXPIRED]: '已过期',
      [CredentialStatus.REVOKED]: '已撤销',
    };
    return map[this.status];
  }

  get isActive(): boolean {
    return this.status === CredentialStatus.ACTIVE;
  }

  get isLocked(): boolean {
    if (!this.security.lockedUntil) return false;
    return Date.now() < this.security.lockedUntil;
  }

  get hasTwoFactor(): boolean {
    return this.twoFactor?.enabled ?? false;
  }

  get hasBiometric(): boolean {
    return this.biometric?.enabled ?? false;
  }

  get hasActiveApiKeys(): boolean {
    return this.apiKeyCredentials.some((key) => key.isActive);
  }

  get activeApiKeysCount(): number {
    return this.apiKeyCredentials.filter((key) => key.isActive).length;
  }

  get twoFactorMethodText(): string {
    if (!this.twoFactor?.enabled) return '未启用';
    const map = {
      TOTP: 'TOTP',
      SMS: '短信',
      EMAIL: '邮箱',
      AUTHENTICATOR_APP: '认证器应用',
    };
    return map[this.twoFactor.method] || this.twoFactor.method;
  }

  // ========== UI 方法 ==========

  getStatusBadge(): { text: string; variant: string; icon: string } {
    if (this.isActive) {
      return { text: '活跃', variant: 'success', icon: 'check-circle' };
    }
    if (this.status === CredentialStatus.SUSPENDED) {
      return { text: '已暂停', variant: 'warning', icon: 'pause-circle' };
    }
    if (this.status === CredentialStatus.EXPIRED) {
      return { text: '已过期', variant: 'danger', icon: 'x-circle' };
    }
    return { text: '已撤销', variant: 'danger', icon: 'slash' };
  }

  getSecurityBadge(): { text: string; variant: string; icon: string } {
    const score = this.calculateSecurityScore();
    if (score >= 80) {
      return { text: '安全', variant: 'success', icon: 'shield-check' };
    }
    if (score >= 50) {
      return { text: '一般', variant: 'warning', icon: 'shield' };
    }
    return { text: '弱', variant: 'danger', icon: 'shield-off' };
  }

  private calculateSecurityScore(): number {
    let score = 0;
    if (this.passwordCredential) score += 30;
    if (this.hasTwoFactor) score += 40;
    if (this.hasBiometric) score += 20;
    if (this.hasActiveApiKeys) score += 10;
    return score;
  }

  // ========== 权限检查 ==========

  canChangePassword(): boolean {
    return this.isActive && !this.isLocked;
  }

  canEnableTwoFactor(): boolean {
    return this.isActive && !this.hasTwoFactor;
  }

  canDisableTwoFactor(): boolean {
    return this.isActive && this.hasTwoFactor;
  }

  canCreateApiKey(): boolean {
    return this.isActive;
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AuthC.AuthCredentialClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      type: this.type,
      passwordCredential: this.passwordCredential ?? null,
      apiKeyCredentials: this.apiKeyCredentials,
      rememberMeTokens: this.rememberMeTokens,
      twoFactor: this.twoFactor ?? null,
      biometric: this.biometric ?? null,
      status: this.status,
      security: this.security,
      history: this.history,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromClientDTO(dto: AuthC.AuthCredentialClientDTO): AuthCredentialClient {
    return new AuthCredentialClient(
      dto.uuid,
      dto.accountUuid,
      dto.type as CredentialType,
      dto.passwordCredential
        ? PasswordCredentialClient.fromClientDTO(
            dto.passwordCredential as AuthC.PasswordCredentialClientDTO,
          )
        : null,
      dto.apiKeyCredentials.map((k) =>
        ApiKeyCredentialClient.fromClientDTO(k as AuthC.ApiKeyCredentialClientDTO),
      ),
      dto.rememberMeTokens.map((t) =>
        RememberMeTokenClient.fromClientDTO(t as AuthC.RememberMeTokenClientDTO),
      ),
      dto.twoFactor
        ? {
            enabled: dto.twoFactor.enabled,
            method: dto.twoFactor.method as TwoFactorMethod,
            verifiedAt: dto.twoFactor.verifiedAt,
          }
        : null,
      dto.biometric
        ? {
            enabled: dto.biometric.enabled,
            type: dto.biometric.type as BiometricType,
            deviceId: dto.biometric.deviceId,
            enrolledAt: dto.biometric.enrolledAt,
          }
        : null,
      dto.status as CredentialStatus,
      dto.security,
      dto.history.map((h) =>
        CredentialHistoryClient.fromClientDTO(h as AuthC.CredentialHistoryClientDTO),
      ),
      dto.createdAt,
      dto.updatedAt,
    );
  }
}
