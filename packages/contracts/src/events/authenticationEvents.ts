import { DomainEvent, ClientInfo, LoginResult } from './types';
import { EVENT_TYPES } from './constants';
import { AccountEntity, AuthSession } from '../entities';

// =================== 认证请求事件 ===================
export interface AccountInfoGetterByUuidRequested
  extends DomainEvent<{
    accountUuid: string;
    requestId: string; // 用于关联响应
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_INFO_GETTER_BY_UUID_REQUESTED;
}

export interface AccountInfoGetterByUsernameRequested
  extends DomainEvent<{
    username: string;
    requestId: string; // 用于关联响应
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_INFO_GETTER_BY_USERNAME_REQUESTED;
}

export interface AccountStatusVerificationRequested
  extends DomainEvent<{
    accountUuid: string;
    requestId: string; // 用于关联响应
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_STATUS_VERIFICATION_REQUESTED;
}

// =================== 登录相关事件 ===================
export interface LoginCredentialVerificationEvent
  extends DomainEvent<{
    account: AccountEntity;
    providedPassword: string;
    clientInfo: ClientInfo;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.LOGIN_CREDENTIAL_VERIFICATION;
}

export interface LoginAttemptEvent
  extends DomainEvent<{
    username: string;
    account: AccountEntity | null;
    success: boolean;
    loginResult: LoginResult;
    clientInfo: ClientInfo;
    attemptedAt: Date;
    failureReason?: string;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.LOGIN_ATTEMPT;
}

export interface UserLoggedInEvent
  extends DomainEvent<{
    account: AccountEntity;
    session: AuthSession;
    clientInfo: ClientInfo;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.USER_LOGGED_IN;
}

// =================== 账户注销事件 ===================
export interface AccountDeactivationVerificationRequested
  extends DomainEvent<{
    account: AccountEntity;
    providedPassword: string;
    requestReason: string;
    clientInfo: ClientInfo;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_DEACTIVATION_VERIFICATION_REQUESTED;
}

export interface AccountDeactivationVerificationResponse
  extends DomainEvent<{
    accountUuid: string;
    verified: boolean;
    reason?: string;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_DEACTIVATION_VERIFICATION_RESPONSE;
}

export interface AccountDeactivationConfirmedEvent
  extends DomainEvent<{
    account: AccountEntity;
    deactivationReason: string;
    deactivatedAt: Date;
    deactivatedBy: string; // 通常是账户本身
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ACCOUNT_DEACTIVATION_CONFIRMED;
}

// =================== 登出和会话管理事件 ===================
export interface UserLoggedOutEvent
  extends DomainEvent<{
    account: AccountEntity;
    sessionId: string;
    logoutReason: 'USER_REQUEST' | 'SESSION_EXPIRED' | 'SECURITY_LOGOUT' | 'ADMIN_LOGOUT';
    clientInfo: ClientInfo;
    logoutTime: Date;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.USER_LOGGED_OUT;
}

export interface SessionTerminatedEvent
  extends DomainEvent<{
    account: AccountEntity;
    sessionId: string;
    terminationReason: 'EXPIRED' | 'INVALID' | 'SECURITY' | 'USER_REQUEST';
    terminatedAt: Date;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.SESSION_TERMINATED;
}

export interface AllSessionsTerminatedEvent
  extends DomainEvent<{
    account: AccountEntity;
    terminationReason: 'PASSWORD_CHANGED' | 'ACCOUNT_COMPROMISED' | 'USER_REQUEST' | 'ADMIN_ACTION';
    terminatedSessionCount: number;
    terminatedAt: Date;
  }> {
  eventType: typeof EVENT_TYPES.AUTH.ALL_SESSIONS_TERMINATED;
}
