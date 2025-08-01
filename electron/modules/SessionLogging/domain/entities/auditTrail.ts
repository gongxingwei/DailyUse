import { IPLocation } from "../valueObjects/ipLocation";
import { Entity } from "@/shared/domain/entity";
import { IAuditTrail, OperationType, RiskLevel } from "@common/modules/sessionLog/types/sessionLog";
/**
 * 审计轨迹实体
 * 记录系统中的重要操作和安全事件
 */
export class AuditTrail extends Entity implements IAuditTrail {
  private _accountUuUuid: string;
  private _operationType: OperationType;
  private _description: string;
  private _riskLevel: RiskLevel;
  private _ipLocation: IPLocation;
  private _userAgent?: string;
  private _metadata: Record<string, any>;
  private _timestamp: Date;
  private _isAlertTriggered: boolean;
  private _alertLevel?: 'info' | 'warning' | 'error' | 'critical';

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    operationType: OperationType;
    description: string;
    riskLevel: RiskLevel;
    ipLocation: IPLocation;
    userAgent?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
    isAlertTriggered?: boolean;
    alertLevel?: 'info' | 'warning' | 'error' | 'critical';
  }) {
    super(params.uuid || AuditTrail.generateId());
    this._accountUuUuid = params.accountUuid;
    this._operationType = params.operationType;
    this._description = params.description;
    this._riskLevel = params.riskLevel;
    this._ipLocation = params.ipLocation;
    this._userAgent = params.userAgent;
    this._metadata = { ...(params.metadata ?? {}) };
    this._timestamp = params.timestamp ?? new Date();
    this._isAlertTriggered = params.isAlertTriggered ?? false;
    this._alertLevel = params.alertLevel ?? this.determineAlertLevel();
  }

  // Getters
  get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuUuid;
  }

  get operationType(): OperationType {
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

  get timestamp(): Date {
    return this._timestamp;
  }

  get isAlertTriggered(): boolean {
    return this._isAlertTriggered;
  }

  get alertLevel(): 'info' | 'warning' | 'error' | 'critical' | undefined {
    return this._alertLevel;
  }

  // Setters
  set description(value: string) {
    this._description = value;
  }

  set riskLevel(value: RiskLevel) {
    this._riskLevel = value;
    this._alertLevel = this.determineAlertLevel();
  }

  set ipLocation(value: IPLocation) {
    this._ipLocation = value;
  }

  set userAgent(value: string | undefined) {
    this._userAgent = value;
  }

  set metadata(value: Record<string, any>) {
    this._metadata = { ...value };
  }

  set timestamp(value: Date) {
    this._timestamp = value;
  }

  set isAlertTriggered(value: boolean) {
    this._isAlertTriggered = value;
  }

  set alertLevel(value: 'info' | 'warning' | 'error' | 'critical' | undefined) {
    this._alertLevel = value;
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
    this.addMetadata('alertTriggeredAt', new Date().toISOString());
  }

  /**
   * 确定告警级别
   */
  private determineAlertLevel(): 'info' | 'warning' | 'error' | 'critical' {
    switch (this._riskLevel) {
      case RiskLevel.CRITICAL:
        return 'critical';
      case RiskLevel.HIGH:
        return 'error';
      case RiskLevel.MEDIUM:
        return 'warning';
      case RiskLevel.LOW:
      default:
        return 'info';
    }
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    uuid: string;
    accountUuid: string;
    operationType: string;
    description: string;
    riskLevel: RiskLevel;
    ipLocation: any;
    userAgent?: string;
    metadata: Record<string, any>;
    timestamp: string;
    isAlertTriggered: boolean;
    alertLevel?: string;
  } {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuUuid,
      operationType: this._operationType,
      description: this._description,
      riskLevel: this._riskLevel,
      ipLocation: this._ipLocation.toDTO(),
      userAgent: this._userAgent,
      metadata: this._metadata,
      timestamp: this._timestamp.toISOString(),
      isAlertTriggered: this._isAlertTriggered,
      alertLevel: this._alertLevel
    };
  }
}