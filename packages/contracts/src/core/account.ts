import type { ClientInfo, UserAgreement } from './shared';
/**
 * 账户领域的核心接口定义
 * 包含账户、用户、权限、角色等核心概念的抽象定义
 */

// =================== 基础枚举类型 ===================

/**
 * 账号状态枚举
 */
export enum AccountStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已禁用 */
  DISABLED = 'disabled',
  /** 已暂停 */
  SUSPENDED = 'suspended',
  /** 等待验证 */
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * 账号类型枚举
 */
export enum AccountType {
  /** 本地账号 */
  LOCAL = 'local',
  /** 在线账号 */
  ONLINE = 'online',
  /** 游客账号 */
  GUEST = 'guest',
}

// =================== 核心领域接口 ===================

/**
 * 账号核心接口
 * 定义账号实体必须实现的基本结构
 */
export interface IAccountCore {
  readonly uuid: string;
  readonly username: string;
  readonly email?: IEmailCore;
  readonly phoneNumber?: IPhoneNumberCore;
  readonly address?: IAddressCore; // 没使用
  readonly status: AccountStatus; // 账号状态（'active', 'disabled', 'suspended', 'pending_verification'）
  readonly accountType: AccountType;
  readonly user: IUserCore;
  readonly roleIds: Set<string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
  readonly emailVerificationToken?: string;
  readonly phoneVerificationCode?: string;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
}

/**
 * 用户核心接口
 */
export interface IUserCore {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex: ISexCore;
  avatar?: string;
  bio?: string;
  socialAccounts: { [key: string]: string };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 权限核心接口
 */
export interface IPermissionCore {
  uuid: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

/**
 * 角色核心接口
 */
export interface IRoleCore {
  uuid: string;
  name: string;
  description?: string;
  permissions: Set<string>; // 权限代码数组
}

/**
 * 地址值对象接口
 */
export interface IAddressCore {
  value: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * 邮箱值对象接口
 */
export interface IEmailCore {
  value: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

/**
 * 手机号值对象接口
 */
export interface IPhoneNumberCore {
  value: string;
  number: string;
  countryCode: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

/**
 * 性别值对象接口
 */
export interface ISexCore {
  value: number;
  updatedAt?: Date;
}

// =================== 环境特定接口 ===================

/**
 * 服务端特定接口
 */
export interface IServerEntity {
  isServer(): boolean;
  isClient(): boolean;
}

/**
 * 客户端特定接口
 */
export interface IClientEntity {
  isServer(): boolean;
  isClient(): boolean;
}

/**
 * 账号服务端接口
 */
export interface IAccount extends IAccountCore, IServerEntity {}

/**
 * 用户服务端接口
 */
export interface IUser extends IUserCore, IServerEntity {}

/**
 * 权限服务端接口
 */
export interface IPermission extends IPermissionCore, IServerEntity {}

/**
 * 角色服务端接口
 */
export interface IRole extends IRoleCore, IServerEntity {}

/**
 * 地址服务端接口
 */
export interface IAddress extends IAddressCore, IServerEntity {}

/**
 * 邮箱服务端接口
 */
export interface IEmail extends IEmailCore, IServerEntity {}

/**
 * 手机号服务端接口
 */
export interface IPhoneNumber extends IPhoneNumberCore, IServerEntity {}

/**
 * 性别服务端接口
 */
export interface ISex extends ISexCore, IServerEntity {}

// =================== 数据传输对象 (DTOs) ===================

/**
 * 账户DTO - 用于数据传输和持久化
 */
export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified?: boolean;
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified?: boolean;
  roleIds?: string[];
  user: UserDTO;
}

/**
 * 用户DTO - 用于数据传输和持久化
 */
export interface UserDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  sex: number;
  avatar?: string;
  bio?: string;
  socialAccounts: { [key: string]: string };
  createdAt: number;
  updatedAt: number;
}

/**
 * 权限DTO
 */
export interface PermissionDTO {
  uuid: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

// =================== 请求和响应类型 ===================

/**
 * 注册表单 - 用户名和密码
 */
export interface RegistrationByUsernameAndPasswordForm {
  username: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

export interface RegistrationByUsernameAndPasswordRequestDTO {
  username: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  agreement: UserAgreement; // 详细的同意信息
  clientInfo?: ClientInfo;
}

/**
 * 注册响应DTO
 */
export type RegistrationResponseDTO = {
  account: AccountDTO;
  requiresVerification?: boolean;
};

/**
 * 账号注册请求(暂时没用)
 */
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

/**
 * 账号更新数据
 */
export interface AccountUpdateData {
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

/**
 * 账号注销请求
 */
export interface AccountDeactivationRequest {
  reason: string;
  confirmDeletion: boolean;
  feedback?: string;
}

// =================== 数据库 DTO (Persistence DTOs) ===================

/**
 * 账户数据库 DTO - 直接对应数据库表结构
 */
export interface AccountPersistenceDTO {
  uuid: string;
  username: string;
  email?: string;
  phone?: string;
  accountType: string;
  status: string;
  roleIds?: string; // JSON string
  lastLoginAt?: Date;
  emailVerificationToken?: string;
  phoneVerificationCode?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 关联的用户资料
  userProfile?: UserProfilePersistenceDTO;
}

/**
 * 用户资料数据库 DTO - 直接对应 UserProfile 表结构
 */
export interface UserProfilePersistenceDTO {
  uuid: string;
  accountUuid: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  sex: number;
  avatarUrl?: string;
  bio?: string;
  socialAccounts?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 认证凭证数据库 DTO - 直接对应 AuthCredential 表结构
 */
export interface AuthCredentialPersistenceDTO {
  uuid: string;
  accountUuid: string;
  passwordHash: string;
  passwordSalt: string;
  passwordAlgorithm: string;
  passwordCreatedAt: Date;
  passwordExpiresAt?: Date;
  isLocked: boolean;
  lockReason?: string;
  failedAttempts: number;
  lastFailedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 关联的会话、令牌等
  sessions?: UserSessionPersistenceDTO[];
  tokens?: AuthTokenPersistenceDTO[];
  mfaDevices?: MFADevicePersistenceDTO[];
}

/**
 * 用户会话数据库 DTO
 */
export interface UserSessionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
  expiresAt?: Date;
}

/**
 * 认证令牌数据库 DTO
 */
export interface AuthTokenPersistenceDTO {
  uuid: string;
  accountUuid: string;
  tokenValue: string;
  tokenType: string;
  issuedAt: Date;
  expiresAt?: Date;
  isRevoked: boolean;
  revokeReason?: string;
  metadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MFA 设备数据库 DTO
 */
export interface MFADevicePersistenceDTO {
  uuid: string;
  accountUuid: string;
  type: string;
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  backupCodes?: string; // JSON string
  isVerified: boolean;
  isEnabled: boolean;
  verificationAttempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastUsedAt?: Date;
}
