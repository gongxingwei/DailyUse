import { PermissionCore } from '@dailyuse/domain-core';
import { type IPermission } from '../types';

export class Permission extends PermissionCore implements IPermission {
  isServer(): boolean {
    return true;
  }
  isClient(): boolean {
    return false;
  }
}
