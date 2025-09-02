/**
 * 共享事件契约统一导出
 * 所有模块都可以从这里导入需要的事件定义
 * 避免模块间的直接依赖
 */

// Account 模块事件契约
export * from './account.events';
export type { AccountDomainEvents } from './account.events';

// Authentication 模块事件契约
export * from './authentication.events';
export type { AuthenticationDomainEvents } from './authentication.events';

// 所有领域事件的联合类型
export type AllDomainEvents =
  | import('./account.events').AccountDomainEvents
  | import('./authentication.events').AuthenticationDomainEvents;

// 事件类型映射（用于类型安全的事件处理）
export interface EventTypeMap {
  // Account 事件
  AccountRegistered: import('./account.events').AccountRegisteredEvent;
  AccountStatusChanged: import('./account.events').AccountStatusChangedEvent;
  AccountUpdated: import('./account.events').AccountUpdatedEvent;
  AccountStatusVerificationResponse: import('./account.events').AccountStatusVerificationResponseEvent;
  AccountUuidGetterResponse: import('./account.events').AccountUuidGetterResponseEvent;
  AccountInfoGetterResponse: import('./account.events').AccountInfoGetterResponseEvent;

  // Authentication 事件
  AccountInfoGetterRequested: import('./authentication.events').AccountInfoGetterRequestedEvent;
  AccountUuidGetterRequested: import('./authentication.events').AccountUuidGetterRequestedEvent;
  AccountStatusVerificationRequested: import('./authentication.events').AccountStatusVerificationRequestedEvent;
  LoginCredentialVerification: import('./authentication.events').LoginCredentialVerificationEvent;
  LoginAttempt: import('./authentication.events').LoginAttemptEvent;
  UserLoggedIn: import('./authentication.events').UserLoggedInEvent;
  UserLoggedOut: import('./authentication.events').UserLoggedOutEvent;
  SessionTerminated: import('./authentication.events').SessionTerminatedEvent;
  AllSessionsTerminated: import('./authentication.events').AllSessionsTerminatedEvent;
  AccountDeactivationVerificationRequested: import('./authentication.events').AccountDeactivationVerificationRequestedEvent;
  AccountDeactivationVerificationResponse: import('./authentication.events').AccountDeactivationVerificationResponseEvent;
  AccountDeactivationConfirmed: import('./authentication.events').AccountDeactivationConfirmedEvent;
}

// 事件类型常量
export const EVENT_TYPES = {
  // Account 事件类型
  ACCOUNT: {
    REGISTERED: 'AccountRegistered' as const,
    STATUS_CHANGED: 'AccountStatusChanged' as const,
    UPDATED: 'AccountUpdated' as const,
    STATUS_VERIFICATION_RESPONSE: 'AccountStatusVerificationResponse' as const,
    UUID_GETTER_RESPONSE: 'AccountUuidGetterResponse' as const,
    INFO_GETTER_RESPONSE: 'AccountInfoGetterResponse' as const,
  },

  // Authentication 事件类型
  AUTH: {
    ACCOUNT_INFO_GETTER_REQUESTED: 'AccountInfoGetterRequested' as const,
    ACCOUNT_UUID_GETTER_REQUESTED: 'AccountUuidGetterRequested' as const,
    ACCOUNT_STATUS_VERIFICATION_REQUESTED: 'AccountStatusVerificationRequested' as const,
    LOGIN_CREDENTIAL_VERIFICATION: 'LoginCredentialVerification' as const,
    LOGIN_ATTEMPT: 'LoginAttempt' as const,
    USER_LOGGED_IN: 'UserLoggedIn' as const,
    USER_LOGGED_OUT: 'UserLoggedOut' as const,
    SESSION_TERMINATED: 'SessionTerminated' as const,
    ALL_SESSIONS_TERMINATED: 'AllSessionsTerminated' as const,
    ACCOUNT_DEACTIVATION_VERIFICATION_REQUESTED:
      'AccountDeactivationVerificationRequested' as const,
    ACCOUNT_DEACTIVATION_VERIFICATION_RESPONSE: 'AccountDeactivationVerificationResponse' as const,
    ACCOUNT_DEACTIVATION_CONFIRMED: 'AccountDeactivationConfirmed' as const,
  },
} as const;

// 类型安全的事件订阅辅助类型
export type EventHandler<T extends keyof EventTypeMap> = (event: EventTypeMap[T]) => Promise<void>;

/**
 * 事件版本控制
 * 用于处理事件格式的演进
 */
export interface EventVersion {
  version: string;
  compatibleVersions: string[];
}

/**
 * 事件元数据
 * 包含事件的版本、来源等信息
 */
export interface EventMetadata {
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
}
