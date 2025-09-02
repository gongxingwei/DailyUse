import type { ClientInfo } from '../../shared/types';
// ======== MFA Device Types ========
export enum MFADeviceType {
  TOTP = 'totp', // Time-based One-Time Password (Google Authenticator等)
  SMS = 'sms', // 短信验证码
  EMAIL = 'email', // 邮箱验证码
  HARDWARE_KEY = 'hardware_key', // 硬件密钥（如YubiKey）
  BACKUP_CODES = 'backup_codes', // 备用验证码
}

export interface IMFADeviceCore {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  isVerified: boolean;
  isEnabled: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  verificationAttempts: number;
  maxAttempts: number;

  // Core methods
  verify(code: string): boolean;
  enable(): void;
  disable(): void;
  resetAttempts(): void;
  isLocked: boolean;
}

export interface IMFADeviceDTO {
  uuid: string;
  accountUuid: string;
  type: string;
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  backupCodes?: string[];
  isVerified: number;
  isEnabled: number;
  createdAt: number;
  lastUsedAt?: number;
  verificationAttempts: number;
  maxAttempts: number;
}

// ======== Session Types ========
export interface ISessionCore {
  uuid: string;
  accountUuid: string;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
  terminatedAt?: Date;
  terminationReason?: string;

  // Core methods
  isExpired(): boolean;
  refresh(extendMinutes?: number): void;
  terminate(reason?: string): void;
  forceTerminate(reason: string): void;
  isNearExpiry(thresholdMinutes?: number): boolean;
  getRemainingMinutes(): number;
  checkIPChange(currentIP: string): boolean;
}

export interface ISessionDTO {
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

// ======== Token Types ========
export enum TokenType {
  REMEMBER_ME = 'remember_me',
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export interface ITokenCore {
  value: string;
  type: TokenType;
  accountUuid: string;
  issuedAt: Date;
  expiresAt: Date;
  deviceInfo?: string;
  isRevoked: boolean;

  // Core methods
  isValid(): boolean;
  isExpired(): boolean;
  revoke(): void;
  isNearExpiry(): boolean;
  getRemainingTime(): number;
}

export interface ITokenDTO {
  value: string;
  type: TokenType;
  accountUuid: string;
  issuedAt: string;
  expiresAt: string;
  deviceInfo?: string;
  isRevoked: boolean;
}

// ======== Password Types ========
export interface IPasswordCore {
  hashedValue: string;
  salt: string;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;

  // Core methods
  verify(password: string): boolean;
}

export interface IPasswordDTO {
  hashedValue: string;
  salt: string;
  algorithm: string;
  createdAt: string;
  expiresAt?: string;
}

// ======== AuthCredential Types ========
export interface IAuthCredentialCore {
  uuid: string;
  accountUuid: string;
  password: IPasswordCore;
  sessions: Map<string, ISessionCore>;
  mfaDevices: Map<string, IMFADeviceCore>;
  tokens: Map<string, ITokenCore>;
  createdAt: Date;
  updatedAt: Date;
  lastAuthAt?: Date;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: Date;

  // Core computed properties
  isLocked: boolean;
  lockTimeRemaining: number;
  canAttemptLogin: boolean;

  // Core methods
  // authenticate(password: string): boolean;
  // changePassword(oldPassword: string, newPassword: string): void;
  // createSession(ClientInfo: ClientInfo): ISessionCore;
  // terminateSession(sessionUuid: string): void;
  // terminateAllSessions(): void;
  // addMFADevice(device: IMFADeviceCore): void;
  // removeMFADevice(deviceUuid: string): void;
  // createToken(type: TokenType): ITokenCore;
  // createRememberToken(deviceInfo?: string): ITokenCore;
  // revokeToken(tokenValue: string): void;
}

export interface IAuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  password: IPasswordDTO;
  sessions: ISessionDTO[];
  mfaDevices: IMFADeviceDTO[];
  tokens: ITokenDTO[];
  createdAt: number;
  updatedAt: number;
  lastAuthAt?: number;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: number;
}
