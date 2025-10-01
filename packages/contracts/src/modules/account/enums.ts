/**
 * Account 模块枚举定义
 */

/**
 * 账号状态枚举
 */
export enum AccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * 账号类型枚举
 */
export enum AccountType {
  LOCAL = 'local',
  ONLINE = 'online',
  GUEST = 'guest',
}

/**
 * 会话状态枚举
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}
