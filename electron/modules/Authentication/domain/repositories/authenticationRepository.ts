import { AuthCredential } from "../aggregates/authCredential";
import { Session } from "../entities/session";
import { MFADevice } from "../entities/mfaDevice";
import { Token } from "../valueObjects/token";

/**
 * 认证凭证存储库接口
 */
export interface IAuthCredentialRepository {
  // 认证凭证基本操作
  save(credential: AuthCredential): Promise<void>;
  findById(id: string): Promise<AuthCredential | null>;
  findByAccountId(accountId: string): Promise<AuthCredential | null>;
  delete(id: string): Promise<void>;
  
  // 查询操作
  findAll(): Promise<AuthCredential[]>;
  existsByAccountId(accountId: string): Promise<boolean>;
}

/**
 * 会话存储库接口
 */
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(sessionId: string): Promise<Session | null>;
  findByAccountId(accountId: string): Promise<Session[]>;
  findActiveByAccountId(accountId: string): Promise<Session[]>;
  delete(sessionId: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
}

/**
 * 令牌存储库接口
 */
export interface ITokenRepository {
  save(token: Token): Promise<void>;
  findByValue(tokenValue: string): Promise<Token | null>;
  findByAccountId(accountId: string): Promise<Token[]>;
  findByType(type: string): Promise<Token[]>;
  delete(tokenValue: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
}

/**
 * MFA设备存储库接口
 */
export interface IMFADeviceRepository {
  save(device: MFADevice): Promise<void>;
  findById(deviceId: string): Promise<MFADevice | null>;
  findByAccountId(accountId: string): Promise<MFADevice[]>;
  findEnabledByAccountId(accountId: string): Promise<MFADevice[]>;
  findByAccountIdAndType(accountId: string, type: string): Promise<MFADevice[]>;
  delete(deviceId: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  existsEnabledByAccountId(accountId: string): Promise<boolean>;
}
