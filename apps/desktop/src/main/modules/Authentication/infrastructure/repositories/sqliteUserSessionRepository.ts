import type { Database } from 'better-sqlite3';
import { Session } from '../../domain/entities/session';
import { ISessionRepository } from '../../domain/repositories/authenticationRepository';
import { getDatabase } from '../../../../shared/database/index';

/**
 * SQLite 用户会话存储库实现
 * 负责认证会话数据的持久化和查询
 */

/**
 * 统一的 SQLite 会话存储库实现
 * 合并原有 UserSession/Session 相关逻辑，字段以 superset 方式处理
 */
export class SqliteSessionRepository implements ISessionRepository {
  private database: Promise<Database>;

  constructor() {
    this.database = getDatabase();
  }

  /**
   * 保存会话
   */
  async save(session: Session): Promise<void> {
    const db = await this.database;
    try {
      const data = session.toDTO();
      console.log('Saving session data:', data);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO auth_sessions (
          uuid, account_uuid, session_token, device_info, ip_address, user_agent, location_info, created_at, last_active_at, expires_at, is_active, terminated_at, termination_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.uuid,
        data.accountUuid,
        data.token || null,
        data.deviceInfo,
        data.ipAddress,
        data.userAgent || null,
        null, // location_info
        data.createdAt,
        data.lastActiveAt,
        data.expiresAt,
        data.isActive ? 1 : 0,
        data.terminatedAt || null,
        data.terminationReason || null,
      );
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error(`Failed to save session: ${error}`);
    }
  }

  /**
   * 根据会话ID查找会话
   */
  async findById(sessionUuid: string): Promise<Session | null> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`SELECT * FROM auth_sessions WHERE uuid = ?`);
      const row = stmt.get(sessionUuid) as any;
      if (!row) return null;
      return this.mapRowToSession(row);
    } catch (error) {
      console.error('Failed to find session by uuid:', error);
      return null;
    }
  }

  /**
   * 根据账户ID查找所有会话
   */
  async findByAccountUuid(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const stmt = db.prepare(
        `SELECT * FROM auth_sessions WHERE account_uuid = ? ORDER BY last_active_at DESC`,
      );
      const rows = stmt.all(accountUuid) as any[];
      return Promise.all(rows.map(async (row) => await this.mapRowToSession(row)));
    } catch (error) {
      console.error('Failed to find sessions by account uuid:', error);
      return [];
    }
  }

  /**
   * 根据账户ID查找活跃会话
   */
  async findActiveByAccountUuid(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const now = Date.now();
      const stmt = db.prepare(
        `SELECT * FROM auth_sessions WHERE account_uuid = ? AND is_active = 1 AND expires_at > ? ORDER BY last_active_at DESC`,
      );
      const rows = stmt.all(accountUuid, now) as any[];
      return Promise.all(rows.map(async (row) => await this.mapRowToSession(row)));
    } catch (error) {
      console.error('Failed to find active sessions by account uuid:', error);
      return [];
    }
  }

  /**
   * 删除会话
   */
  async delete(sessionUuid: string): Promise<void> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`DELETE FROM auth_sessions WHERE uuid = ?`);
      stmt.run(sessionUuid);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error(`Failed to delete session: ${error}`);
    }
  }

  /**
   * 删除账户的所有会话
   */
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

  /**
   * 删除过期的会话
   */
  async deleteExpiredSessions(): Promise<number> {
    const db = await this.database;
    try {
      const now = Date.now();
      const stmt = db.prepare(
        `DELETE FROM auth_sessions WHERE expires_at <= ? OR (is_active = 0 AND last_active_at <= ?)`,
      );
      const result = stmt.run(now, now - 7 * 24 * 60 * 60 * 1000);
      return result.changes;
    } catch (error) {
      console.error('Failed to delete expired sessions:', error);
      return 0;
    }
  }

  /**
   * 更新会话的最后活跃时间
   */
  async updateLastActiveTime(sessionUuid: string, lastActiveAt: Date): Promise<void> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`UPDATE auth_sessions SET last_active_at = ? WHERE uuid = ?`);
      stmt.run(lastActiveAt.getTime(), sessionUuid);
    } catch (error) {
      console.error('Failed to update last active time:', error);
      throw new Error(`Failed to update last active time: ${error}`);
    }
  }

  /**
   * 终止会话（设置为非活跃状态）
   */
  async terminateSession(sessionUuid: string): Promise<void> {
    const db = await this.database;
    try {
      const stmt = db.prepare(`UPDATE auth_sessions SET is_active = 0 WHERE uuid = ?`);
      stmt.run(sessionUuid);
    } catch (error) {
      console.error('Failed to terminate session:', error);
      throw new Error(`Failed to terminate session: ${error}`);
    }
  }

  /**
   * 终止账户的所有其他会话（除了指定的会话）
   */
  async terminateOtherSessions(accountUuid: string, keepSessionId: string): Promise<number> {
    const db = await this.database;
    try {
      const stmt = db.prepare(
        `UPDATE auth_sessions SET is_active = 0, last_active_at = ? WHERE account_uuid = ? AND uuid != ? AND is_active = 1`,
      );
      const result = stmt.run(Date.now(), accountUuid, keepSessionId);
      return result.changes;
    } catch (error) {
      console.error('Failed to terminate other sessions:', error);
      return 0;
    }
  }

  /**
   * 获取账户的活跃会话数量
   */
  async countActiveSessionsByAccountUuid(accountUuid: string): Promise<number> {
    const db = await this.database;
    try {
      const now = Date.now();
      const stmt = db.prepare(
        `SELECT COUNT(*) as count FROM auth_sessions WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?`,
      );
      const result = stmt.get(accountUuid, now) as any;
      return result.count;
    } catch (error) {
      console.error('Failed to count active sessions:', error);
      return 0;
    }
  }

  // 批量更新活跃时间
  async batchUpdateLastActive(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return;
    const db = await this.database;
    try {
      const now = Date.now();
      const placeholders = sessionIds.map(() => '?').join(',');
      const stmt = db.prepare(
        `UPDATE auth_sessions SET last_active_at = ? WHERE uuid IN (${placeholders})`,
      );
      stmt.run(now, ...sessionIds);
    } catch (error) {
      console.error('Failed to batch update last active:', error);
      throw new Error(`Failed to batch update last active: ${error}`);
    }
  }

  // 获取活跃会话统计
  async getActiveSessionStats(
    accountUuid: string,
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    devicesCount: number;
    recentActivity: Date | null;
  }> {
    const db = await this.database;
    try {
      const now = Date.now();
      const totalStmt = db.prepare(
        `SELECT COUNT(*) as count FROM auth_sessions WHERE account_uuid = ?`,
      );
      const totalResult = totalStmt.get(accountUuid) as any;
      const activeStmt = db.prepare(
        `SELECT COUNT(*) as count FROM auth_sessions WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?`,
      );
      const activeResult = activeStmt.get(accountUuid, now) as any;
      const devicesStmt = db.prepare(
        `SELECT COUNT(DISTINCT device_info) as count FROM auth_sessions WHERE account_uuid = ? AND is_active = 1 AND expires_at > ?`,
      );
      const devicesResult = devicesStmt.get(accountUuid, now) as any;
      const recentStmt = db.prepare(
        `SELECT MAX(last_active_at) as recent FROM auth_sessions WHERE account_uuid = ? AND is_active = 1`,
      );
      const recentResult = recentStmt.get(accountUuid) as any;
      return {
        totalSessions: totalResult.count,
        activeSessions: activeResult.count,
        devicesCount: devicesResult.count,
        recentActivity: recentResult.recent ? new Date(recentResult.recent) : null,
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return { totalSessions: 0, activeSessions: 0, devicesCount: 0, recentActivity: null };
    }
  }

  // 获取可疑会话
  async findSuspiciousSessions(accountUuid: string): Promise<Session[]> {
    const db = await this.database;
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const stmt = db.prepare(
        `SELECT * FROM auth_sessions WHERE account_uuid = ? AND is_active = 1 AND expires_at > ? AND created_at > ? AND ip_address IN (SELECT ip_address FROM auth_sessions WHERE account_uuid = ? AND created_at > ? GROUP BY ip_address HAVING COUNT(DISTINCT ip_address) > 1) ORDER BY created_at DESC`,
      );
      const rows = stmt.all(accountUuid, now, oneHourAgo, accountUuid, oneHourAgo) as any[];
      return Promise.all(rows.map(async (row) => await this.mapRowToSession(row)));
    } catch (error) {
      console.error('Failed to find suspicious sessions:', error);
      return [];
    }
  }

  // 行转 Session
  private async mapRowToSession(row: any): Promise<Session> {
    return Session.fromDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      token: row.session_token || row.token,
      deviceInfo: row.device_info,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
      expiresAt: row.expires_at,
      isActive: row.is_active === 1,
      terminatedAt: row.terminated_at,
      terminationReason: row.termination_reason,
    });
  }
}
