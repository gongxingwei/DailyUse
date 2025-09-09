/**
 * Account 模块类型定义
 *
 * 定义账户管理相关的接口、枚举和类型
 * 包括账户实体、用户实体、权限管理等
 */

// ========== 枚举类型 ==========

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
  /** 待验证状态 */
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * 账号类型枚举
 */
export enum AccountType {
  /** 本地账户 */
  LOCAL = 'local',
  /** 在线账户 */
  ONLINE = 'online',
  /** 访客账户 */
  GUEST = 'guest',
}

/**
 * 认证方法枚举
 */
export enum AuthMethod {
  /** 密码认证 */
  PASSWORD = 'password',
  /** Token认证 */
  TOKEN = 'token',
  /** 双因素认证 */
  MFA = 'mfa',
}

/**
 * MFA设备类型枚举
 */
export enum MFADeviceType {
  /** 手机短信 */
  SMS = 'sms',
  /** 邮箱验证 */
  EMAIL = 'email',
  /** 身份验证应用 */
  AUTHENTICATOR = 'authenticator',
  /** 硬件令牌 */
  HARDWARE_TOKEN = 'hardware_token',
}

/**
 * Token类型枚举
 */
export enum TokenType {
  /** 访问令牌 */
  ACCESS = 'access',
  /** 刷新令牌 */
  REFRESH = 'refresh',
  /** 记住我令牌 */
  REMEMBER_ME = 'remember_me',
  /** 验证令牌 */
  VERIFICATION = 'verification',
  /** 重置密码令牌 */
  PASSWORD_RESET = 'password_reset',
}

/**
 * 会话状态枚举
 */
export enum SessionStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已撤销 */
  REVOKED = 'revoked',
}

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
  authCredentials?: IAuthCredentialCore[];
  sessions?: ISessionCore[];
  mfaDevices?: IMFADeviceCore[];
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
 * 认证凭据核心接口
 */
export interface IAuthCredentialCore {
  uuid: string;
  accountUuid: string;
  method: AuthMethod;
  identifier: string; // 用户名、邮箱等
  credentials: string; // 密码哈希、公钥等
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

/**
 * 会话核心接口
 */
export interface ISessionCore {
  uuid: string;
  accountUuid: string;
  status: SessionStatus;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * Token核心接口
 */
export interface ITokenCore {
  uuid: string;
  accountUuid: string;
  type: TokenType;
  token: string;
  expiresAt?: Date;
  isRevoked: boolean;
  createdAt: Date;
  revokedAt?: Date;
  metadata?: any;
}

/**
 * MFA设备核心接口
 */
export interface IMFADeviceCore {
  uuid: string;
  accountUuid: string;
  name: string;
  type: MFADeviceType;
  identifier: string; // 手机号、邮箱等
  secret?: string; // 加密存储的密钥
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  verifiedAt?: Date;
  lastUsedAt?: Date;
}

/**
 * 密码核心接口
 */
export interface IPasswordCore {
  uuid: string;
  accountUuid: string;
  hash: string;
  salt: string;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
}

/**
 * 性别核心接口
 */
export interface ISexCore {
  uuid: string;
  name: string;
  code: string;
  isActive: boolean;
}

/**
 * 完整性别接口
 */
export interface ISex extends ISexCore {
  users: IUserCore[];
}

/**
 * 地址核心接口
 */
export interface IAddressCore {
  uuid: string;
  userUuid: string;
  type: string; // home, work, billing等
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  isDefault: boolean;
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
  uuid: string;
  userUuid: string;
  email: string;
  isVerified: boolean;
  isPrimary: boolean;
  verificationToken?: string;
  verifiedAt?: Date;
  createdAt: Date;
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
  uuid: string;
  userUuid: string;
  phoneNumber: string;
  countryCode: string;
  isVerified: boolean;
  isPrimary: boolean;
  verificationCode?: string;
  verifiedAt?: Date;
  createdAt: Date;
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
