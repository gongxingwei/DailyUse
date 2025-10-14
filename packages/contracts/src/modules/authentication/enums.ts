/**
 * Authentication Module Enums
 * 认证模块枚举定义
 */

// ============ 凭证类型枚举 ============

/**
 * 认证凭证类型
 */
export enum CredentialType {
  PASSWORD = 'PASSWORD',
  API_KEY = 'API_KEY',
  BIOMETRIC = 'BIOMETRIC',
  MAGIC_LINK = 'MAGIC_LINK',
  HARDWARE_KEY = 'HARDWARE_KEY',
}

/**
 * 凭证状态
 */
export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

// ============ 密码算法枚举 ============

/**
 * 密码哈希算法
 */
export enum PasswordAlgorithm {
  BCRYPT = 'BCRYPT',
  ARGON2 = 'ARGON2',
  SCRYPT = 'SCRYPT',
}

// ============ 两步验证枚举 ============

/**
 * 两步验证方法
 */
export enum TwoFactorMethod {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  AUTHENTICATOR_APP = 'AUTHENTICATOR_APP',
}

// ============ 生物识别枚举 ============

/**
 * 生物识别类型
 */
export enum BiometricType {
  FINGERPRINT = 'FINGERPRINT',
  FACE_ID = 'FACE_ID',
  TOUCH_ID = 'TOUCH_ID',
}

// ============ API Key 状态枚举 ============

/**
 * API Key 状态
 */
export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

// ============ Token 状态枚举 ============

/**
 * Remember-Me Token 状态
 */
export enum RememberMeTokenStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

// ============ 设备类型枚举 ============

/**
 * 设备类型
 */
export enum DeviceType {
  BROWSER = 'BROWSER',
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  API = 'API',
  UNKNOWN = 'UNKNOWN',
}

// ============ 会话状态枚举 ============

/**
 * 会话状态
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  LOCKED = 'LOCKED',
}
