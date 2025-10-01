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
  method: AuthMethod | string;
  identifier: string;
  credentials: string; // 加密存储
  isVerified: number; // 0 or 1
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastUsedAt?: number; // timestamp
  expiresAt?: number; // timestamp
}

/**
 * 用户会话持久化 DTO
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
 * MFA 设备持久化 DTO
 */
export interface MFADevicePersistenceDTO {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  isVerified: number; // 0 or 1
  isEnabled: number; // 0 or 1
  createdAt: number; // timestamp
  lastUsedAt?: number; // timestamp
  verificationAttempts: number;
  maxAttempts: number;
}

/**
 * Token 持久化 DTO
 */
export interface TokenPersistenceDTO {
  uuid: string;
  accountUuid: string;
  value: string;
  type: TokenType;
  deviceInfo?: string;
  issuedAt: number; // timestamp
  expiresAt: number; // timestamp
  isRevoked: number; // 0 or 1
}
