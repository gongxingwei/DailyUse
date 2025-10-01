/**
 * Authentication 模块类型定义
 *
 * 定义认证授权相关的接口、枚举和类型
 */

import { TokenType, MFADeviceType } from './enums';


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


