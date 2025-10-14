/**
 * Account Module Enums
 * 账户模块枚举定义
 */

// ============ 账户状态枚举 ============

/**
 * 账户状态
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// ============ 性别枚举 ============

/**
 * 性别
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

// ============ 主题枚举 ============

/**
 * 主题类型
 */
export enum ThemeType {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

// ============ 隐私设置枚举 ============

/**
 * 个人资料可见性
 */
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
}

// ============ 订阅相关枚举 ============

/**
 * 订阅计划类型
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * 订阅状态
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

/**
 * 计费周期
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}

// ============ 存储配额类型 ============

/**
 * 存储配额类型
 */
export enum StorageQuotaType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  UNLIMITED = 'UNLIMITED',
}
