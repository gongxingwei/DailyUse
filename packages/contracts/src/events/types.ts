import { AccountType, AccountStatus } from '../modules/account';

/**
 * 基础领域事件接口
 * 所有事件都必须实现这个接口
 */
export interface DomainEvent<T = any> {
  /** 聚合根ID */
  aggregateId: string;
  /** 事件类型标识符 */
  eventType: string;
  /** 事件发生时间 */
  occurredOn: Date;
  /** 事件载荷数据 */
  payload: T;
}

/**
 * 客户端信息
 */
export interface ClientInfo {
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  deviceName: string;
  /** 用户代理 */
  userAgent: string;
  /** IP地址 */
  ipAddress?: string;
}

/**
 * 用户资料信息
 */
export interface UserProfile {
  /** 名字 */
  firstName?: string;
  /** 姓氏 */
  lastName?: string;
  /** 头像URL */
  avatar?: string;
  /** 个人简介 */
  bio?: string;
}

// 重新导出核心类型
export { AccountType, AccountStatus };

/**
 * 登录结果类型
 */
export type LoginResult =
  | 'success'
  | 'failed'
  | 'account_not_found'
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_inactive';

/**
 * 验证结果类型
 */
export type VerificationResult = 'success' | 'failed' | 'account_locked' | 'credential_expired';

/**
 * 账户状态验证结果
 */
export type AccountStatusResult = 'active' | 'inactive' | 'suspended' | 'not_found';

/**
 * 登出类型
 */
export type LogoutType = 'manual' | 'forced' | 'expired' | 'system';

/**
 * 会话终止类型
 */
export type SessionTerminationType = 'logout' | 'timeout' | 'forced' | 'concurrent_login';

/**
 * 全部会话终止类型
 */
export type AllSessionsTerminationType = 'password_change' | 'security_breach' | 'admin_action';
