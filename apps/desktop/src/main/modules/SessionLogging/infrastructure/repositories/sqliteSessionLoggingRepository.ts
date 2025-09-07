import { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import { OperationType, RiskLevel, OperationStatus } from "@common/modules/sessionLog/types/sessionLog";
import { ISessionLoggingRepository } from "../../domain/repositories/sessionLoggingRepository";
import { IPLocation } from "../../domain/valueObjects/ipLocation";
import { SessionLog } from "../../domain/aggregates/sessionLog";
/**
 * SQLite SessionLogging 仓库实现
 */
export class SqliteSessionLoggingRepository implements ISessionLoggingRepository {
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

    const row = this.mapSessionLogToRow(sessionLog);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO session_logs (
        uuid, account_uuid, session_uuid, operation_type, operation_status, device_info, ip_address,
        ip_country, ip_region, ip_city, ip_latitude, ip_longitude, ip_timezone, ip_isp,
        user_agent, login_time, logout_time, session_duration, risk_level,
         created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      row.account_uuid,
      row.session_uuid,
      row.operation_type,
      row.operation_status,
      row.device_info,
      row.ip_address,
      row.ip_country,
      row.ip_region,
      row.ip_city,
      row.ip_latitude,
      row.ip_longitude,
      row.ip_timezone,
      row.ip_isp,
      row.user_agent,
      row.login_time,
      row.logout_time,
      row.session_duration,
      row.risk_level,
      row.created_at,
      row.updated_at
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
      SELECT * FROM session_logs WHERE uuid = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    return this.mapRowToSessionLog(row);
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
      WHERE session_uuid = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(sessionId) as any[];
    return rows.map((row) => this.mapRowToSessionLog(row));
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
    return rows.map((row) => this.mapRowToSessionLog(row));
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
      DELETE FROM session_logs WHERE uuid = ?
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

  // ========================= 辅助方法（实体<->数据库行） =========================

  /**
   * SessionLog 实体转数据库行
   */
  private mapSessionLogToRow(sessionLog: SessionLog): any {
    const dto = sessionLog.toDTO();
    return {
      uuid: dto.uuid,
      account_uuid: dto.accountUuid,
      session_uuid: dto.sessionUuid,
      operation_type: dto.operationType,
      operation_status: dto.operationStatus,
      device_info: dto.deviceInfo,
      ip_address: dto.ipLocation.ipAddress,
      ip_country: dto.ipLocation.country,
      ip_region: dto.ipLocation.region,
      ip_city: dto.ipLocation.city,
      ip_latitude: dto.ipLocation.latitude,
      ip_longitude: dto.ipLocation.longitude,
      ip_timezone: dto.ipLocation.timezone,
      ip_isp: dto.ipLocation.isp,
      user_agent: dto.userAgent,
      login_time: dto.loginTime ? new Date(dto.loginTime).getTime() : null,
      logout_time: dto.logoutTime ? new Date(dto.logoutTime).getTime() : null,
      session_duration: dto.duration ?? null,
      risk_level: dto.riskLevel,
      created_at: new Date(dto.createdAt).getTime(),
      updated_at: new Date(dto.updatedAt).getTime(),
    };
  }

  /**
   * 数据库行转 SessionLog 实体
   */
  private mapRowToSessionLog(row: any): SessionLog {
    const ipLocation = new IPLocation({
      ipAddress: row.ip_address,
      country: row.ip_country,
      region: row.ip_region,
      city: row.ip_city,
      latitude: row.ip_latitude,
      longitude: row.ip_longitude,
      timezone: row.ip_timezone,
      isp: row.ip_isp
    });

    const sessionLog = new SessionLog({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      operationType: row.operation_type as OperationType,
      operationStatus: row.operation_status as OperationStatus,
      deviceInfo: row.device_info,
      ipLocation,
      userAgent: row.user_agent,
      sessionUuid: row.session_uuid
    });

    // 通过 set 方法同步其他属性
    sessionLog.loginTime = row.login_time ? new Date(row.login_time) : undefined;
    sessionLog.logoutTime = row.logout_time ? new Date(row.logout_time) : undefined;
    sessionLog.duration = row.session_duration;
    sessionLog.riskLevel = row.risk_level as RiskLevel;
    sessionLog.createdAt = new Date(row.created_at);
    sessionLog.updatedAt = new Date(row.updated_at);

    return sessionLog;
  }
}
