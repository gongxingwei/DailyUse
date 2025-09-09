/**
 * Account 模块数据传输对象 (DTO)
 *
 * 定义账户管理相关的DTO类型，用于API数据传输
 */

import {
  AccountStatus,
  AccountType,
  AuthMethod,
  MFADeviceType,
  TokenType,
  SessionStatus,
} from './types';

// ========== 账户相关 DTO ==========

/**
 * 账户数据传输对象
 */
export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  lastLoginAt?: string; // ISO string
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  user: UserDTO;
  roles?: RoleDTO[];
}

/**
 * 账户持久化DTO（数据库）
 */
export interface AccountPersistenceDTO {
  uuid: string;
  username: string;
  status: string;
  accountType: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastLoginAt?: number; // timestamp
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: number; // 0 or 1
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: number; // 0 or 1
  userUuid: string;
}

/**
 * 用户数据传输对象
 */
export interface UserDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  addresses?: AddressDTO[];
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
 * 用户会话持久化DTO
 */
export interface UserSessionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  status: string;
  createdAt: number; // timestamp
  lastAccessAt: number; // timestamp
  expiresAt?: number; // timestamp
  ipAddress?: string;
  userAgent?: string;
  metadata?: string; // JSON string
}

/**
 * 用户资料持久化DTO
 */
export interface UserProfilePersistenceDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  socialAccounts?: string; // JSON string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * 角色数据传输对象
 */
export interface RoleDTO {
  uuid: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  permissions?: PermissionDTO[];
}

/**
 * 权限数据传输对象
 */
export interface PermissionDTO {
  uuid: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: any;
}

/**
 * 认证凭据数据传输对象
 */
export interface AuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  method: AuthMethod;
  identifier: string;
  isVerified: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  lastUsedAt?: string; // ISO string
  expiresAt?: string; // ISO string
}

/**
 * 认证凭据持久化DTO
 */
export interface AuthCredentialPersistenceDTO {
  uuid: string;
  accountUuid: string;
  method: string;
  identifier: string;
  credentials: string; // 加密存储
  isVerified: number; // 0 or 1
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastUsedAt?: number; // timestamp
  expiresAt?: number; // timestamp
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
 * Token数据传输对象
 */
export interface TokenDTO {
  uuid: string;
  accountUuid: string;
  type: TokenType;
  token: string;
  expiresAt?: string; // ISO string
  isRevoked: boolean;
  createdAt: string; // ISO string
  revokedAt?: string; // ISO string
  metadata?: any;
}

/**
 * Token持久化DTO
 */
export interface AuthTokenPersistenceDTO {
  uuid: string;
  accountUuid: string;
  type: string;
  token: string;
  expiresAt?: number; // timestamp
  isRevoked: number; // 0 or 1
  createdAt: number; // timestamp
  revokedAt?: number; // timestamp
  metadata?: string; // JSON string
}

/**
 * MFA设备数据传输对象
 */
export interface MFADeviceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: MFADeviceType;
  identifier: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO string
  verifiedAt?: string; // ISO string
  lastUsedAt?: string; // ISO string
}

/**
 * MFA设备持久化DTO
 */
export interface MFADevicePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: string;
  identifier: string;
  secret?: string; // 加密存储
  isVerified: number; // 0 or 1
  isActive: number; // 0 or 1
  createdAt: number; // timestamp
  verifiedAt?: number; // timestamp
  lastUsedAt?: number; // timestamp
}

/**
 * 地址数据传输对象
 */
export interface AddressDTO {
  uuid: string;
  userUuid: string;
  type: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  isDefault: boolean;
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

/**
 * MFA设备注册请求
 */
export interface MFADeviceRegistrationRequest {
  name: string;
  type: MFADeviceType;
  identifier: string;
  verificationCode?: string;
}

// ========== 响应 DTO ==========

/**
 * 账户创建响应
 */
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
