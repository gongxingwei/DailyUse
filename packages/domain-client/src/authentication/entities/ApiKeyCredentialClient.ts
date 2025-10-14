/**
 * ApiKeyCredential Entity - Client Implementation
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

type ApiKeyStatus = AuthC.ApiKeyStatus;
const ApiKeyStatus = AuthC.ApiKeyStatus;

export class ApiKeyCredentialClient extends Entity implements AuthC.ApiKeyCredentialClient {
  constructor(
    uuid: string,
    public readonly credentialUuid: string,
    public readonly name: string,
    public readonly keyPrefix: string,
    public readonly status: ApiKeyStatus,
    public readonly lastUsedAt: number | null | undefined,
    public readonly expiresAt: number | null | undefined,
    public readonly createdAt: number,
    public readonly updatedAt: number,
  ) {
    super(uuid);
  }

  get statusText(): string {
    const map = {
      [ApiKeyStatus.ACTIVE]: '活跃',
      [ApiKeyStatus.REVOKED]: '已撤销',
      [ApiKeyStatus.EXPIRED]: '已过期',
    };
    return map[this.status];
  }

  get isActive(): boolean {
    return this.status === ApiKeyStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return this.status === ApiKeyStatus.EXPIRED;
  }

  get lastUsedText(): string {
    if (!this.lastUsedAt) return '从未使用';
    const diff = Date.now() - this.lastUsedAt;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    return new Date(this.lastUsedAt).toLocaleDateString('zh-CN');
  }

  toClientDTO(): AuthC.ApiKeyCredentialClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      name: this.name,
      keyPrefix: this.keyPrefix,
      status: this.status,
      lastUsedAt: this.lastUsedAt ?? null,
      expiresAt: this.expiresAt ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromClientDTO(dto: AuthC.ApiKeyCredentialClientDTO): ApiKeyCredentialClient {
    return new ApiKeyCredentialClient(
      dto.uuid,
      dto.credentialUuid,
      dto.name,
      dto.keyPrefix,
      dto.status as ApiKeyStatus,
      dto.lastUsedAt,
      dto.expiresAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }
}
