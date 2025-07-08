import { Database } from "better-sqlite3";
import { Session } from "../../domain/entities/session";
import { ISessionRepository } from "../../domain/repositories/authenticationRepository";

/**
 * SQLite 用户会话存储库实现
 * 负责认证会话数据的持久化和查询
 */
export class SqliteUserSessionRepository implements ISessionRepository {
  constructor(private readonly db: Database) {}

  /**
   * 保存会话
   */
  async save(session: Session): Promise<void> {
    const data = session.toDatabaseFormat();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO auth_sessions (
        id, account_id, device_info, ip_address, user_agent,
        created_at, last_active_at, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.account_id,
      data.device_info,
      data.ip_address,
      data.user_agent,
      data.created_at,
      data.last_active_at,
      data.expires_at,
      data.is_active
    );
  }

  /**
   * 根据会话ID查找会话
   */
  async findById(sessionId: string): Promise<Session | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_sessions WHERE id = ?
    `);

    const row = stmt.get(sessionId) as any;
    if (!row) return null;

    return Session.fromDatabase(row);
  }

  /**
   * 根据账户ID查找所有会话
   */
  async findByAccountId(accountId: string): Promise<Session[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_sessions 
      WHERE account_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountId) as any[];
    return rows.map(row => Session.fromDatabase(row));
  }

  /**
   * 根据账户ID查找活跃会话
   */
  async findActiveByAccountId(accountId: string): Promise<Session[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_sessions 
      WHERE account_id = ? AND is_active = 1 AND expires_at > ?
      ORDER BY last_active_at DESC
    `);

    const rows = stmt.all(accountId, Date.now()) as any[];
    return rows.map(row => Session.fromDatabase(row));
  }

  /**
   * 删除会话
   */
  async delete(sessionId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_sessions WHERE id = ?
    `);

    stmt.run(sessionId);
  }

  /**
   * 删除账户的所有会话
   */
  async deleteByAccountId(accountId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_sessions WHERE account_id = ?
    `);

    stmt.run(accountId);
  }

  /**
   * 删除过期的会话
   */
  async deleteExpiredSessions(): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM auth_sessions WHERE expires_at < ? OR is_active = 0
    `);

    const result = stmt.run(Date.now());
    return result.changes;
  }

  /**
   * 更新会话的最后活跃时间
   */
  async updateLastActiveTime(sessionId: string, lastActiveAt: Date): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_sessions 
      SET last_active_at = ? 
      WHERE id = ?
    `);

    stmt.run(lastActiveAt.getTime(), sessionId);
  }

  /**
   * 终止会话（设置为非活跃状态）
   */
  async terminateSession(sessionId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_sessions 
      SET is_active = 0 
      WHERE id = ?
    `);

    stmt.run(sessionId);
  }

  /**
   * 终止账户的所有其他会话（除了指定的会话）
   */
  async terminateOtherSessions(accountId: string, currentSessionId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE auth_sessions 
      SET is_active = 0 
      WHERE account_id = ? AND id != ?
    `);

    stmt.run(accountId, currentSessionId);
  }

  /**
   * 获取账户的活跃会话数量
   */
  async countActiveSessionsByAccountId(accountId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM auth_sessions 
      WHERE account_id = ? AND is_active = 1 AND expires_at > ?
    `);

    const result = stmt.get(accountId, Date.now()) as any;
    return result.count;
  }
}
