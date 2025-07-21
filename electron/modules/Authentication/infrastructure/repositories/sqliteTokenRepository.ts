import { Database } from 'better-sqlite3';
import { Token } from '../../domain/valueObjects/token';
import { ITokenRepository } from '../../domain/repositories/authenticationRepository';

/**
 * SQLite Token 仓库实现
 * 注意：本实现需与 auth_tokens 表结构字段保持一致
 */
export class SqliteTokenRepository implements ITokenRepository {
  constructor(private readonly db: Database) {}

  /**
   * 保存令牌
   */
  async save(token: Token): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO auth_tokens (
        token_value, token_type, account_uuid, issued_at, expires_at, device_info, is_revoked
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      token.value,
      token.type,
      token.accountUuid,
      token.issuedAt.getTime(),
      token.expiresAt.getTime(),
      token.deviceInfo,
      token.isRevoked ? 1 : 0
    );
  }

  /**
   * 根据令牌值查找令牌
   */
  async findByValue(value: string): Promise<Token | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens WHERE token_value = ?
    `);

    const row = stmt.get(value) as any;
    if (!row) return null;

    return this.mapRowToToken(row);
  }

  /**
   * 根据账户ID查找令牌
   */
  async findByAccountUuid(accountUuid: string): Promise<Token[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE account_uuid = ? AND is_revoked = 0
      ORDER BY issued_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    return rows.map(row => this.mapRowToToken(row));
  }

  /**
   * 根据类型查找令牌
   */
  async findByType(type: string): Promise<Token[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE token_type = ? AND is_revoked = 0
      ORDER BY issued_at DESC
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => this.mapRowToToken(row));
  }

  /**
   * 根据账户ID和类型查找令牌
   */
  async findByAccountUuidAndType(accountUuid: string, type: string): Promise<Token[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE account_uuid = ? AND token_type = ? AND is_revoked = 0
      ORDER BY issued_at DESC
    `);

    const rows = stmt.all(accountUuid, type) as any[];
    return rows.map(row => this.mapRowToToken(row));
  }

  /**
   * 删除令牌
   */
  async delete(value: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_tokens WHERE token_value = ?
    `);

    stmt.run(value);
  }

  /**
   * 删除账户的所有令牌
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_tokens WHERE account_uuid = ?
    `);

    stmt.run(accountUuid);
  }

  /**
   * 撤销令牌
   */
  async revoke(value: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_tokens 
      SET is_revoked = 1 
      WHERE token_value = ?
    `);

    stmt.run(value);
  }

  /**
   * 撤销账户的所有令牌
   */
  async revokeAllByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_tokens 
      SET is_revoked = 1 
      WHERE account_uuid = ?
    `);

    stmt.run(accountUuid);
  }

  /**
   * 撤销账户指定类型的所有令牌
   */
  async revokeAllByAccountUuidAndType(accountUuid: string, type: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_tokens 
      SET is_revoked = 1 
      WHERE account_uuid = ? AND token_type = ?
    `);

    stmt.run(accountUuid, type);
  }

  /**
   * 清理过期的令牌
   */
  async deleteExpiredTokens(): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_tokens 
      WHERE expires_at < ? OR is_revoked = 1
    `);

    const result = stmt.run(Date.now());
    return result.changes;
  }

  /**
   * 获取账户的所有有效令牌
   */
  async findActiveByAccountUuid(accountUuid: string): Promise<Token[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE account_uuid = ? AND is_revoked = 0 AND expires_at > ?
      ORDER BY issued_at DESC
    `);

    const rows = stmt.all(accountUuid, Date.now()) as any[];
    return rows.map(row => this.mapRowToToken(row));
  }

  /**
   * 将数据库行映射为 Token 对象
   */
  private mapRowToToken(row: any): Token {
    return Token.fromDatabase(
      row.token_value,
      row.token_type,
      row.account_uuid,
      new Date(row.issued_at),
      new Date(row.expires_at),
      row.device_info,
      Boolean(row.is_revoked)
    );
  }
}