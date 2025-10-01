/**
 * Account 模块数据传输对象 (DTO)
 *
 * 定义账户管理相关的DTO类型，用于API数据传输
 */

import { AccountStatus, AccountType, SessionStatus } from './enums';

// ========== 账户相关 DTO ==========

/**
 * 账户数据传输对象
 */
export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastLoginAt?: number; // timestamp
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phoneNumber?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  user: UserDTO;
  roles?: RoleDTO[];
}

/**
 * 用户数据传输对象
 */
export interface UserDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  addresses?: AddressDTO[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * 用户信息DTO（包含账户信息）
 */
export interface UserInfoDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  account: {
    uuid: string;
    username: string;
    email?: string;
    phone?: string;
    accountType: AccountType;
    status: AccountStatus;
  };
}

/**
 * 角色数据传输对象
 */
export interface RoleDTO {
  uuid: string;
  name: string;
  isSystem?: boolean;
  permissions?: PermissionDTO[];
}

/**
 * 权限数据传输对象
 */
export interface PermissionDTO {
  uuid: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  conditions?: any;
}

/**
 * 会话数据传输对象
 */
export interface SessionDTO {
  uuid: string;
  accountUuid: string;
  status: SessionStatus;
  createdAt: string; // ISO string
  lastAccessAt: string; // ISO string
  expiresAt?: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * 地址数据传输对象
 */
export interface AddressDTO {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
}

/**
 * 邮箱数据传输对象
 */
export interface EmailDTO {
  uuid: string;
  userUuid: string;
  email: string;
  isVerified: boolean;
  isPrimary: boolean;
  verifiedAt?: string; // ISO string
  createdAt: string; // ISO string
}

/**
 * 电话数据传输对象
 */
export interface PhoneNumberDTO {
  uuid: string;
  userUuid: string;
  phoneNumber: string;
  countryCode: string;
  isVerified: boolean;
  isPrimary: boolean;
  verifiedAt?: string; // ISO string
  createdAt: string; // ISO string
}

// ========== 请求/响应 DTO ==========

/**
 * 账户注册请求
 */
export interface AccountRegistrationRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  accountType?: AccountType;
}

/**
 * 账户更新数据
 */
export interface AccountUpdateData {
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
}

/**
 * 账户注销请求
 */
export interface AccountDeactivationRequest {
  reason: string;
  confirmDeletion: boolean;
  feedback?: string;
}

/**
 * 密码修改请求
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountCreationResponse {
  account: AccountDTO;
  initialSession?: SessionDTO;
}

/**
 * 账户列表响应
 */
export interface AccountListResponse {
  accounts: AccountDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 用户信息响应
 */
export interface UserInfoResponse {
  user: UserInfoDTO;
}

/**
 * 权限验证响应
 */
export interface PermissionCheckResponse {
  hasPermission: boolean;
  permissions: string[];
  roles: string[];
}
