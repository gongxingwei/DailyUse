

/**
 * MFA设备类型枚举
 */
export enum MFADeviceType {
  TOTP = "totp", // Time-based One-Time Password (Google Authenticator等)
  SMS = "sms", // 短信验证码
  EMAIL = "email", // 邮箱验证码
  HARDWARE_KEY = "hardware_key", // 硬件密钥（如YubiKey）
  BACKUP_CODES = "backup_codes", // 备用验证码
}

/**
 * MFA设备接口
 */
export interface IMFADevice {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  backupCodes?: string[];
  isVerified: boolean;
  isEnabled: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  verificationAttempts: number;
  maxAttempts: number;
}

export interface IMFADeviceDTO {
  uuid: string;
  accountUuid: string;
  type: string; // MFADeviceType 的字符串表示
  name: string;
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  backupCodes?: string[];
  isVerified: number; // 0 或 1
  isEnabled: number; // 0 或 1
  createdAt: number;
  lastUsedAt?: number;
  verificationAttempts: number;
  maxAttempts: number;
}

// ======== AuthCredential Interface ========
export interface IAuthCredential {
  uuid: string;
  accountUuid: string;
  password: IPassword;
  sessions: Map<string, ISession>;
  mfaDevices: Map<string, IMFADevice>;
  rememberTokens: Map<string, IToken>;
  createdAt: Date;
  updatedAt: Date;
  lastAuthAt?: Date;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: Date;
  tokens: Map<string, IToken>;
}

export interface IAuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  password: IPasswordDTO;
  sessions: ISessionDTO[];
  mfaDevices: IMFADeviceDTO[];
  rememberTokens: ITokenDTO[];
  createdAt: number;
  updatedAt: number;
  lastAuthAt?: number;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: number;
  tokens: ITokenDTO[];
}
// ======== Session Interface ========
export interface ISession {
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

  isExpired(): boolean;
  refresh(extendMinutes?: number): void;
  terminate(reason?: string): void;
  isNearExpiry(thresholdMinutes?: number): boolean;
  getRemainingMinutes(): number;
  getDurationMinutes(): number;
  updateIPAddress(newIP: string, reason?: string): void;
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

// ======== Token Interface ========
/**
 * 令牌类型枚举
 */
export enum TokenType {
  REMEMBER_ME = "remember_me",
  ACCESS_TOKEN = "access_token",
  REFRESH_TOKEN = "refresh_token",
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
}

export interface IToken {
  value: string;
  type: TokenType;
  accountUuid: string;
  issuedAt: Date;
  expiresAt: Date;
  deviceInfo?: string;

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

// ======== Password interface ========
export interface IPassword {
  hashedValue: string;
  salt: string;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;

  verify(password: string): boolean;
}

export interface IPasswordDTO {
  hash: string;
  salt: string;
  algorithm: string;
  createdAt: string;
  expiresAt?: string;
}
