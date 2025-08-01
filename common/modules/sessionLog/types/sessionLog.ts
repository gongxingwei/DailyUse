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
 * 操作状态
 */
export enum OperationStatus {
    SUCCESS = 'success',
    FAILURE = 'failure',
    WARNING = 'warning',
    INFO = 'info'
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

export interface IIPLocation {
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

export interface IIPLocationDTO {
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

export interface IAuditTrail {
  uuid: string;
  accountUuid: string;
  operationType: OperationType;
  description: string;
  riskLevel: RiskLevel;
  ipLocation: IIPLocation;
  userAgent?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  isAlertTriggered: boolean;
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
}

export interface IAuditTrailDTO {
  uuid: string;
  accountUuid: string;
  operationType: OperationType;
  description: string;
  riskLevel: RiskLevel;
  ipLocation: IIPLocationDTO;
  userAgent?: string;
  metadata: Record<string, any>;
  timestamp: string;
  isAlertTriggered: boolean;
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
}

export interface ISessionLog {
  uuid: string;
  accountUuid: string;
  sessionUuid?: string;
  operationType: OperationType;
  operationStatus: OperationStatus;
  deviceInfo: string;
  ipLocation: IIPLocation;
  userAgent?: string;
  loginTime?: Date;
  logoutTime?: Date;
  duration?: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  isAnomalous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionLogDTO {
  uuid: string;
  accountUuid: string;
  sessionUuid?: string;
  operationType: OperationType;
  operationStatus: OperationStatus;
  deviceInfo: string;
  ipLocation: IIPLocation; // 或 IIPLocationDTO
  userAgent?: string;
  loginTime?: string;
  logoutTime?: string;
  duration?: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  isAnomalous: boolean;
  createdAt: string;
  updatedAt: string;
}