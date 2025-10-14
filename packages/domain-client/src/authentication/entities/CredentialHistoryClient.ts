/**
 * CredentialHistory Entity - Client Implementation
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

export class CredentialHistoryClient extends Entity implements AuthC.CredentialHistoryClient {
  constructor(
    uuid: string,
    public readonly credentialUuid: string,
    public readonly action: string,
    public readonly details: any | null | undefined,
    public readonly ipAddress: string | null | undefined,
    public readonly userAgent: string | null | undefined,
    public readonly createdAt: number,
  ) {
    super(uuid);
  }

  get actionText(): string {
    const map: Record<string, string> = {
      'credential.created': '创建凭证',
      'credential.updated': '更新凭证',
      'password.changed': '修改密码',
      'apikey.created': '创建 API Key',
      'apikey.revoked': '撤销 API Key',
      'twoFactor.enabled': '启用两步验证',
      'twoFactor.disabled': '禁用两步验证',
    };
    return map[this.action] || this.action;
  }

  toClientDTO(): AuthC.CredentialHistoryClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      action: this.action,
      details: this.details ?? null,
      ipAddress: this.ipAddress ?? null,
      userAgent: this.userAgent ?? null,
      createdAt: this.createdAt,
    };
  }

  static fromClientDTO(dto: AuthC.CredentialHistoryClientDTO): CredentialHistoryClient {
    return new CredentialHistoryClient(
      dto.uuid,
      dto.credentialUuid,
      dto.action,
      dto.details,
      dto.ipAddress,
      dto.userAgent,
      dto.createdAt,
    );
  }
}
