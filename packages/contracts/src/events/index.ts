// 导出基础类型
export * from './types';
export * from './constants';

// 导出账户相关事件
export * from './accountEvents';

// 导出认证相关事件
export * from './authenticationEvents';

// =================== 所有事件类型的联合类型 ===================
import type {
  AccountStatusVerificationResponse,
  AccountInfoGetterByUuidResponse,
  AccountInfoGetterByUsernameResponse,
  AccountUuidGetterResponse,
  AccountStatusChangedEvent,
  AccountRegisteredEvent,
  AccountCreatedEvent,
  AccountUpdatedEvent,
} from './accountEvents';

import type {
  AccountInfoGetterByUuidRequested,
  AccountInfoGetterByUsernameRequested,
  AccountStatusVerificationRequested,
  LoginCredentialVerificationEvent,
  LoginAttemptEvent,
  UserLoggedInEvent,
  AccountDeactivationVerificationRequested,
  AccountDeactivationVerificationResponse,
  AccountDeactivationConfirmedEvent,
  UserLoggedOutEvent,
  SessionTerminatedEvent,
  AllSessionsTerminatedEvent,
} from './authenticationEvents';

/**
 * 所有账户相关事件的联合类型
 */
export type AccountEvent =
  | AccountStatusVerificationResponse
  | AccountInfoGetterByUuidResponse
  | AccountInfoGetterByUsernameResponse
  | AccountUuidGetterResponse
  | AccountStatusChangedEvent
  | AccountRegisteredEvent
  | AccountCreatedEvent
  | AccountUpdatedEvent;

/**
 * 所有认证相关事件的联合类型
 */
export type AuthenticationEvent =
  | AccountInfoGetterByUuidRequested
  | AccountInfoGetterByUsernameRequested
  | AccountStatusVerificationRequested
  | LoginCredentialVerificationEvent
  | LoginAttemptEvent
  | UserLoggedInEvent
  | AccountDeactivationVerificationRequested
  | AccountDeactivationVerificationResponse
  | AccountDeactivationConfirmedEvent
  | UserLoggedOutEvent
  | SessionTerminatedEvent
  | AllSessionsTerminatedEvent;

/**
 * 所有事件的联合类型
 */
export type DailyUseEvent = AccountEvent | AuthenticationEvent;

/**
 * 事件类型到事件对象的映射
 * 这样可以在事件处理器中获得类型安全
 */
export interface EventMap {
  // Account Events
  AccountStatusVerificationResponse: AccountStatusVerificationResponse;
  AccountUuidGetterResponse: AccountUuidGetterResponse;
  AccountInfoGetterByUsernameResponse: AccountInfoGetterByUsernameResponse;
  AccountInfoGetterByUuidResponse: AccountInfoGetterByUuidResponse;
  AccountRegistered: AccountRegisteredEvent;
  AccountCreated: AccountCreatedEvent;
  AccountStatusChanged: AccountStatusChangedEvent;
  AccountUpdated: AccountUpdatedEvent;

  // Authentication Events
  AccountInfoGetterByUuidRequested: AccountInfoGetterByUuidRequested;
  AccountInfoGetterByUsernameRequested: AccountInfoGetterByUsernameRequested;
  AccountStatusVerificationRequested: AccountStatusVerificationRequested;
  LoginCredentialVerification: LoginCredentialVerificationEvent;
  LoginAttempt: LoginAttemptEvent;
  UserLoggedIn: UserLoggedInEvent;
  AccountDeactivationVerificationRequested: AccountDeactivationVerificationRequested;
  AccountDeactivationVerificationResponse: AccountDeactivationVerificationResponse;
  AccountDeactivationConfirmed: AccountDeactivationConfirmedEvent;
  UserLoggedOut: UserLoggedOutEvent;
  SessionTerminated: SessionTerminatedEvent;
  AllSessionsTerminated: AllSessionsTerminatedEvent;
}
