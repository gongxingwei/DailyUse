import { Database } from 'better-sqlite3';
import { IAuthCredentialRepository } from '../../domain/repositories/authenticationRepository';

import { getDatabase } from '../../../../shared/database/index';
// repositories
import { SqliteMFADeviceRepository } from './sqliteMFADeviceRepository';
import { SqliteSessionRepository } from './sqliteUserSessionRepository';
import { SqliteTokenRepository } from './sqliteTokenRepository';
import { TokenType } from '@common/modules/authentication/types/authentication';
// domains
import { AuthCredential } from '../../domain/aggregates/authCredential';
import { MFADevice } from '../../domain/entities/mfaDevice';
import { Session } from '../../domain/entities/session';
/**
 * SQLite 认证凭证仓库实现
 */
export class SqliteAuthCredentialRepository implements IAuthCredentialRepository {
  private db: Database | null = null;

  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async save(credential: AuthCredential): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO auth_credentials (
        uuid, account_uuid, password_hash, password_salt, password_algorithm,
        password_created_at, password_expires_at, failed_attempts,
        max_attempts, locked_until, last_auth_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 获取密码信息
    const passwordInfo = this.extractPasswordInfo(credential);

    stmt.run(
      credential.uuid,
      credential.accountUuid,
      passwordInfo.hash,
      passwordInfo.salt,
      passwordInfo.algorithm,
      passwordInfo.createdAt,
      passwordInfo.expiresAt,
      credential.failedAttempts,
      credential.maxAttempts,
      credential.lockedUntil ? credential.lockedUntil.getTime() : null,
      credential.lastAuthAt ? credential.lastAuthAt.getTime() : null,
      credential.createdAt.getTime(),
      credential.updatedAt.getTime(),
    );
  }

  async findById(uuid: string): Promise<AuthCredential | null> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM auth_credentials WHERE id = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    return this.mapRowToAuthCredential(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM auth_credentials WHERE account_uuid = ?
    `);

    const row = stmt.get(accountUuid) as any;
    if (!row) return null;

    return this.mapRowToAuthCredential(row);
  }

  async findByUsername(username: string): Promise<AuthCredential | null> {
    // 通过 users 表的 username 关联查找认证凭证
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT ac.* FROM auth_credentials ac
      INNER JOIN users u ON ac.account_uuid = u.uuid
      WHERE u.username = ?
    `);

    const row = stmt.get(username) as any;
    if (!row) return null;

    return this.mapRowToAuthCredential(row);
  }

  async delete(uuid: string): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      DELETE FROM auth_credentials WHERE id = ?
    `);

    stmt.run(uuid);
  }

  async findAll(): Promise<AuthCredential[]> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM auth_credentials ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];
    return Promise.all(rows.map((row) => this.mapRowToAuthCredential(row)));
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT 1 FROM auth_credentials WHERE account_uuid = ? LIMIT 1
    `);

    const result = stmt.get(accountUuid);
    return !!result;
  }

  /**
   * 将数据库行映射为 AuthCredential 聚合根
   */
  private async mapRowToAuthCredential(row: any): Promise<AuthCredential> {
    const tokenRepo = new SqliteTokenRepository();
    const tokens = await tokenRepo.findByAccountUuid(row.account_uuid);
    const rememberTokens = await tokenRepo.findByAccountUuidAndType(
      row.account_uuid,
      TokenType.REMEMBER_ME,
    );
    const otherTokens = tokens.filter((t) => t.type !== TokenType.REMEMBER_ME);
    const rememberTokenMap = new Map(rememberTokens.map((t) => [t.type, t]));
    const tokenMap = new Map(otherTokens.map((t) => [t.type, t]));
    const sessionRepo = new SqliteSessionRepository();
    const sessions = await sessionRepo.findByAccountUuid(row.account_uuid);
    const sessionMap = new Map<string, Session>(sessions.map((s) => [s.uuid, s]));
    const mfaDeviceRepo = new SqliteMFADeviceRepository();
    const mfaDevices = await mfaDeviceRepo.findByAccountUuid(row.account_uuid);
    const mfaDeviceMap = new Map<string, MFADevice>(mfaDevices.map((d) => [d.uuid, d]));
    const authCredential = AuthCredential.restoreFromPersistenceWithEntities({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      passwordAlgorithm: row.password_algorithm,
      passwordCreatedAt: new Date(row.password_created_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAuthAt: row.last_auth_at ? new Date(row.last_auth_at) : undefined,
      passwordExpiresAt: row.password_expires_at ? new Date(row.password_expires_at) : undefined,
      failedAttempts: row.failed_attempts,
      maxAttempts: row.max_attempts,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
      tokens: tokenMap,
      rememberTokens: rememberTokenMap,
      sessions: sessionMap,
      mfaDevices: mfaDeviceMap,
    });
    return authCredential;
  }

  /**
   * 提取密码信息用于持久化
   */
  private extractPasswordInfo(credential: AuthCredential): {
    hash: string;
    salt: string;
    algorithm: string;
    createdAt: number;
    expiresAt: number | undefined;
  } {
    const passwordInfo = credential.getPasswordInfo();

    return {
      hash: passwordInfo.hashedValue,
      salt: passwordInfo.salt,
      algorithm: passwordInfo.algorithm,
      createdAt: passwordInfo.createdAt.getTime(),
      expiresAt: passwordInfo.expiresAt ? passwordInfo.expiresAt.getTime() : undefined,
    };
  }
}
