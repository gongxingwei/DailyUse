import { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import { SessionLog } from "../../domain/aggregates/sessionLog";
import { ISessionLoggingRepository } from "../../domain/repositories/sessionLoggingRepository";

/**
 * SQLite SessionLogging 仓库实现
 */
export class SqliteSessionLoggingRepository
  implements ISessionLoggingRepository
{
  private db: Database | null = null;
  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<void> {
    if (!this.db) {
      this.db = await getDatabase();
    }
  }

  /**
   * 保存会话日志
   */
  async save(sessionLog: SessionLog): Promise<void> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return;
    }

    const data = sessionLog.toDatabaseFormat();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO session_logs (
        uuid, account_uuid, session_id, operation_type, device_info, ip_address,
        ip_country, ip_region, ip_city, ip_latitude, ip_longitude, ip_timezone, ip_isp,
        user_agent, login_time, logout_time, duration, risk_level, risk_factors,
        is_anomalous, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.uuid,
      data.account_uuid,
      data.session_uuid,
      data.operation_type,
      data.device_info,
      data.ip_address,
      data.ip_country,
      data.ip_region,
      data.ip_city,
      data.ip_latitude,
      data.ip_longitude,
      data.ip_timezone,
      data.ip_isp,
      data.user_agent,
      data.login_time,
      data.logout_time,
      data.duration,
      data.risk_level,
      data.risk_factors,
      data.is_anomalous,
      data.created_at,
      data.updated_at
    );
  }

  /**
   * 根据ID查找会话日志
   */
  async findById(uuid: string): Promise<SessionLog | null> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return null;
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs WHERE id = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    return SessionLog.fromDatabase(row);
  }

  /**
   * 根据账户ID查找会话日志
   */
  async findByAccountUuid(accountUuid: string): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE account_uuid = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 根据会话ID查找会话日志
   */
  async findBySessionId(sessionId: string): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE session_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(sessionId) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 根据操作类型查找会话日志
   */
  async findByOperationType(operationType: string): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE operation_type = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(operationType) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 查找异常会话日志
   */
  async findAnomalous(): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE is_anomalous = 1
      ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 根据风险等级查找会话日志
   */
  async findByRiskLevel(riskLevel: string): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE risk_level = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(riskLevel) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 根据时间范围查找会话日志
   */
  async findByTimeRange(startTime: Date, endTime: Date): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(startTime.getTime(), endTime.getTime()) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 根据账户ID和时间范围查找会话日志
   */
  async findByAccountUuidAndTimeRange(
    accountUuid: string,
    startTime: Date,
    endTime: Date
  ): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE account_uuid = ? AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(
      accountUuid,
      startTime.getTime(),
      endTime.getTime()
    ) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }

  /**
   * 删除会话日志
   */
  async delete(uuid: string): Promise<void> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return;
    }

    const stmt = this.db.prepare(`
      DELETE FROM session_logs WHERE id = ?
    `);

    stmt.run(uuid);
  }

  /**
   * 删除账户的所有会话日志
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return;
    }

    const stmt = this.db.prepare(`
      DELETE FROM session_logs WHERE account_uuid = ?
    `);

    stmt.run(accountUuid);
  }

  /**
   * 删除指定日期之前的会话日志
   */
  async deleteOlderThan(date: Date): Promise<number> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return 0;
    }

    const stmt = this.db.prepare(`
      DELETE FROM session_logs WHERE created_at < ?
    `);

    const result = stmt.run(date.getTime());
    return result.changes;
  }

  /**
   * 获取账户的登录统计
   */
  async getLoginStats(
    accountUuid: string,
    days: number = 30
  ): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueDevices: number;
    uniqueIPs: number;
  }> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueDevices: 0,
        uniqueIPs: 0,
      };
    }

    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_logins,
        COUNT(DISTINCT device_info) as unique_devices,
        COUNT(DISTINCT ip_address) as unique_ips,
        SUM(CASE WHEN operation_type = 'login' THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN operation_type = 'suspicious_activity' THEN 1 ELSE 0 END) as failed_logins
      FROM session_logs 
      WHERE account_uuid = ? AND created_at >= ?
    `);

    const result = stmt.get(accountUuid, startTime.getTime()) as any;

    return {
      totalLogins: result.total_logins || 0,
      successfulLogins: result.successful_logins || 0,
      failedLogins: result.failed_logins || 0,
      uniqueDevices: result.unique_devices || 0,
      uniqueIPs: result.unique_ips || 0,
    };
  }

  /**
   * 获取高风险登录记录
   */
  async findHighRiskLogins(days: number = 7): Promise<SessionLog[]> {
    await this.getDb();
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }

    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT * FROM session_logs 
      WHERE risk_level IN ('high', 'critical') 
        AND created_at >= ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(startTime.getTime()) as any[];
    return rows.map((row) => SessionLog.fromDatabase(row));
  }
}