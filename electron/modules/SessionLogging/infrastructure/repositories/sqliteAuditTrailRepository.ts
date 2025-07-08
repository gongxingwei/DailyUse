import { Database } from 'better-sqlite3';
import { AuditTrail } from '../../domain/entities/auditTrail';
import { IAuditTrailRepository } from '../../domain/repositories/sessionLoggingRepository';

/**
 * SQLite AuditTrail 仓库实现
 */
export class SqliteAuditTrailRepository implements IAuditTrailRepository {
  constructor(private readonly db: Database) {}

  /**
   * 保存审计轨迹
   */
  async save(auditTrail: AuditTrail): Promise<void> {
    const data = auditTrail.toDatabaseFormat();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO audit_trails (
        id, account_id, session_log_id, operation_type, description, risk_level,
        ip_address, ip_country, ip_region, ip_city, ip_latitude, ip_longitude,
        ip_timezone, ip_isp, user_agent, metadata, is_alert_triggered, alert_level, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.account_id,
      data.session_log_id,
      data.operation_type,
      data.description,
      data.risk_level,
      data.ip_address,
      data.ip_country,
      data.ip_region,
      data.ip_city,
      data.ip_latitude,
      data.ip_longitude,
      data.ip_timezone,
      data.ip_isp,
      data.user_agent,
      data.metadata,
      data.is_alert_triggered,
      data.alert_level,
      data.timestamp
    );
  }

  /**
   * 保存审计轨迹并关联会话日志
   */
  async saveWithSessionLog(auditTrail: AuditTrail, sessionLogId: string): Promise<void> {
    const data = auditTrail.toDatabaseFormat();
    // 设置关联的session_log_id
    data.session_log_id = sessionLogId;
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO audit_trails (
        id, account_id, session_log_id, operation_type, description, risk_level,
        ip_address, ip_country, ip_region, ip_city, ip_latitude, ip_longitude,
        ip_timezone, ip_isp, user_agent, metadata, is_alert_triggered, alert_level, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.account_id,
      data.session_log_id,
      data.operation_type,
      data.description,
      data.risk_level,
      data.ip_address,
      data.ip_country,
      data.ip_region,
      data.ip_city,
      data.ip_latitude,
      data.ip_longitude,
      data.ip_timezone,
      data.ip_isp,
      data.user_agent,
      data.metadata,
      data.is_alert_triggered,
      data.alert_level,
      data.timestamp
    );
  }

  /**
   * 根据ID查找审计轨迹
   */
  async findById(id: string): Promise<AuditTrail | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return AuditTrail.fromDatabase(row);
  }

  /**
   * 根据账户ID查找审计轨迹
   */
  async findByAccountId(accountId: string): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE account_id = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(accountId) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 根据会话日志ID查找审计轨迹
   */
  async findBySessionLogId(sessionLogId: string): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE session_log_id = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(sessionLogId) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 根据操作类型查找审计轨迹
   */
  async findByOperationType(operationType: string): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE operation_type = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(operationType) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 根据风险等级查找审计轨迹
   */
  async findByRiskLevel(riskLevel: string): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE risk_level = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(riskLevel) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 查找触发告警的审计轨迹
   */
  async findAlertsTriggered(): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE is_alert_triggered = 1
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 根据时间范围查找审计轨迹
   */
  async findByTimeRange(startTime: Date, endTime: Date): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(startTime.getTime(), endTime.getTime()) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 根据账户ID和时间范围查找审计轨迹
   */
  async findByAccountIdAndTimeRange(accountId: string, startTime: Date, endTime: Date): Promise<AuditTrail[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE account_id = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(accountId, startTime.getTime(), endTime.getTime()) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 删除审计轨迹
   */
  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM audit_trails WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * 删除账户的所有审计轨迹
   */
  async deleteByAccountId(accountId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM audit_trails WHERE account_id = ?
    `);

    stmt.run(accountId);
  }

  /**
   * 删除会话日志关联的审计轨迹
   */
  async deleteBySessionLogId(sessionLogId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM audit_trails WHERE session_log_id = ?
    `);

    stmt.run(sessionLogId);
  }

  /**
   * 删除指定日期之前的审计轨迹
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM audit_trails WHERE timestamp < ?
    `);

    const result = stmt.run(date.getTime());
    return result.changes;
  }

  /**
   * 获取安全事件统计
   */
  async getSecurityStats(days: number = 30): Promise<{
    totalEvents: number;
    criticalEvents: number;
    highRiskEvents: number;
    alertsTriggered: number;
    uniqueAccounts: number;
  }> {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT account_id) as unique_accounts,
        SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical_events,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_events,
        SUM(CASE WHEN is_alert_triggered = 1 THEN 1 ELSE 0 END) as alerts_triggered
      FROM audit_trails 
      WHERE timestamp >= ?
    `);

    const result = stmt.get(startTime.getTime()) as any;
    
    return {
      totalEvents: result.total_events || 0,
      criticalEvents: result.critical_events || 0,
      highRiskEvents: result.high_risk_events || 0,
      alertsTriggered: result.alerts_triggered || 0,
      uniqueAccounts: result.unique_accounts || 0
    };
  }

  /**
   * 获取账户的安全事件
   */
  async findSecurityEventsByAccount(accountId: string, days: number = 30): Promise<AuditTrail[]> {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE account_id = ? 
        AND timestamp >= ? 
        AND risk_level IN ('high', 'critical')
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(accountId, startTime.getTime()) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }

  /**
   * 查找近期关键告警
   */
  async findRecentCriticalAlerts(hours: number = 24): Promise<AuditTrail[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT * FROM audit_trails 
      WHERE alert_level = 'critical' 
        AND is_alert_triggered = 1
        AND timestamp >= ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(startTime.getTime()) as any[];
    return rows.map(row => AuditTrail.fromDatabase(row));
  }
}
