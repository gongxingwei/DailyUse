import { UserCore } from '@dailyuse/domain-core';
import { type IUser } from '../types';
export class User extends UserCore implements IUser {
  isClient(): boolean {
    return false;
  }
  isServer(): boolean {
    return true;
  }
}
