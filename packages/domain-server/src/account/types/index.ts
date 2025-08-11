import type {
  IAccountCore,
  IUserCore,
  IPermissionCore,
  IRoleCore,
  IAddressCore,
  IEmailCore,
  IPhoneNumberCore,
  ISexCore,
} from '@dailyuse/domain-core';

/**
 * 账号核心接口
 */
export interface IAccount extends IAccountCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IUser extends IUserCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IPermission extends IPermissionCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IRole extends IRoleCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface ISex extends ISexCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface IAddress extends IAddressCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface IEmail extends IEmailCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IPhoneNumber extends IPhoneNumberCore {
  isServer(): boolean;
  isClient(): boolean;
}
