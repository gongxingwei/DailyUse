import type { Database } from "better-sqlite3";
import { Session } from "../../domain/entities/session";
import { ISessionRepository } from "../../domain/repositories/authenticationRepository";
import { getDatabase } from "../../../../config/database";

/**
 * SQLite 会话存储库实现
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
        (id, account_id, device_info, ip_address, user_agent, created_at, last_active_at, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        sessionData.id,
        sessionData.account_id,
        sessionData.device_info,
        sessionData.ip_address,
        sessionData.user_agent || null,
        sessionData.created_at,
        sessionData.last_active_at,
        sessionData.expires_at,
        sessionData.is_active
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
        SELECT * FROM auth_sessions WHERE id = ?
      `);
      
      const row = stmt.get(sessionId) as any;
      if (!row) return null;

      return Session.fromDatabase(row);
    } catch (error) {
      console.error('Failed to find session by id:', error);
      return null;
    }
  }

  async findByAccountId(accountId: string): Promise<Session[]> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_id = ? 
        ORDER BY last_active_at DESC
      `);
      
      const rows = stmt.all(accountId) as any[];
      return rows.map(row => Session.fromDatabase(row));
    } catch (error) {
      console.error('Failed to find sessions by account id:', error);
      return [];
    }
  }

  async findActiveByAccountId(accountId: string): Promise<Session[]> {
    const db = await this.database;
    
    try {
      const now = Date.now();
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_id = ? AND is_active = 1 AND expires_at > ?
        ORDER BY last_active_at DESC
      `);
      
      const rows = stmt.all(accountId, now) as any[];
      return rows.map(row => Session.fromDatabase(row)).filter(session => session.isActive);
    } catch (error) {
      console.error('Failed to find active sessions by account id:', error);
      return [];
    }
  }

  async delete(sessionId: string): Promise<void> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`DELETE FROM auth_sessions WHERE id = ?`);
      stmt.run(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error(`Failed to delete session: ${error}`);
    }
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`DELETE FROM auth_sessions WHERE account_id = ?`);
      stmt.run(accountId);
    } catch (error) {
      console.error('Failed to delete sessions by account id:', error);
      throw new Error(`Failed to delete sessions by account id: ${error}`);
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
        WHERE id IN (${placeholders})
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
  async terminateOtherSessions(accountId: string, keepSessionId: string): Promise<number> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`
        UPDATE auth_sessions 
        SET is_active = 0, last_active_at = ? 
        WHERE account_id = ? AND id != ? AND is_active = 1
      `);
      
      const result = stmt.run(Date.now(), accountId, keepSessionId);
      return result.changes;
    } catch (error) {
      console.error('Failed to terminate other sessions:', error);
      return 0;
    }
  }

  /**
   * 获取账号的活跃会话统计
   */
  async getActiveSessionStats(accountId: string): Promise<{
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
        SELECT COUNT(*) as count FROM auth_sessions WHERE account_id = ?
      `);
      const totalResult = totalStmt.get(accountId) as any;
      
      // 活跃会话数
      const activeStmt = db.prepare(`
        SELECT COUNT(*) as count FROM auth_sessions 
        WHERE account_id = ? AND is_active = 1 AND expires_at > ?
      `);
      const activeResult = activeStmt.get(accountId, now) as any;
      
      // 不同设备数量
      const devicesStmt = db.prepare(`
        SELECT COUNT(DISTINCT device_info) as count FROM auth_sessions 
        WHERE account_id = ? AND is_active = 1 AND expires_at > ?
      `);
      const devicesResult = devicesStmt.get(accountId, now) as any;
      
      // 最近活跃时间
      const recentStmt = db.prepare(`
        SELECT MAX(last_active_at) as recent FROM auth_sessions 
        WHERE account_id = ? AND is_active = 1
      `);
      const recentResult = recentStmt.get(accountId) as any;
      
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
  async findSuspiciousSessions(accountId: string): Promise<Session[]> {
    const db = await this.database;
    
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      // 查找一小时内从不同IP登录的会话
      const stmt = db.prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_id = ? 
          AND is_active = 1 
          AND expires_at > ?
          AND created_at > ?
          AND ip_address IN (
            SELECT ip_address FROM auth_sessions 
            WHERE account_id = ? 
              AND created_at > ?
            GROUP BY ip_address 
            HAVING COUNT(DISTINCT ip_address) > 1
          )
        ORDER BY created_at DESC
      `);
      
      const rows = stmt.all(accountId, now, oneHourAgo, accountId, oneHourAgo) as any[];
      return rows.map(row => Session.fromDatabase(row));
    } catch (error) {
      console.error('Failed to find suspicious sessions:', error);
      return [];
    }
  }
}
