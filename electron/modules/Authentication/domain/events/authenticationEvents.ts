import { DomainEvent } from "@/shared/domain/domainEvent";


/**
 * username对应account_uuid请求事件载荷
 */
export interface AccountIdGetterRequestedEventPayload {
  username: string;
  requestedAt: Date;
  requestId: string; // 用于关联响应
}

/**
 * username对应account_uuid请求事件
 */
export interface AccountIdGetterRequestedEvent extends DomainEvent<AccountIdGetterRequestedEventPayload> {
  eventType: 'AccountIdGetterRequested';
  payload: AccountIdGetterRequestedEventPayload;
}

/**
 * 账号状态验证请求事件载荷
 */
export interface AccountStatusVerificationRequestedEventPayload {
  accountId: string;
  username: string;
  requestedAt: Date;
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
  accountId: string;
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
  accountId?: string;
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
  accountId: string;
  username: string;
  credentialId: string;
  sessionId: string;
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
  accountId: string;
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
  accountId: string;
  username: string;
  verificationResult: 'success' | 'failed' | 'cancelled' | 'timeout';
  verificationMethod: 'password' | 'mfa' | 'admin_override';
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
  accountId: string;
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
 * 用户注销事件载荷
 */
export interface UserLoggedOutEventPayload {
  accountId: string;
  username: string;
  sessionId: string;
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
 * 用户注销事件
 */
export interface UserLoggedOutEvent extends DomainEvent<UserLoggedOutEventPayload> {
  eventType: 'UserLoggedOut';
  payload: UserLoggedOutEventPayload;
}

/**
 * 会话终止事件载荷
 */
export interface SessionTerminatedEventPayload {
  sessionId: string;
  accountId: string;
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
  accountId: string;
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
