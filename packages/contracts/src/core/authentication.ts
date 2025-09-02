/**
 * 认证领域的核心接口定义
 * 包含认证凭据、密码、会话、令牌等核心概念的抽象定义
 */

// =================== 认证核心枚举 ===================

/**
 * 令牌类型枚举
 */
export enum TokenType {
  /** 访问令牌 */
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  /** 刷新令牌 */
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  /** 记住我令牌 */
  REMEMBER_ME = 'REMEMBER_ME',
  /** 邮箱验证令牌 */
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  /** 密码重置令牌 */
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * 多因子认证设备类型枚举
 */
export enum MFADeviceType {
  /** TOTP应用 */
  TOTP = 'TOTP',
  /** 短信验证 */
  SMS = 'SMS',
  /** 邮箱验证 */
  EMAIL = 'EMAIL',
  /** 硬件密钥 */
  HARDWARE_KEY = 'HARDWARE_KEY',
  /** 备用验证码 */
  BACKUP_CODES = 'BACKUP_CODES',
}

/**
 * 会话状态枚举
 */
export enum SessionStatus {
  /** 活跃 */
  ACTIVE = 'ACTIVE',
  /** 过期 */
  EXPIRED = 'EXPIRED',
  /** 终止 */
  TERMINATED = 'TERMINATED',
}

// =================== 认证核心接口 ===================

/**
 * 认证凭据核心接口
 */
export interface IAuthCredentialCore {
  readonly uuid: string;
  readonly accountUuid: string;
  readonly password: IPasswordCore;
  readonly sessions: Map<string, ISessionCore>;
  readonly mfaDevices: Map<string, IMFADeviceCore>;
  readonly tokens: Map<string, ITokenCore>;
  readonly failedAttempts: number;
  readonly maxAttempts: number;
  readonly lockedUntil?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastAuthAt?: Date;

  // 计算属性
  readonly isLocked: boolean;
  readonly lockTimeRemaining: number;
  readonly canAttemptLogin: boolean;
}

/**
 * 密码值对象核心接口
 */
export interface IPasswordCore {
  readonly hashedValue: string;
  readonly salt: string;
  readonly algorithm: string;
  readonly createdAt: Date;
  readonly expiresAt?: Date;

  // 验证方法
  verify(plainPassword: string): boolean;
}

/**
 * 会话实体核心接口
 */
export interface ISessionCore {
  readonly uuid: string;
  readonly accountUuid: string;
  readonly deviceInfo: string;
  readonly ipAddress: string;
  readonly userAgent?: string;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly expiresAt: Date;
  readonly isActive: boolean;

  // 计算属性和方法
  refresh(extendMinutes?: number): void;
  terminate(reason?: string): void;
  isExpired(): boolean;
  isNearExpiry(thresholdMinutes?: number): boolean;
  getRemainingMinutes(): number;
}

/**
 * 令牌值对象核心接口
 */
export interface ITokenCore {
  readonly value: string;
  readonly type: TokenType;
  readonly accountUuid: string;
  readonly deviceInfo?: string;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly isRevoked: boolean;

  // 方法
  isValid(): boolean;
  isExpired(): boolean;
  revoke(): void;
  getRemainingTime(): number;
}

/**
 * 多因子认证设备实体核心接口
 */
export interface IMFADeviceCore {
  readonly uuid: string;
  readonly accountUuid: string;
  readonly type: MFADeviceType;
  readonly name: string;
  readonly secretKey?: string; // TOTP密钥
  readonly phoneNumber?: string; // SMS设备
  readonly emailAddress?: string; // 邮箱设备
  readonly isVerified: boolean;
  readonly isEnabled: boolean;
  readonly createdAt: Date;
  readonly lastUsedAt?: Date;
  readonly verificationAttempts: number;
  readonly maxAttempts: number;
  readonly isLocked: boolean;

  // 验证方法
  verify(code: string): boolean;
}

// =================== 认证数据传输对象 ===================

/**
 * 认证凭据DTO
 */
export interface AuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  passwordHash: string;
  salt: string;
  algorithm: string;
  iterations: number;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: number;
  createdAt: number;
  updatedAt: number;
  lastAuthAt?: number;
}

/**
 * 会话DTO
 */
export interface SessionDTO {
  uuid: string;
  accountUuid: string;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  isActive: boolean;
  terminatedAt?: number;
  terminationReason?: string;
}

/**
 * 令牌DTO
 */
export interface TokenDTO {
  value: string;
  type: TokenType;
  accountUuid: string;
  deviceInfo?: string;
  issuedAt: number;
  expiresAt: number;
  isRevoked: boolean;
}

/**
 * MFA设备DTO
 */
export interface MFADeviceDTO {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secret?: string;
  phoneNumber?: string;
  email?: string;
  isVerified: boolean;
  isEnabled: boolean;
  createdAt: number;
  lastUsedAt?: number;
  verificationAttempts: number;
  maxAttempts: number;
}

// =================== 认证请求类型 ===================

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
  };
  mfaCode?: string;
}

/**
 * 密码更改请求
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
  type: MFADeviceType;
  name: string;
  phoneNumber?: string;
  email?: string;
  totpCode?: string; // 用于验证TOTP设备
}
