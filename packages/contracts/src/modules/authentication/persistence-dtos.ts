/**
 * Authentication 模块持久化 DTO 定义
 */

import { AuthMethod, MFADeviceType, TokenType } from './enums';

/**
 * 认证凭据持久化 DTO
 */
export interface AuthCredentialPersistenceDTO {
  uuid: string;
  accountUuid: string;
  passwordHash: string; // 加密存储
  passwordSalt: string; // 加密存储
  passwordAlgorithm?: string; // 加密存储
  passwordCreatedAt?: Date; // timestamp
  passwordUpdatedAt?: Date; // timestamp
  passwordExpiresAt?: Date | null; // timestamp
  isLocked: boolean;
  lockReason?: string | null;
  lockUntil?: Date | null; // timestamp
  failedAttempts: number;
  lastFailedAt?: Date | null; // timestamp
  createdAt: Date; // timestamp
  updatedAt: Date; // timestamp
  lastUsedAt?: Date | null; // timestamp
  expiresAt?: Date | null; // timestamp
  sessions?: UserSessionPersistenceDTO[];
  mfaDevices?: MFADevicePersistenceDTO[];
  tokens?: AuthTokenPersistenceDTO[];
}

/**
 * 用户会话持久化 DTO
 */
export interface UserSessionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  sessionId: string;
  accessToken: string;
  refreshToken?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date | null;
}

/**
 * MFA 设备持久化 DTO
 */
export interface MFADevicePersistenceDTO {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secretKey?: string | null;
  phoneNumber?: string | null;
  emailAddress?: string | null;
  isVerified: number; // 0 or 1
  isEnabled: number; // 0 or 1
  createdAt: number; // timestamp
  lastUsedAt?: number; // timestamp
  verificationAttempts: number;
  maxAttempts: number;
}

/**
 * 认证令牌持久化 DTO
 */
export interface AuthTokenPersistenceDTO {
  uuid: string;
  accountUuid: string;
  tokenValue: string;
  tokenType: string;
  issuedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  revokeReason?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
