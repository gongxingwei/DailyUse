
// Authentication 模块仓库导出
export { SqliteAuthCredentialRepository } from './infrastructure/repositories/sqliteAuthCredentialRepository';
export { SqliteUserSessionRepository } from './infrastructure/repositories/sqliteUserSessionRepository';
export { SqliteTokenRepository } from './infrastructure/repositories/sqliteTokenRepository';
export { SqliteMFADeviceRepository } from './infrastructure/repositories/sqliteMFADeviceRepository';

// Authentication 仓库接口导出
export type {
  IAuthCredentialRepository,
  ISessionRepository,
  ITokenRepository,
  IMFADeviceRepository
} from './domain/repositories/authenticationRepository';

export type { 
  PasswordAuthenticationRequest,
  PasswordAuthenticationResponse
} from './domain/types';

// Authentication 模块事件导出
export type { 
  LoginCredentialVerificationEvent, 
  AccountIdGetterRequestedEvent, 
  UserLoggedOutEvent, 
  AccountDeactivationVerificationResponseEvent, 
  AccountDeactivationVerificationRequestedEvent, 
  AccountStatusVerificationRequestedEvent, 
  AllSessionsTerminatedEvent, 
  SessionTerminatedEvent, 
  LoginAttemptEvent,
  UserLoggedInEvent,
  LoginCredentialVerificationEventPayload,
  
} from './domain/events/authenticationEvents';
