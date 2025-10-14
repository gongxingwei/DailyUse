/**
 * Authentication Module - Domain Server
 * 认证模块 - 领域服务端
 */

// 聚合根
export { AuthCredential } from './aggregates/AuthCredential';
export { AuthSession } from './aggregates/AuthSession';

// 实体
export { PasswordCredential } from './entities/PasswordCredential';
export { ApiKeyCredential } from './entities/ApiKeyCredential';
export { RememberMeToken } from './entities/RememberMeToken';
export { CredentialHistory } from './entities/CredentialHistory';
export { RefreshToken } from './entities/RefreshToken';
export { SessionHistory } from './entities/SessionHistory';

// 值对象
export { DeviceInfo } from './value-objects/DeviceInfo';

// 仓储接口
export type { IAuthCredentialRepository } from './repositories/IAuthCredentialRepository';
export type { IAuthSessionRepository } from './repositories/IAuthSessionRepository';

// 领域服务
export { AuthenticationDomainService } from './services/AuthenticationDomainService';
