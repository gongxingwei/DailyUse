import type { AuthCredential } from '../aggregates/AuthCredential';
import type { Session } from '../entities/Session';
import type { MFADevice } from '../entities/MFADevice';
import type { Token } from '../valueObjects/Token';
import {
  AuthenticationContracts
} from '@dailyuse/contracts';

type AuthCredentialPersistenceDTO = AuthenticationContracts.AuthCredentialPersistenceDTO;
type UserSessionPersistenceDTO = AuthenticationContracts.UserSessionPersistenceDTO;
type AuthTokenPersistenceDTO = AuthenticationContracts.AuthTokenPersistenceDTO;
type MFADevicePersistenceDTO = AuthenticationContracts.MFADevicePersistenceDTO;

/**
 * 认证凭证存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface IAuthCredentialRepository {
  // 认证凭证基本操作 - 保存时接受领域对象，返回时提供 DTO
  save(credential: AuthCredential): Promise<void>;
  findById(uuid: string): Promise<AuthCredentialPersistenceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredentialPersistenceDTO | null>;
  delete(uuid: string): Promise<void>;

  // 查询操作 - 返回 DTO
  findAll(): Promise<AuthCredentialPersistenceDTO[]>;
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 根据用户名查找认证凭据 - 返回 DTO
   */
  findByUsername(username: string): Promise<AuthCredentialPersistenceDTO | null>;
}

/**
 * 会话存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(sessionId: string): Promise<UserSessionPersistenceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<UserSessionPersistenceDTO[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<UserSessionPersistenceDTO[]>;
  delete(sessionId: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
}

/**
 * 令牌存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface ITokenRepository {
  save(token: Token): Promise<void>;
  findByValue(tokenValue: string): Promise<AuthTokenPersistenceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthTokenPersistenceDTO[]>;
  findByType(type: string): Promise<AuthTokenPersistenceDTO[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<AuthTokenPersistenceDTO[]>;
  delete(tokenValue: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
}

/**
 * MFA设备存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface IMFADeviceRepository {
  save(device: MFADevice): Promise<void>;
  findById(deviceId: string): Promise<MFADevicePersistenceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]>;
  findEnabledByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]>;
  findVerifiedByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]>;
  findByAccountUuidAndType(accountUuid: string, type: string): Promise<MFADevicePersistenceDTO[]>;
  delete(deviceId: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  existsEnabledByAccountUuid(accountUuid: string): Promise<boolean>;
}
