/**
 * Account 模块类型定义
 *
 * 定义账户管理相关的接口、枚举和类型
 * 包括账户实体、用户实体、权限管理等
 */

import { AccountStatus, AccountType, SessionStatus } from './enums';

// ========== 核心接口 ==========

/**
 * 账户核心接口
 */
export interface IAccountCore {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * 完整账户接口
 */
export interface IAccount extends IAccountCore {
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  user: IUser;
  roles?: IRole[];
}

/**
 * 用户核心接口
 */
export interface IUserCore {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: ISexCore;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  addresses?: IAddressCore[];
}

/**
 * 完整用户接口
 */
export interface IUser extends IUserCore {
  account: IAccountCore;
  permissions?: IPermission[];
}

/**
 * 角色核心接口
 */
export interface IRoleCore {
  uuid: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 完整角色接口
 */
export interface IRole extends IRoleCore {
  permissions: IPermission[];
  accounts: IAccountCore[];
}

/**
 * 权限核心接口
 */
export interface IPermissionCore {
  uuid: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: any;
}

/**
 * 完整权限接口
 */
export interface IPermission extends IPermissionCore {
  roles: IRoleCore[];
  users: IUserCore[];
}

/**
 * 性别核心接口
 */
export interface ISexCore {
  value: number; // 核心值：性别
  updatedAt?: Date;
}

/**
 * 地址核心接口
 */
export interface IAddressCore {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
}

/**
 * 完整地址接口
 */
export interface IAddress extends IAddressCore {
  user: IUserCore;
}

/**
 * 邮箱核心接口
 */
export interface IEmailCore {
  value: string;
  isVerified: boolean;
  verificationToken?: string;
  verifiedAt?: Date;
}

/**
 * 完整邮箱接口
 */
export interface IEmail extends IEmailCore {
  user: IUserCore;
}

/**
 * 电话核心接口
 */
export interface IPhoneNumberCore {
  value: string;
  number: string;
  countryCode: string;
  isVerified: boolean;
  verificationCode?: string;
  verifiedAt?: Date;
}

/**
 * 完整电话接口
 */
export interface IPhoneNumber extends IPhoneNumberCore {
  user: IUserCore;
}

// ========== 客户端/服务端实体标记接口 ==========

/**
 * 客户端实体标记接口
 */
export interface IClientEntity {
  readonly isClientEntity: true;
}

/**
 * 服务端实体标记接口
 */
export interface IServerEntity {
  readonly isServerEntity: true;
}

// ========== 服务端接口 ==========

/**
 * 账号核心接口
 */
export interface IAccountServer extends IAccountCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IUserServer extends IUserCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IPermissionServer extends IPermissionCore {
  isServer(): boolean;
  isClient(): boolean;
}
export interface IRoleServer extends IRoleCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface ISexServer extends ISexCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface IAddressServer extends IAddressCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface IEmailServer extends IEmailCore {
  isServer(): boolean;
  isClient(): boolean;
}

export interface IPhoneNumberServer extends IPhoneNumberCore {
  isServer(): boolean;
  isClient(): boolean;
}
