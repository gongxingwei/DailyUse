/**
 * PasswordCredential Entity - Client Implementation
 * 密码凭证实体 - 客户端实现
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

type PasswordAlgorithm = AuthC.PasswordAlgorithm;
const PasswordAlgorithm = AuthC.PasswordAlgorithm;

export class PasswordCredentialClient extends Entity implements AuthC.PasswordCredentialClient {
  constructor(
    uuid: string,
    public readonly credentialUuid: string,
    public readonly algorithm: PasswordAlgorithm,
    public readonly createdAt: number,
    public readonly updatedAt: number,
  ) {
    super(uuid);
  }

  get algorithmText(): string {
    const map = {
      [PasswordAlgorithm.BCRYPT]: 'BCrypt',
      [PasswordAlgorithm.ARGON2]: 'Argon2',
      [PasswordAlgorithm.SCRYPT]: 'SCrypt',
    };
    return map[this.algorithm];
  }

  toClientDTO(): AuthC.PasswordCredentialClientDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      algorithm: this.algorithm,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromClientDTO(dto: AuthC.PasswordCredentialClientDTO): PasswordCredentialClient {
    return new PasswordCredentialClient(
      dto.uuid,
      dto.credentialUuid,
      dto.algorithm as PasswordAlgorithm,
      dto.createdAt,
      dto.updatedAt,
    );
  }
}
