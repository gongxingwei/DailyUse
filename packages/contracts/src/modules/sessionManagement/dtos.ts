/**
 * SessionManagement 模块数据传输对象
 *
 * 定义会话管理相关的DTO类型
 */

import {
  SessionStatus,
  SessionType,
  SessionTerminationReason,
  DeviceType,
  type DeviceInfo,
  type SessionSecurityConfig,
} from './types';

// ========== 请求 DTO ==========

/**
 * 创建会话请求DTO
 */
export interface CreateSessionRequestDTO {
  accountUuid: string;
  username: string;
  accountType: string;
  sessionType: SessionType;
  rememberMe: boolean;
  autoLogin: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  securityConfig?: Partial<SessionSecurityConfig>;
  metadata?: Record<string, any>;
}

/**
 * 更新会话请求DTO
 */
export interface UpdateSessionRequestDTO {
  sessionUuid: string;
  lastAccessAt?: Date;
  status?: SessionStatus;
  metadata?: Record<string, any>;
  securityConfig?: Partial<SessionSecurityConfig>;
}

/**
 * 终止会话请求DTO
 */
export interface TerminateSessionRequestDTO {
  sessionUuid: string;
  reason: SessionTerminationReason;
  terminatedBy?: string;
  note?: string;
}

/**
 * 刷新会话请求DTO
 */
export interface RefreshSessionRequestDTO {
  sessionUuid: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 验证会话请求DTO
 */
export interface ValidateSessionRequestDTO {
  sessionUuid: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  requireActive?: boolean;
}

/**
 * 批量操作会话请求DTO
 */
export interface BulkSessionOperationRequestDTO {
  sessionUuids: string[];
  operation: 'terminate' | 'refresh' | 'validate';
  reason?: SessionTerminationReason;
  metadata?: Record<string, any>;
}

/**
 * 会话查询请求DTO
 */
export interface SessionQueryRequestDTO {
  accountUuid?: string;
  status?: SessionStatus[];
  sessionType?: SessionType[];
  deviceType?: DeviceType[];
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
  includeMetadata?: boolean;
}

// ========== 响应 DTO ==========

/**
 * 会话响应DTO
 */
export interface SessionResponseDTO {
  uuid: string;
  accountUuid: string;
  username: string;
  accountType: string;
  sessionType: SessionType;
  token?: string;
  refreshToken?: string;
  rememberMe: boolean;
  autoLogin: boolean;
  status: SessionStatus;
  createdAt: string; // ISO date string
  lastAccessAt: string; // ISO date string
  expiresAt?: string; // ISO date string
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  securityConfig: SessionSecurityConfig;
  metadata?: Record<string, any>;
}

/**
 * 会话列表响应DTO
 */
export interface SessionListResponseDTO {
  sessions: SessionResponseDTO[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 会话统计响应DTO
 */
export interface SessionStatisticsResponseDTO {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  revokedSessions: number;
  averageSessionDuration: number;
  maxSessionDuration: number;
  todayLogins: number;
  weeklyLogins: number;
  monthlyLogins: number;
  deviceBreakdown: Array<{
    deviceType: DeviceType;
    count: number;
    percentage: number;
  }>;
  sessionTypeBreakdown: Array<{
    sessionType: SessionType;
    count: number;
    percentage: number;
  }>;
}

/**
 * 会话活动响应DTO
 */
export interface SessionActivityResponseDTO {
  uuid: string;
  sessionUuid: string;
  activityType: string;
  timestamp: string; // ISO date string
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  riskScore?: number;
}

/**
 * 会话活动列表响应DTO
 */
export interface SessionActivityListResponseDTO {
  activities: SessionActivityResponseDTO[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 会话验证响应DTO
 */
export interface SessionValidationResponseDTO {
  isValid: boolean;
  session?: SessionResponseDTO;
  errorCode?: string;
  errorMessage?: string;
  needsRefresh?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  validationDetails?: {
    tokenValid: boolean;
    sessionActive: boolean;
    ipMatches: boolean;
    deviceMatches: boolean;
    notExpired: boolean;
  };
}

/**
 * 会话刷新响应DTO
 */
export interface SessionRefreshResponseDTO {
  success: boolean;
  session?: SessionResponseDTO;
  newToken?: string;
  newRefreshToken?: string;
  errorMessage?: string;
  refreshDetails?: {
    tokenRefreshed: boolean;
    sessionExtended: boolean;
    securityValidated: boolean;
  };
}

/**
 * 批量会话操作响应DTO
 */
export interface BulkSessionOperationResponseDTO {
  successCount: number;
  failureCount: number;
  results: Array<{
    sessionUuid: string;
    success: boolean;
    errorMessage?: string;
  }>;
  totalProcessed: number;
}

/**
 * 会话安全报告响应DTO
 */
export interface SessionSecurityReportResponseDTO {
  reportId: string;
  accountUuid: string;
  generatedAt: string; // ISO date string
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    recommendations: string[];
  };
  suspiciousActivities: Array<{
    activityId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
  }>;
  sessionHealth: {
    healthySessionsCount: number;
    problematicSessionsCount: number;
    expiredSessionsCount: number;
  };
}

// ========== 事件通知 DTO ==========

/**
 * 会话事件通知DTO
 */
export interface SessionEventNotificationDTO {
  eventId: string;
  eventType:
    | 'session_created'
    | 'session_updated'
    | 'session_terminated'
    | 'session_expired'
    | 'session_refreshed';
  sessionUuid: string;
  accountUuid: string;
  timestamp: string; // ISO date string
  eventData?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}
