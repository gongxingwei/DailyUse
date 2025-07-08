// Authentication 模块导出
export { AuthenticationService } from './services/authenticationService';

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
  LoginCredentials, 
  AuthResult, 
  RegisterData 
} from './domain/types';
