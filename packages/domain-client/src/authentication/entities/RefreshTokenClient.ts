/**
 * RefreshToken Entity - Client Implementation
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

export class RefreshTokenClient extends Entity implements AuthC.RefreshTokenClient {
  constructor(
    uuid: string,
    public readonly sessionUuid: string,
    public readonly token: string,
    public readonly expiresAt: number,
    public readonly createdAt: number,
    public readonly usedAt: number | null | undefined,
  ) {
    super(uuid);
  }

  get isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }

  get isUsed(): boolean {
    return this.usedAt !== null && this.usedAt !== undefined;
  }

  toClientDTO(): AuthC.RefreshTokenClientDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: this.usedAt ?? null,
    };
  }

  static fromClientDTO(dto: AuthC.RefreshTokenClientDTO): RefreshTokenClient {
    return new RefreshTokenClient(
      dto.uuid,
      dto.sessionUuid,
      dto.token,
      dto.expiresAt,
      dto.createdAt,
      dto.usedAt,
    );
  }
}
