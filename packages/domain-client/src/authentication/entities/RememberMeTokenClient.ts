/**
 * RememberMeToken Entity - Client Implementation
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';
import { DeviceInfoClient } from '../value-objects/DeviceInfoClient';

type RememberMeTokenStatus = AuthC.RememberMeTokenStatus;
const RememberMeTokenStatus = AuthC.RememberMeTokenStatus;

export class RememberMeTokenClient extends Entity implements AuthC.RememberMeTokenClient {
  constructor(
    uuid: string,
    public readonly credentialUuid: string,
    public readonly accountUuid: string,
    public readonly tokenSeries: string,
    public readonly device: DeviceInfoClient,
    public readonly status: RememberMeTokenStatus,
    public readonly usageCount: number,
    public readonly lastUsedAt: number | null | undefined,
    public readonly lastUsedIp: string | null | undefined,
    public readonly expiresAt: number,
    public readonly createdAt: number,
    public readonly updatedAt: number,
    public readonly revokedAt: number | null | undefined,
  ) {
    super(uuid);
  }

  get statusText(): string {
    const map = {
      [RememberMeTokenStatus.ACTIVE]: '活跃',
      [RememberMeTokenStatus.USED]: '已使用',
      [RememberMeTokenStatus.REVOKED]: '已撤销',
      [RememberMeTokenStatus.EXPIRED]: '已过期',
    };
    return map[this.status];
  }

  get isActive(): boolean {
    return this.status === RememberMeTokenStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return this.status === RememberMeTokenStatus.EXPIRED || Date.now() > this.expiresAt;
  }

  toClientDTO(): AuthC.RememberMeTokenClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      accountUuid: this.accountUuid,
      tokenSeries: this.tokenSeries,
      device: this.device,
      status: this.status,
      usageCount: this.usageCount,
      lastUsedAt: this.lastUsedAt ?? null,
      lastUsedIp: this.lastUsedIp ?? null,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      revokedAt: this.revokedAt ?? null,
    };
  }

  static fromClientDTO(dto: AuthC.RememberMeTokenClientDTO): RememberMeTokenClient {
    return new RememberMeTokenClient(
      dto.uuid,
      dto.credentialUuid,
      dto.accountUuid,
      dto.tokenSeries,
      DeviceInfoClient.fromClientDTO(dto.device as AuthC.DeviceInfoClientDTO),
      dto.status as RememberMeTokenStatus,
      dto.usageCount,
      dto.lastUsedAt,
      dto.lastUsedIp,
      dto.expiresAt,
      dto.createdAt,
      dto.updatedAt,
      dto.revokedAt,
    );
  }
}
