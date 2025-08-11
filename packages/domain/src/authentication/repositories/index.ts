import { AuthCredential } from '../aggregates/AuthCredential';
import { Session } from '../entities/Session';
import { MFADevice } from '../entities/MFADevice';
import { Token } from '../valueObjects/Token';

/**
 * 认证凭证存储库接口
 */
export interface IAuthCredentialRepository {
  // 认证凭证基本操作
  save(credential: AuthCredential): Promise<void>;
  findById(uuid: string): Promise<AuthCredential | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredential | null>;
  delete(uuid: string): Promise<void>;

  // 查询操作
  findAll(): Promise<AuthCredential[]>;
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 根据用户名查找认证凭证
   */
  findByUsername(username: string): Promise<AuthCredential | null>;
}

/**
 * 会话存储库接口
 */
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(sessionId: string): Promise<Session | null>;
  findByAccountUuid(accountUuid: string): Promise<Session[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<Session[]>;
  delete(sessionId: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
}

/**
 * 令牌存储库接口
 */
export interface ITokenRepository {
  save(token: Token): Promise<void>;
  findByValue(tokenValue: string): Promise<Token | null>;
  findByAccountUuid(accountUuid: string): Promise<Token[]>;
  findByType(type: string): Promise<Token[]>;
  delete(tokenValue: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
}

/**
 * MFA设备存储库接口
 */
export interface IMFADeviceRepository {
  save(device: MFADevice): Promise<void>;
  findById(deviceId: string): Promise<MFADevice | null>;
  findByAccountUuid(accountUuid: string): Promise<MFADevice[]>;
  findEnabledByAccountUuid(accountUuid: string): Promise<MFADevice[]>;
  findByAccountUuidAndType(accountUuid: string, type: string): Promise<MFADevice[]>;
  delete(deviceId: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  existsEnabledByAccountUuid(accountUuid: string): Promise<boolean>;
}
