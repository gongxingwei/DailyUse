import type { DomainEvent } from "@dailyuse/utils";
import { Account } from "../../account/aggregates/Account";

/**
 * 通过 accountUuid 获取账号信息的请求事件载荷
 */
export interface AccountInfoGetterByUuidRequestedEventPayload {
  accountUuid: string;
  requestId: string; // 用于关联响应
}

/**
 * 通过 accountUuid 获取账号信息的请求事件
 */
export interface AccountInfoGetterByUuidRequestedEvent extends DomainEvent<AccountInfoGetterByUuidRequestedEventPayload> {
  eventType: 'AccountInfoGetterByUuidRequested';
  payload: AccountInfoGetterByUuidRequestedEventPayload;
}

/**
 * username对应account_uuid请求事件载荷
 */
export interface AccountInfoGetterByUsernameRequestedEventPayload {
  username: string;
  requestId: string; // 用于关联响应
}

/**
 * 通过 username 来获取完整 Account 信息的请求事件  
 * 事件类型：AccountInfoGetterByUsernameRequested  
 * 事件负载：{  
 *    username: string; // 用户名  
 *    requestId: string; // 请求ID，用于关联响应  
 * }
 */
export interface AccountInfoGetterByUsernameRequestedEvent extends DomainEvent<AccountInfoGetterByUsernameRequestedEventPayload> {
  eventType: 'AccountInfoGetterByUsernameRequested';
  payload: AccountInfoGetterByUsernameRequestedEventPayload;
}

/**
 * 账号状态验证请求事件载荷
 */
export interface AccountStatusVerificationRequestedEventPayload {
  accountUuid: string;
  username: string;
  requestId: string; // 用于关联响应
}

/**
 * 账号状态验证请求事件
 */
export interface AccountStatusVerificationRequestedEvent extends DomainEvent<AccountStatusVerificationRequestedEventPayload> {
  eventType: 'AccountStatusVerificationRequested';
  payload: AccountStatusVerificationRequestedEventPayload;
}

/**
 * 登录凭证验证事件载荷
 */
export interface LoginCredentialVerificationEventPayload {
  accountUuid: string;
  username: string;
  credentialId: string;
  verificationResult: 'success' | 'failed' | 'account_locked' | 'credential_expired';
  failureReason?: string;
  verifiedAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 登录凭证验证事件
 */
export interface LoginCredentialVerificationEvent extends DomainEvent<LoginCredentialVerificationEventPayload> {
  eventType: 'LoginCredentialVerification';
  payload: LoginCredentialVerificationEventPayload;
}

/**
 * 登录尝试事件载荷
 */
export interface LoginAttemptEventPayload {
  username: string;
  accountUuid?: string;
  result: 'success' | 'failed' | 'account_not_found' | 'invalid_credentials' | 'account_locked' | 'account_inactive';
  failureReason?: string;
  attemptedAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 登录尝试事件
 */
export interface LoginAttemptEvent extends DomainEvent<LoginAttemptEventPayload> {
  eventType: 'LoginAttempt';
  payload: LoginAttemptEventPayload;
}

/**
 * 用户登录成功事件载荷
 */
export interface UserLoggedInEventPayload {
  accountUuid: string;
  username: string;
  credentialId: string;
  sessionUuid: string;
  loginAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 用户登录成功事件
 */
export interface UserLoggedInEvent extends DomainEvent<UserLoggedInEventPayload> {
  eventType: 'UserLoggedIn';
  payload: UserLoggedInEventPayload;
}

/**
 * 账号注销验证请求事件载荷
 */
export interface AccountDeactivationVerificationRequestedEventPayload {
  accountUuid: string;
  username: string;
  requestId: string;
  requestedBy: 'user' | 'admin' | 'system';
  reason?: string;
  requestedAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 账号注销验证请求事件
 */
export interface AccountDeactivationVerificationRequestedEvent extends DomainEvent<AccountDeactivationVerificationRequestedEventPayload> {
  eventType: 'AccountDeactivationVerificationRequested';
  payload: AccountDeactivationVerificationRequestedEventPayload;
}

/**
 * 账号注销验证响应事件载荷
 */
export interface AccountDeactivationVerificationResponseEventPayload {
  requestId: string;
  accountUuid: string;
  username: string;
  verificationResult: 'success' | 'failed' | 'cancelled' | 'timeout';
  verificationMethod: 'password' | 'mfa' | 'admin_overrUuide';
  verifiedAt: Date;
  failureReason?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 账号注销验证响应事件
 */
export interface AccountDeactivationVerificationResponseEvent extends DomainEvent<AccountDeactivationVerificationResponseEventPayload> {
  eventType: 'AccountDeactivationVerificationResponse';
  payload: AccountDeactivationVerificationResponseEventPayload;
}

/**
 * 账号注销确认事件载荷
 */
export interface AccountDeactivationConfirmedEventPayload {
  accountUuid: string;
  username: string;
  deactivatedBy: 'user' | 'admin' | 'system';
  reason?: string;
  deactivatedAt: Date;
  authDataCleanup: boolean; // 认证数据是否已清理
  sessionTerminationCount: number;
}

/**
 * 账号注销确认事件
 */
export interface AccountDeactivationConfirmedEvent extends DomainEvent<AccountDeactivationConfirmedEventPayload> {
  eventType: 'AccountDeactivationConfirmed';
  payload: AccountDeactivationConfirmedEventPayload;
}

/**
 * 用户登出事件载荷
 */
export interface UserLoggedOutEventPayload {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  logoutType: 'manual' | 'forced' | 'expired' | 'system';
  logoutReason?: string;
  loggedOutAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 用户登出事件
 */
export interface UserLoggedOutEvent extends DomainEvent<UserLoggedOutEventPayload> {
  eventType: 'UserLoggedOut';
  payload: UserLoggedOutEventPayload;
}

/**
 * 会话终止事件载荷
 */
export interface SessionTerminatedEventPayload {
  sessionUuid: string;
  accountUuid: string;
  terminationType: 'logout' | 'timeout' | 'forced' | 'concurrent_login';
  terminatedAt: Date;
  remainingActiveSessions: number;
}

/**
 * 会话终止事件
 */
export interface SessionTerminatedEvent extends DomainEvent<SessionTerminatedEventPayload> {
  eventType: 'SessionTerminated';
  payload: SessionTerminatedEventPayload;
}

/**
 * 全部会话终止事件载荷
 */
export interface AllSessionsTerminatedEventPayload {
  accountUuid: string;
  username: string;
  terminationType: 'password_change' | 'security_breach' | 'admin_action';
  terminatedSessionCount: number;
  terminatedAt: Date;
}

/**
 * 全部会话终止事件
 */
export interface AllSessionsTerminatedEvent extends DomainEvent<AllSessionsTerminatedEventPayload> {
  eventType: 'AllSessionsTerminated';
  payload: AllSessionsTerminatedEventPayload;
}
