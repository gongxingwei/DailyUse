import { SessionLog } from "../aggregates/sessionLog";
import { AuditTrail } from "../entities/auditTrail";

/**
 * 会话日志存储库接口
 */
export interface ISessionLoggingRepository {
  save(sessionLog: SessionLog): Promise<void>;
  findById(id: string): Promise<SessionLog | null>;
  findByAccountId(accountId: string): Promise<SessionLog[]>;
  findBySessionId(sessionId: string): Promise<SessionLog[]>;
  findByOperationType(operationType: string): Promise<SessionLog[]>;
  findAnomalous(): Promise<SessionLog[]>;
  findByRiskLevel(riskLevel: string): Promise<SessionLog[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<SessionLog[]>;
  findByAccountIdAndTimeRange(accountId: string, startTime: Date, endTime: Date): Promise<SessionLog[]>;
  delete(id: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}

/**
 * 审计轨迹存储库接口
 */
export interface IAuditTrailRepository {
  save(auditTrail: AuditTrail): Promise<void>;
  findById(id: string): Promise<AuditTrail | null>;
  findByAccountId(accountId: string): Promise<AuditTrail[]>;
  findBySessionLogId(sessionLogId: string): Promise<AuditTrail[]>;
  findByOperationType(operationType: string): Promise<AuditTrail[]>;
  findByRiskLevel(riskLevel: string): Promise<AuditTrail[]>;
  findAlertsTriggered(): Promise<AuditTrail[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<AuditTrail[]>;
  findByAccountIdAndTimeRange(accountId: string, startTime: Date, endTime: Date): Promise<AuditTrail[]>;
  delete(id: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  deleteBySessionLogId(sessionLogId: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}
