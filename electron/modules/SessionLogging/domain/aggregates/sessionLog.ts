import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { IPLocation } from "../valueObjects/ipLocation";
import { AuditTrail } from "../entities/auditTrail";

/**
 * 操作类型枚举
 */
export enum OperationType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPIRED = 'expired',
  FORCED_LOGOUT = 'forced_logout',
  SESSION_REFRESH = 'session_refresh',
  MFA_VERIFICATION = 'mfa_verification',
  PASSWORD_CHANGE = 'password_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

/**
 * 风险等级枚举
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 会话日志聚合根
 * 
 * 职责：
 * - 记录用户登录/登出行为
 * - 审计异常登录（如异地登录）
 * - 提供会话历史查询
 * - 通过AccountId弱关联账号模块，避免直接依赖
 */
export class SessionLog extends AggregateRoot {
  private _accountId: string; // 关联账号ID
  private _sessionId?: string; // 关联会话ID（可选）
  private _operationType: OperationType;
  private _deviceInfo: string;
  private _ipLocation: IPLocation;
  private _userAgent?: string;
  private _loginTime?: DateTime;
  private _logoutTime?: DateTime;
  private _duration?: number; // 会话持续时间（分钟）
  private _riskLevel: RiskLevel;
  private _riskFactors: string[]; // 风险因素列表
  private _isAnomalous: boolean; // 是否为异常会话
  private _auditTrails: Map<string, AuditTrail>; // 审计轨迹
  private _createdAt: DateTime;
  private _updatedAt: DateTime;

  constructor(
    id: string,
    accountId: string,
    operationType: OperationType,
    deviceInfo: string,
    ipLocation: IPLocation,
    userAgent?: string,
    sessionId?: string
  ) {
    super(id);
    this._accountId = accountId;
    this._sessionId = sessionId;
    this._operationType = operationType;
    this._deviceInfo = deviceInfo;
    this._ipLocation = ipLocation;
    this._userAgent = userAgent;
    this._riskLevel = RiskLevel.LOW;
    this._riskFactors = [];
    this._isAnomalous = false;
    this._auditTrails = new Map();
    this._createdAt = TimeUtils.now();
    this._updatedAt = TimeUtils.now();

    // 根据操作类型设置时间
    if (operationType === OperationType.LOGIN) {
      this._loginTime = this._createdAt;
    } else if (operationType === OperationType.LOGOUT || operationType === OperationType.EXPIRED) {
      this._logoutTime = this._createdAt;
    }

    // 自动进行风险评估
    this.assessRisk();
  }

  // Getters
  get accountId(): string {
    return this._accountId;
  }

  get sessionId(): string | undefined {
    return this._sessionId;
  }

  get operationType(): OperationType {
    return this._operationType;
  }

  get deviceInfo(): string {
    return this._deviceInfo;
  }

  get ipLocation(): IPLocation {
    return this._ipLocation;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get loginTime(): DateTime | undefined {
    return this._loginTime;
  }

  get logoutTime(): DateTime | undefined {
    return this._logoutTime;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get riskLevel(): RiskLevel {
    return this._riskLevel;
  }

  get riskFactors(): string[] {
    return [...this._riskFactors];
  }

  get isAnomalous(): boolean {
    return this._isAnomalous;
  }

  get auditTrails(): AuditTrail[] {
    return Array.from(this._auditTrails.values());
  }

  get createdAt(): DateTime {
    return this._createdAt;
  }

  get updatedAt(): DateTime {
    return this._updatedAt;
  }

  /**
   * 记录登出
   */
  recordLogout(logoutTime?: DateTime): void {
    if (this._operationType !== OperationType.LOGIN) {
      throw new Error('Can only record logout for login operations');
    }

    this._logoutTime = logoutTime || TimeUtils.now();
    this._updatedAt = this._logoutTime;

    // 计算会话持续时间
    if (this._loginTime) {
      const durationMs = this._logoutTime.getTime() - this._loginTime.getTime();
      this._duration = Math.floor(durationMs / (60 * 1000)); // 转换为分钟
    }

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'SessionLogoutRecorded',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId,
        sessionId: this._sessionId,
        duration: this._duration,
        timestamp: this._logoutTime 
      }
    });
  }

  /**
   * 标记为异常会话
   */
  markAsAnomalous(reason: string): void {
    this._isAnomalous = true;
    this._riskFactors.push(reason);
    this._updatedAt = TimeUtils.now();

    // 重新评估风险等级
    this.assessRisk();

    // 创建审计轨迹
    this.addAuditTrail('anomaly_detected', reason, RiskLevel.HIGH);

    this.addDomainEvent({
      aggregateId: this.id,
      eventType: 'AnomalousSessionDetected',
      occurredOn: new Date(),
      payload: { 
        accountId: this._accountId,
        sessionId: this._sessionId,
        reason: reason,
        riskLevel: this._riskLevel,
        timestamp: this._updatedAt 
      }
    });
  }

  /**
   * 添加风险因素
   */
  addRiskFactor(factor: string): void {
    if (!this._riskFactors.includes(factor)) {
      this._riskFactors.push(factor);
      this._updatedAt = TimeUtils.now();
      this.assessRisk();
    }
  }

  /**
   * 添加审计轨迹
   */
  addAuditTrail(operationType: string, description: string, riskLevel: RiskLevel): void {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const audit = new AuditTrail(
      auditId,
      this._accountId,
      operationType,
      description,
      riskLevel,
      this._ipLocation
    );

    this._auditTrails.set(auditId, audit);
    this._updatedAt = TimeUtils.now();

    // 如果是高风险操作，发出告警事件
    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'HighRiskActivityDetected',
        occurredOn: new Date(),
        payload: { 
          accountId: this._accountId,
          auditId: auditId,
          operationType: operationType,
          description: description,
          riskLevel: riskLevel,
          timestamp: this._updatedAt 
        }
      });
    }
  }

  /**
   * 检测异地登录
   */
  detectRemoteLocationLogin(previousLocations: IPLocation[]): boolean {
    // 检查是否是新的地理位置
    const isNewLocation = !previousLocations.some(location => 
      location.isSameRegion(this._ipLocation)
    );

    if (isNewLocation && previousLocations.length > 0) {
      this.markAsAnomalous('Login from new geographic location');
      this.addRiskFactor('remote_location_login');
      return true;
    }

    return false;
  }

  /**
   * 检测同时多设备登录
   */
  detectConcurrentDeviceLogin(activeDevices: string[]): boolean {
    const deviceCount = activeDevices.filter(device => device !== this._deviceInfo).length;
    
    if (deviceCount >= 3) { // 同时3个或更多设备
      this.markAsAnomalous('Multiple concurrent device logins detected');
      this.addRiskFactor('multiple_concurrent_devices');
      return true;
    }

    return false;
  }

  /**
   * 检测频繁登录尝试
   */
  detectFrequentLoginAttempts(recentAttempts: number, timeWindowMinutes: number = 10): boolean {
    if (recentAttempts >= 5) { // 10分钟内5次或更多尝试
      this.markAsAnomalous(`${recentAttempts} login attempts within ${timeWindowMinutes} minutes`);
      this.addRiskFactor('frequent_login_attempts');
      return true;
    }

    return false;
  }

  /**
   * 风险评估
   */
  private assessRisk(): void {
    let score = 0;

    // 基于风险因素计算分数
    this._riskFactors.forEach(factor => {
      switch (factor) {
        case 'remote_location_login':
          score += 30;
          break;
        case 'multiple_concurrent_devices':
          score += 25;
          break;
        case 'frequent_login_attempts':
          score += 40;
          break;
        case 'unusual_time_login':
          score += 15;
          break;
        case 'new_device':
          score += 20;
          break;
        case 'suspicious_user_agent':
          score += 10;
          break;
        default:
          score += 5;
      }
    });

    // 基于分数确定风险等级
    if (score >= 80) {
      this._riskLevel = RiskLevel.CRITICAL;
    } else if (score >= 50) {
      this._riskLevel = RiskLevel.HIGH;
    } else if (score >= 25) {
      this._riskLevel = RiskLevel.MEDIUM;
    } else {
      this._riskLevel = RiskLevel.LOW;
    }
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    id: string;
    accountId: string;
    sessionId?: string;
    operationType: OperationType;
    deviceInfo: string;
    ipLocation: any;
    userAgent?: string;
    loginTime?: string;
    logoutTime?: string;
    duration?: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
    isAnomalous: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      accountId: this._accountId,
      sessionId: this._sessionId,
      operationType: this._operationType,
      deviceInfo: this._deviceInfo,
      ipLocation: this._ipLocation.toDTO(),
      userAgent: this._userAgent,
      loginTime: this._loginTime?.toISOString(),
      logoutTime: this._logoutTime?.toISOString(),
      duration: this._duration,
      riskLevel: this._riskLevel,
      riskFactors: this._riskFactors,
      isAnomalous: this._isAnomalous,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }

  /**
   * 从数据库行创建 SessionLog 对象
   */
  static fromDatabase(row: {
    id: string;
    account_id: string;
    session_id?: string;
    operation_type: string;
    device_info: string;
    ip_address: string;
    ip_country?: string;
    ip_region?: string;
    ip_city?: string;
    ip_latitude?: number;
    ip_longitude?: number;
    ip_timezone?: string;
    ip_isp?: string;
    user_agent?: string;
    login_time?: number;
    logout_time?: number;
    duration?: number;
    risk_level: string;
    risk_factors?: string;
    is_anomalous: number;
    created_at: number;
    updated_at: number;
  }): SessionLog {
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

    const sessionLog = new SessionLog(
      row.account_id,
      row.operation_type as OperationType,
      row.device_info,
      ipLocation,
      row.user_agent
    );

    // 设置从数据库读取的属性
    (sessionLog as any)._id = row.id;
    (sessionLog as any)._sessionId = row.session_id;
    (sessionLog as any)._loginTime = row.login_time ? new Date(row.login_time) : undefined;
    (sessionLog as any)._logoutTime = row.logout_time ? new Date(row.logout_time) : undefined;
    (sessionLog as any)._duration = row.duration;
    (sessionLog as any)._riskLevel = row.risk_level as RiskLevel;
    (sessionLog as any)._riskFactors = row.risk_factors ? JSON.parse(row.risk_factors) : [];
    (sessionLog as any)._isAnomalous = Boolean(row.is_anomalous);
    (sessionLog as any)._createdAt = new Date(row.created_at);
    (sessionLog as any)._updatedAt = new Date(row.updated_at);

    return sessionLog;
  }

  /**
   * 转换为数据库格式
   */
  toDatabaseFormat(): {
    id: string;
    account_id: string;
    session_id?: string;
    operation_type: string;
    device_info: string;
    ip_address: string;
    ip_country?: string;
    ip_region?: string;
    ip_city?: string;
    ip_latitude?: number;
    ip_longitude?: number;
    ip_timezone?: string;
    ip_isp?: string;
    user_agent?: string;
    login_time?: number;
    logout_time?: number;
    duration?: number;
    risk_level: string;
    risk_factors?: string;
    is_anomalous: number;
    created_at: number;
    updated_at: number;
  } {
    return {
      id: this.id,
      account_id: this._accountId,
      session_id: this._sessionId,
      operation_type: this._operationType,
      device_info: this._deviceInfo,
      ip_address: this._ipLocation.ipAddress,
      ip_country: this._ipLocation.country,
      ip_region: this._ipLocation.region,
      ip_city: this._ipLocation.city,
      ip_latitude: this._ipLocation.latitude,
      ip_longitude: this._ipLocation.longitude,
      ip_timezone: this._ipLocation.timezone,
      ip_isp: this._ipLocation.isp,
      user_agent: this._userAgent,
      login_time: this._loginTime?.getTime(),
      logout_time: this._logoutTime?.getTime(),
      duration: this._duration,
      risk_level: this._riskLevel,
      risk_factors: this._riskFactors.length > 0 ? JSON.stringify(this._riskFactors) : undefined,
      is_anomalous: this._isAnomalous ? 1 : 0,
      created_at: this._createdAt.getTime(),
      updated_at: this._updatedAt.getTime()
    };
  }
}
