import { PermissionCore } from '@dailyuse/domain-core';

import { AccountContracts } from '@dailyuse/contracts';

type PermissionDTO = AccountContracts.PermissionDTO;
type IPermission = AccountContracts.IPermission;

export class Permission extends PermissionCore implements IPermission {
  roles: AccountContracts.IRoleCore[] = [];
  users: AccountContracts.IUserCore[] = [];
  isServer(): boolean {
    return true;
  }
  isClient(): boolean {
    return false;
  }

  toDTO(): PermissionDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
    };
  }
}
