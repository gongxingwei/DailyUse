import type { Database } from "better-sqlite3";
import { Session } from "../../domain/entities/session";
import { ISessionRepository } from "../../domain/repositories/authenticationRepository";
import { getDatabase } from "../../../../shared/database/index";

/**
 * SQLite 会话存储库实现
 * 注意：本实现需与 auth_sessions 表结构字段保持一致
 */
export class SqliteSessionRepository implements ISessionRepository {
  private database: Promise<Database>;

  constructor() {
    this.database = getDatabase();
  }

  async save(session: Session): Promise<void> {
    const db = await this.database;
    try {
      const sessionData = session.toDatabaseFormat();

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO auth_sessions 
        (uuid, account_uuid, session_token, device_info, ip_address, user_agent, location_info, created_at, last_active_at, expires_at, is_active, logout_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        sessionData.uuid,
        sessionData.account_uuid,
        undefined, // session_token 可以在后续逻辑中处理
        sessionData.device_info,
        sessionData.ip_address,
        sessionData.user_agent || null,
        undefined, // location_info 可以在后续逻辑中处理
        sessionData.created_at,
        sessionData.last_active_at,
        sessionData.expires_at,
        sessionData.is_active ? 1 : 0,
        undefined
      );
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error(`Failed to save session: ${error}`);
    }
  }

  async findById(sessionId: string): Promise<Session | null> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions WHERE uuid = ?
      `);

      const row = stmt.get(sessionId) as any;
      if (!row) return null;

      return Session.fromDatabase(row);
    } catch (error) {
      console.error('Failed to find session by uuid:', error);
      return null;
    }
  }

  async findByAccountUuid(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_uuid = ? 
        ORDER BY last_active_at DESC
      `);

      const rows = stmt.all(accountUuid) as any[];
      return rows.map(row => Session.fromDatabase(row));
    } catch (error) {
      console.error('Failed to find sessions by account uuid:', error);
      return [];
    }
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const now = Date.now();
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?
        ORDER BY last_active_at DESC
      `);

      const rows = stmt.all(accountUuid, now) as any[];
      return rows.map(row => Session.fromDatabase(row)).filter(session => session.isActive);
    } catch (error) {
      console.error('Failed to find active sessions by account uuid:', error);
      return [];
    }
  }

  async delete(sessionId: string): Promise<void> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`DELETE FROM auth_sessions WHERE uuid = ?`);
      stmt.run(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error(`Failed to delete session: ${error}`);
    }
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`DELETE FROM auth_sessions WHERE account_uuid = ?`);
      stmt.run(accountUuid);
    } catch (error) {
      console.error('Failed to delete sessions by account uuid:', error);
      throw new Error(`Failed to delete sessions by account uuid: ${error}`);
    }
  }

  async deleteExpiredSessions(): Promise<number> {
    const db = await this.database;
    try {
      const now = Date.now();
      const stmt = db.prepare(`
        DELETE FROM auth_sessions 
        WHERE expires_at <= ? OR (is_active = 0 AND last_active_at <= ?)
      `);

      const result = stmt.run(now, now - 7 * 24 * 60 * 60 * 1000); // 删除7天前的非活跃会话
      return result.changes;
    } catch (error) {
      console.error('Failed to delete expired sessions:', error);
      return 0;
    }
  }

  /**
   * 批量更新会话活跃时间
   */
  async batchUpdateLastActive(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return;

    const db = await this.database;
    try {
      const now = Date.now();
      const placeholders = sessionIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        UPDATE auth_sessions 
        SET last_active_at = ? 
        WHERE uuid IN (${placeholders})
      `);

      stmt.run(now, ...sessionIds);
    } catch (error) {
      console.error('Failed to batch update last active:', error);
      throw new Error(`Failed to batch update last active: ${error}`);
    }
  }

  /**
   * 终止指定账号的所有其他会话（除了指定的会话）
   */
  async terminateOtherSessions(accountUuid: string, keepSessionId: string): Promise<number> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`
        UPDATE auth_sessions 
        SET is_active = 0, last_active_at = ? 
        WHERE account_uuid = ? AND uuid != ? AND is_active = 1
      `);

      const result = stmt.run(Date.now(), accountUuid, keepSessionId);
      return result.changes;
    } catch (error) {
      console.error('Failed to terminate other sessions:', error);
      return 0;
    }
  }

  /**
   * 获取账号的活跃会话统计
   */
  async getActiveSessionStats(accountUuid: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    devicesCount: number;
    recentActivity: Date | null;
  }> {
    const db = await this.database;
    try {
      const now = Date.now();

      // 总会话数
      const totalStmt = db.prepare(`
        SELECT COUNT(*) as count FROM auth_sessions WHERE account_uuid = ?
      `);
      const totalResult = totalStmt.get(accountUuid) as any;

      // 活跃会话数
      const activeStmt = db.prepare(`
        SELECT COUNT(*) as count FROM auth_sessions 
        WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?
      `);
      const activeResult = activeStmt.get(accountUuid, now) as any;

      // 不同设备数量
      const devicesStmt = db.prepare(`
        SELECT COUNT(DISTINCT device_info) as count FROM auth_sessions 
        WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?
      `);
      const devicesResult = devicesStmt.get(accountUuid, now) as any;

      // 最近活跃时间
      const recentStmt = db.prepare(`
        SELECT MAX(last_active_at) as recent FROM auth_sessions 
        WHERE account_uuid = ? AND is_active = 1
      `);
      const recentResult = recentStmt.get(accountUuid) as any;

      return {
        totalSessions: totalResult.count,
        activeSessions: activeResult.count,
        devicesCount: devicesResult.count,
        recentActivity: recentResult.recent ? new Date(recentResult.recent) : null
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        devicesCount: 0,
        recentActivity: null
      };
    }
  }

  /**
   * 获取可疑会话（同一时间多地登录等）
   */
  async findSuspiciousSessions(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // 查找一小时内从不同IP登录的会话
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_uuid = ? 
          AND is_active = 1 
          AND expires_at > ?
          AND created_at > ?
          AND ip_address IN (
            SELECT ip_address FROM auth_sessions 
            WHERE account_uuid = ? 
              AND created_at > ?
            GROUP BY ip_address 
            HAVING COUNT(DISTINCT ip_address) > 1
          )
        ORDER BY created_at DESC
      `);

      const rows = stmt.all(accountUuid, now, oneHourAgo, accountUuid, oneHourAgo) as any[];
      return rows.map(row => Session.fromDatabase(row));
    } catch (error) {
      console.error('Failed to find suspicious sessions:', error);
      return [];
    }
  }
}