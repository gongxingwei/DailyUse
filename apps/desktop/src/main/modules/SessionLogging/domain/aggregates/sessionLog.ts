import { AggregateRoot } from "@dailyuse/utils";
import { IPLocation } from "../valueObjects/ipLocation";
import { AuditTrail } from "../entities/auditTrail";
import { ISessionLog, OperationStatus, OperationType, RiskLevel, SessionLogDTO } from "@common/modules/sessionLog/types/sessionLog";
import { isValid } from "date-fns";


/**
 * 会话日志聚合根
 * 
 * 职责：
 * - 记录用户登录/登出行为
 * - 审计异常登录（如异地登录）
 * - 提供会话历史查询
 * - 通过AccountUuid弱关联账号模块，避免直接依赖
 */
export class SessionLog extends AggregateRoot implements ISessionLog {
  private _accountUuid: string;
  private _sessionUuid?: string;
  private _operationType: OperationType;
  private _operationStatus: OperationStatus;
  private _deviceInfo: string;
  private _ipLocation: IPLocation;
  private _userAgent?: string;
  private _loginTime?: Date;
  private _logoutTime?: Date;
  private _duration?: number;
  private _riskLevel: RiskLevel = RiskLevel.LOW;
  private _riskFactors: string[] = [];
  private _isAnomalous: boolean = false;
  private _auditTrails: Map<string, AuditTrail> = new Map();
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    operationType: OperationType;
    operationStatus: OperationStatus;
    deviceInfo: string;
    ipLocation: IPLocation;
    userAgent?: string;
    sessionUuid?: string;
  }) {
    super(params.uuid ?? SessionLog.generateUUID());
    this._accountUuid = params.accountUuid;
    this._sessionUuid = params.sessionUuid;
    this._operationType = params.operationType;
    this._operationStatus = params.operationStatus;
    this._deviceInfo = params.deviceInfo;
    this._ipLocation = params.ipLocation;
    this._userAgent = params.userAgent;
    this._createdAt = new Date();
    this._updatedAt = new Date();

    // 自动设置时间
    if (params.operationType === OperationType.LOGIN) {
      this._loginTime = this._createdAt;
    } else if (
      params.operationType === OperationType.LOGOUT ||
      params.operationType === OperationType.EXPIRED
    ) {
      this._logoutTime = this._createdAt;
    }
    this.assessRisk();
  }

  // Getters
  get accountUuid(): string {
    return this._accountUuid;
  }

  get sessionUuid(): string | undefined {
    return this._sessionUuid;
  }

  get operationType(): OperationType {
    return this._operationType;
  }

  get operationStatus(): OperationStatus {
    return this._operationStatus;
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

  get loginTime(): Date | undefined {
    return this._loginTime;
  }

  get logoutTime(): Date | undefined {
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set duration(value: number | undefined) {
    this._duration = value;
    this._updatedAt = new Date();
  }

  set riskLevel(value: RiskLevel) {
    this._riskLevel = value;
    this._updatedAt = new Date();
  }

  set auditTrails(trails: AuditTrail[]) {
    this._auditTrails = new Map(trails.map(trail => [trail.uuid, trail]));
    this._updatedAt = new Date();
  }

  set createdAt(value: Date) {
    this._createdAt = value;
  }

  set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  // Setters for business attributes
  set loginTime(value: Date | undefined) {
    this._loginTime = value;
    this._updatedAt = new Date();
  }

  set logoutTime(value: Date | undefined) {
    this._logoutTime = value;
    this._updatedAt = new Date();
    if (this._loginTime && this._logoutTime) {
      const durationMs = this._logoutTime.getTime() - this._loginTime.getTime();
      this._duration = Math.floor(durationMs / (60 * 1000));
    }
  }

  set riskFactors(factors: string[]) {
    this._riskFactors = factors;
    this._updatedAt = new Date();
    this.assessRisk();
  }

  set isAnomalous(value: boolean) {
    this._isAnomalous = value;
    this._updatedAt = new Date();
  }

  /**
   * 记录登出
   */
  recordLogout(logoutTime?: Date): void {
    if (this._operationType !== OperationType.LOGIN) {
      throw new Error('Can only record logout for login operations');
    }

    this.logoutTime = logoutTime || new Date();

    // 计算会话持续时间已在 setter 中处理

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'SessionLogoutRecorded',
      occurredOn: new Date(),
      payload: { 
        accountUuid: this._accountUuid,
        sessionUuid: this._sessionUuid,
        duration: this._duration,
        timestamp: this._logoutTime 
      }
    });
  }

  /**
   * 标记为异常会话
   */
  markAsAnomalous(reason: string): void {
    this.isAnomalous = true;
    this._riskFactors.push(reason);
    this._updatedAt = new Date();

    // 重新评估风险等级
    this.assessRisk();

    // 创建审计轨迹
    this.addAuditTrail(OperationType.SUSPICIOUS_ACTIVITY, reason, RiskLevel.HIGH);

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'AnomalousSessionDetected',
      occurredOn: new Date(),
      payload: { 
        accountUuid: this._accountUuid,
        sessionUuid: this._sessionUuid,
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
      this._updatedAt = new Date();
      this.assessRisk();
    }
  }

  /**
   * 添加审计轨迹
   */
  addAuditTrail(operationType: OperationType, description: string, riskLevel: RiskLevel): void {

    const audit = new AuditTrail({
      accountUuid: this._accountUuid,
      operationType,
      description,
      riskLevel,
      ipLocation: this._ipLocation
    });

    this._auditTrails.set(audit.uuid, audit);
    this._updatedAt = new Date();

    // 如果是高风险操作，发出告警事件
    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'HighRiskActivityDetected',
        occurredOn: new Date(),
        payload: { 
          accountUuid: this._accountUuid,
          auditUuid: audit.uuid,
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
    
    if (deviceCount >= 3) {
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
    if (recentAttempts >= 5) {
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
  toDTO(): SessionLogDTO{
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      sessionUuid: this._sessionUuid,
      operationType: this._operationType || '',
      operationStatus: this._operationStatus || '',
      deviceInfo: this._deviceInfo || '',
      ipLocation: this._ipLocation.toDTO() || {},
      userAgent: this._userAgent || '',
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
   * 从DTO转换为实体
   */
  static fromDTO(dto: SessionLogDTO): SessionLog {
    const sessionLog = new SessionLog({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      sessionUuid: dto.sessionUuid,
      operationType: dto.operationType,
      operationStatus: dto.operationStatus,
      ipLocation: IPLocation.fromDTO(dto.ipLocation),
      userAgent: dto.userAgent,
      deviceInfo: dto.deviceInfo
    });
    sessionLog.loginTime = dto.loginTime && isValid(dto.loginTime) ? new Date(dto.loginTime) : undefined;
sessionLog.logoutTime = dto.logoutTime && isValid(dto.logoutTime) ? new Date(dto.logoutTime) : undefined;
    sessionLog.riskFactors = dto.riskFactors || [];
    sessionLog.isAnomalous = dto.isAnomalous || false;
    sessionLog.duration = dto.duration;
    sessionLog.riskLevel = dto.riskLevel;
    sessionLog.createdAt = new Date(dto.createdAt);
    sessionLog.updatedAt = new Date(dto.updatedAt);
    return sessionLog;
  }
}
