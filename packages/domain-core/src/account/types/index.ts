/**
 * 账号状态枚举
 */
export enum AccountStatus {
  /** 等待验证 */
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  /** 活跃状态 */
  ACTIVE = 'ACTIVE',
  /** 已禁用 */
  DISABLED = 'DISABLED',
  /** 已暂停 */
  SUSPENDED = 'SUSPENDED',
}

/**
 * 账号类型枚举
 */
export enum AccountType {
  /** 本地账号 */
  LOCAL = 'LOCAL',
  /** 管理员账号 */
  ADMIN = 'ADMIN',
  /** 游客账号 */
  GUEST = 'GUEST',
}

/**
 * 账号核心接口
 */
export interface IAccountCore {
  readonly uuid: string;
  readonly username: string;
  readonly email?: any;
  readonly phoneNumber?: any;
  readonly address?: any;
  readonly status: AccountStatus;
  readonly accountType: AccountType;
  readonly user: any;
  readonly roleIds: Set<string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
  readonly emailVerificationToken?: string;
  readonly phoneVerificationCode?: string;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
}

export interface IUserCore {
  uuid: string;
  firstName: string;
  lastName: string;
  sex: ISexCore;
  avatar?: string;
  bio?: string;
  socialAccounts: { [key: string]: string };
}

export interface IPermissionCore {
  uuid: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

export interface IRoleCore {
  uuid: string;
  name: string;
  description?: string;
  permissions: Set<string>; // 权限代码数组
}

/**
 * Permission 实体
 * 权限实体
 */
export interface PermissionDTO {
  uuid: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

export interface IAddressCore {
  value: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IEmailCore {
  value: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface IPhoneNumberCore {
  value: string;
  number: string;
  countryCode: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface ISexCore {
  value: number;
  updatedAt?: Date;
}

// 注册数据类型（包含密码，密码在 Authentication 模块处理）
export interface AccountRegistrationRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  // User 实体相关字段
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  // Account 相关字段
  accountType?: AccountType;
}

// 账号更新数据类型
export interface AccountUpdateData {
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

// 账号注销请求类型
export interface AccountDeactivationRequest {
  reason: string;
  confirmDeletion: boolean;
  feedback?: string;
}

export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  roleIds?: Set<string>;
  user: UserDTO;
}

export interface IAccountDTO {
  uuid: string;
  username: string;
  status: string;
  accountType: string;
  email: string;
  phone: string;
  user: UserDTO; // 关联的 User 实体
  roleIds?: string[];
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface UserDTO {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  sex: string | null;
  avatar: string | null;
  bio: string | null;
  socialAccounts: { [key: string]: string };
}
