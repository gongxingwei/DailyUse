import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { IPLocation } from "../valueObjects/ipLocation";
import { RiskLevel } from "../aggregates/sessionLog";

/**
 * 审计轨迹实体
 * 记录系统中的重要操作和安全事件
 */
export class AuditTrail {
  private _id: string;
  private _accountId: string;
  private _operationType: string;
  private _description: string;
  private _riskLevel: RiskLevel;
  private _ipLocation: IPLocation;
  private _userAgent?: string;
  private _metadata: Record<string, any>;
  private _timestamp: DateTime;
  private _isAlertTriggered: boolean;
  private _alertLevel?: 'info' | 'warning' | 'error' | 'critical';

  constructor(
    id: string,
    accountId: string,
    operationType: string,
    description: string,
    riskLevel: RiskLevel,
    ipLocation: IPLocation,
    userAgent?: string,
    metadata: Record<string, any> = {}
  ) {
    this._id = id;
    this._accountId = accountId;
    this._operationType = operationType;
    this._description = description;
    this._riskLevel = riskLevel;
    this._ipLocation = ipLocation;
    this._userAgent = userAgent;
    this._metadata = { ...metadata };
    this._timestamp = TimeUtils.now();
    this._isAlertTriggered = false;

    // 根据风险等级自动确定告警级别
    this.determineAlertLevel();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get operationType(): string {
    return this._operationType;
  }

  get description(): string {
    return this._description;
  }

  get riskLevel(): RiskLevel {
    return this._riskLevel;
  }

  get ipLocation(): IPLocation {
    return this._ipLocation;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  get timestamp(): DateTime {
    return this._timestamp;
  }

  get isAlertTriggered(): boolean {
    return this._isAlertTriggered;
  }

  get alertLevel(): 'info' | 'warning' | 'error' | 'critical' | undefined {
    return this._alertLevel;
  }

  /**
   * 添加元数据
   */
  addMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }

  /**
   * 批量添加元数据
   */
  addMetadataBatch(data: Record<string, any>): void {
    Object.assign(this._metadata, data);
  }

  /**
   * 触发告警
   */
  triggerAlert(alertLevel?: 'info' | 'warning' | 'error' | 'critical'): void {
    this._isAlertTriggered = true;
    if (alertLevel) {
      this._alertLevel = alertLevel;
    }
    
    this.addMetadata('alertTriggeredAt', TimeUtils.now().toISOString());
  }

  /**
   * 检查是否需要告警
   */
  shouldTriggerAlert(): boolean {
    // 基于风险等级和操作类型判断是否需要告警
    if (this._riskLevel === RiskLevel.HIGH || this._riskLevel === RiskLevel.CRITICAL) {
      return true;
    }

    // 特定操作类型总是需要告警
    const alertOperations = [
      'password_change',
      'mfa_disable',
      'account_lockout',
      'suspicious_activity',
      'data_breach_attempt',
      'privilege_escalation'
    ];

    return alertOperations.includes(this._operationType);
  }

  /**
   * 获取告警消息
   */
  getAlertMessage(): string {
    const location = this._ipLocation.getLocationDescription();
    const time = TimeUtils.format(this._timestamp, 'YYYY-MM-DD HH:mm:ss');
    
    return `[${this._riskLevel.toUpperCase()}] ${this._description} - Account: ${this._accountId}, Location: ${location}, Time: ${time}`;
  }

  /**
   * 检查是否为安全相关事件
   */
  isSecurityEvent(): boolean {
    const securityOperations = [
      'login_failed',
      'password_change',
      'mfa_verification',
      'account_locked',
      'suspicious_activity',
      'data_access_violation',
      'privilege_escalation',
      'brute_force_attempt'
    ];

    return securityOperations.includes(this._operationType) ||
           this._riskLevel === RiskLevel.HIGH ||
           this._riskLevel === RiskLevel.CRITICAL;
  }

  /**
   * 检查是否为合规相关事件
   */
  isComplianceEvent(): boolean {
    const complianceOperations = [
      'data_export',
      'data_deletion',
      'permission_change',
      'audit_log_access',
      'personal_data_access',
      'gdpr_request'
    ];

    return complianceOperations.includes(this._operationType);
  }

  /**
   * 获取事件严重性评分（1-10）
   */
  getSeverityScore(): number {
    let score = 1;

    // 基于风险等级
    switch (this._riskLevel) {
      case RiskLevel.CRITICAL:
        score += 7;
        break;
      case RiskLevel.HIGH:
        score += 5;
        break;
      case RiskLevel.MEDIUM:
        score += 3;
        break;
      case RiskLevel.LOW:
        score += 1;
        break;
    }

    // 基于操作类型
    if (this.isSecurityEvent()) {
      score += 2;
    }

    // 基于地理位置
    if (this._ipLocation.isSuspiciousLocation()) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * 确定告警级别
   */
  private determineAlertLevel(): void {
    switch (this._riskLevel) {
      case RiskLevel.CRITICAL:
        this._alertLevel = 'critical';
        break;
      case RiskLevel.HIGH:
        this._alertLevel = 'error';
        break;
      case RiskLevel.MEDIUM:
        this._alertLevel = 'warning';
        break;
      case RiskLevel.LOW:
        this._alertLevel = 'info';
        break;
    }
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    id: string;
    accountId: string;
    operationType: string;
    description: string;
    riskLevel: RiskLevel;
    ipLocation: any;
    userAgent?: string;
    metadata: Record<string, any>;
    timestamp: string;
    isAlertTriggered: boolean;
    alertLevel?: string;
    severityScore: number;
    isSecurityEvent: boolean;
    isComplianceEvent: boolean;
  } {
    return {
      id: this._id,
      accountId: this._accountId,
      operationType: this._operationType,
      description: this._description,
      riskLevel: this._riskLevel,
      ipLocation: this._ipLocation.toDTO(),
      userAgent: this._userAgent,
      metadata: this._metadata,
      timestamp: this._timestamp.toISOString(),
      isAlertTriggered: this._isAlertTriggered,
      alertLevel: this._alertLevel,
      severityScore: this.getSeverityScore(),
      isSecurityEvent: this.isSecurityEvent(),
      isComplianceEvent: this.isComplianceEvent()
    };
  }

  /**
   * 从数据库行创建 AuditTrail 对象
   */
  static fromDatabase(row: {
    id: string;
    account_id: string;
    session_log_id?: string;
    operation_type: string;
    description: string;
    risk_level: string;
    ip_address: string;
    ip_country?: string;
    ip_region?: string;
    ip_city?: string;
    ip_latitude?: number;
    ip_longitude?: number;
    ip_timezone?: string;
    ip_isp?: string;
    user_agent?: string;
    metadata?: string;
    is_alert_triggered: number;
    alert_level?: string;
    timestamp: number;
  }): AuditTrail {
    const ipLocation = new IPLocation(
      row.ip_address,
      row.ip_country || 'Unknown',
      row.ip_region || 'Unknown',
      row.ip_city || 'Unknown',
      row.ip_latitude,
      row.ip_longitude,
      row.ip_timezone,
      row.ip_isp
    );

    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    
    const auditTrail = new AuditTrail(
      row.id,
      row.account_id,
      row.operation_type,
      row.description,
      row.risk_level as RiskLevel,
      ipLocation,
      row.user_agent,
      metadata
    );

    // 设置从数据库读取的属性
    (auditTrail as any)._isAlertTriggered = Boolean(row.is_alert_triggered);
    (auditTrail as any)._alertLevel = row.alert_level as any;
    (auditTrail as any)._timestamp = new Date(row.timestamp);

    return auditTrail;
  }

  /**
   * 转换为数据库格式
   */
  toDatabaseFormat(): {
    id: string;
    account_id: string;
    session_log_id?: string;
    operation_type: string;
    description: string;
    risk_level: string;
    ip_address: string;
    ip_country?: string;
    ip_region?: string;
    ip_city?: string;
    ip_latitude?: number;
    ip_longitude?: number;
    ip_timezone?: string;
    ip_isp?: string;
    user_agent?: string;
    metadata?: string;
    is_alert_triggered: number;
    alert_level?: string;
    timestamp: number;
  } {
    return {
      id: this._id,
      account_id: this._accountId,
      session_log_id: undefined, // 需要在保存时设置关联的session_log_id
      operation_type: this._operationType,
      description: this._description,
      risk_level: this._riskLevel,
      ip_address: this._ipLocation.ipAddress,
      ip_country: this._ipLocation.country,
      ip_region: this._ipLocation.region,
      ip_city: this._ipLocation.city,
      ip_latitude: this._ipLocation.latitude,
      ip_longitude: this._ipLocation.longitude,
      ip_timezone: this._ipLocation.timezone,
      ip_isp: this._ipLocation.isp,
      user_agent: this._userAgent,
      metadata: Object.keys(this._metadata).length > 0 ? JSON.stringify(this._metadata) : undefined,
      is_alert_triggered: this._isAlertTriggered ? 1 : 0,
      alert_level: this._alertLevel,
      timestamp: this._timestamp.getTime()
    };
  }
}
