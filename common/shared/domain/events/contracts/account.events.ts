/**
 * 共享事件契约 - Account 模块
 * 定义 Account 模块发布的所有领域事件
 * 其他模块可以订阅这些事件，但不直接依赖 Account 模块
 */

import type { DomainEvent } from '../../domainEvent';

// ================================
// Account 注册相关事件
// ================================

/**
 * 账号注册事件载荷
 */
export interface AccountRegisteredEventPayload {
  accountUuid: string;
  username: string;
  password?: string; // 用于认证模块创建凭证
  email?: string;
  phone?: string;
  accountType: string;
  userUuid: string;
  userProfile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  status: string;
  createdAt: Date;
  requiresAuthentication: boolean; // 标识需要创建认证凭证
}

/**
 * 账号注册事件
 */
export interface AccountRegisteredEvent extends DomainEvent<AccountRegisteredEventPayload> {
  eventType: 'AccountRegistered';
  payload: AccountRegisteredEventPayload;
}

// ================================
// Account 状态变更相关事件
// ================================

/**
 * 账号状态变更事件载荷
 */
export interface AccountStatusChangedEventPayload {
  accountUuid: string;
  username: string;
  oldStatus: string;
  newStatus: string;
  changedBy: 'user' | 'admin' | 'system';
  reason?: string;
  changedAt: Date;
}

/**
 * 账号状态变更事件
 */
export interface AccountStatusChangedEvent extends DomainEvent<AccountStatusChangedEventPayload> {
  eventType: 'AccountStatusChanged';
  payload: AccountStatusChangedEventPayload;
}

// ================================
// Account 信息更新相关事件
// ================================

/**
 * 账号信息更新事件载荷
 */
export interface AccountUpdatedEventPayload {
  accountUuid: string;
  username: string;
  updatedFields: string[];
  updatedAt: Date;
  updatedBy: string;
}

/**
 * 账号信息更新事件
 */
export interface AccountUpdatedEvent extends DomainEvent<AccountUpdatedEventPayload> {
  eventType: 'AccountUpdated';
  payload: AccountUpdatedEventPayload;
}

// ================================
// Account 查询响应事件（用于模块间通信）
// ================================

/**
 * 账号状态验证响应事件载荷
 */
export interface AccountStatusVerificationResponseEventPayload {
  accountUuid: string;
  username: string;
  requestId: string; // 关联原始请求
  accountStatus: 'active' | 'inactive' | 'locked' | 'suspended' | 'not_found';
  isLoginAllowed: boolean;
  statusMessage?: string;
  verifiedAt: Date;
}

/**
 * 账号状态验证响应事件
 */
export interface AccountStatusVerificationResponseEvent
  extends DomainEvent<AccountStatusVerificationResponseEventPayload> {
  eventType: 'AccountStatusVerificationResponse';
  payload: AccountStatusVerificationResponseEventPayload;
}

/**
 * 账号UUID查询响应事件载荷
 */
export interface AccountUuidGetterResponseEventPayload {
  accountUuid: string | null;
  username: string;
  requestId: string; // 关联原始请求
}

/**
 * 账号UUID查询响应事件
 */
export interface AccountUuidGetterResponseEvent
  extends DomainEvent<AccountUuidGetterResponseEventPayload> {
  eventType: 'AccountUuidGetterResponse';
  payload: AccountUuidGetterResponseEventPayload;
}

/**
 * 账号信息查询响应事件载荷
 */
export interface AccountInfoGetterResponseEventPayload {
  accountUuid: string;
  username: string;
  email?: string;
  phone?: string;
  status: string;
  accountType: string;
  userProfile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
    bio?: string;
  };
  requestId: string; // 关联原始请求
  retrievedAt: Date;
}

/**
 * 账号信息查询响应事件
 */
export interface AccountInfoGetterResponseEvent
  extends DomainEvent<AccountInfoGetterResponseEventPayload> {
  eventType: 'AccountInfoGetterResponse';
  payload: AccountInfoGetterResponseEventPayload;
}

// ================================
// 导出所有 Account 相关事件类型
// ================================

export type AccountDomainEvents =
  | AccountRegisteredEvent
  | AccountStatusChangedEvent
  | AccountUpdatedEvent
  | AccountStatusVerificationResponseEvent
  | AccountUuidGetterResponseEvent
  | AccountInfoGetterResponseEvent;
