import { Database } from "better-sqlite3";
import { IAuthCredentialRepository } from "../../domain/repositories/authenticationRepository";
import { AuthCredential } from "../../domain/aggregates/authCredential";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { getDatabase } from "../../../../shared/database/index";
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
      credential.lockedUntil ? TimeUtils.toTimestamp(credential.lockedUntil) : null,
      credential.lastAuthAt ? TimeUtils.toTimestamp(credential.lastAuthAt) : null,
      TimeUtils.toTimestamp(credential.createdAt),
      TimeUtils.toTimestamp(credential.updatedAt)
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
    return rows.map(row => this.mapRowToAuthCredential(row));
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
  private mapRowToAuthCredential(row: any): AuthCredential {
    return AuthCredential.restoreFromPersistence(
      row.uuid,
      row.account_uuid,
      row.password_hash,
      row.password_salt,
      row.password_algorithm,
      TimeUtils.fromTimestamp(row.password_created_at),
      TimeUtils.fromTimestamp(row.created_at),
      TimeUtils.fromTimestamp(row.updated_at),
      row.last_auth_at ? TimeUtils.fromTimestamp(row.last_auth_at) : undefined,
      row.password_expires_at ? TimeUtils.fromTimestamp(row.password_expires_at) : undefined,
      row.failed_attempts,
      row.max_attempts,
      row.locked_until ? TimeUtils.fromTimestamp(row.locked_until) : undefined
    );
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
      createdAt: TimeUtils.toTimestamp(passwordInfo.createdAt),
      expiresAt: passwordInfo.expiresAt ? TimeUtils.toTimestamp(passwordInfo.expiresAt) : undefined
    };
  }
}
