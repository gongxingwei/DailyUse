/**
 * SessionManagement 模块领域事件
 *
 * 定义会话管理相关的领域事件
 */

import { SessionStatus, SessionType, SessionTerminationReason, DeviceType } from './types';

// ========== 基础事件接口 ==========

/**
 * 会话领域事件基类
 */
export interface SessionDomainEventBase {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 聚合根ID（会话UUID） */
  aggregateId: string;
  /** 账户UUID */
  accountUuid: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 事件版本 */
  version: number;
  /** 相关ID */
  correlationId?: string;
  /** 用户ID */
  userId?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}

// ========== 会话生命周期事件 ==========

/**
 * 会话创建事件
 */
export interface SessionCreatedEvent extends SessionDomainEventBase {
  eventType: 'SessionCreated';
  payload: {
    sessionUuid: string;
    accountUuid: string;
    username: string;
    accountType: string;
    sessionType: SessionType;
    rememberMe: boolean;
    autoLogin: boolean;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: {
      deviceId: string;
      deviceType: DeviceType;
      deviceName?: string;
      os?: string;
      browser?: string;
    };
    expiresAt?: Date;
    securityConfig: {
      timeoutSeconds: number;
      idleTimeoutSeconds: number;
      maxConcurrentSessions: number;
    };
  };
}

/**
 * 会话激活事件
 */
export interface SessionActivatedEvent extends SessionDomainEventBase {
  eventType: 'SessionActivated';
  payload: {
    sessionUuid: string;
    activatedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    previousStatus: SessionStatus;
  };
}

/**
 * 会话访问事件
 */
export interface SessionAccessedEvent extends SessionDomainEventBase {
  eventType: 'SessionAccessed';
  payload: {
    sessionUuid: string;
    accessedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    resource?: string;
    riskScore?: number;
  };
}

/**
 * 会话刷新事件
 */
export interface SessionRefreshedEvent extends SessionDomainEventBase {
  eventType: 'SessionRefreshed';
  payload: {
    sessionUuid: string;
    refreshedAt: Date;
    oldToken?: string;
    newToken: string;
    newRefreshToken?: string;
    newExpiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * 会话更新事件
 */
export interface SessionUpdatedEvent extends SessionDomainEventBase {
  eventType: 'SessionUpdated';
  payload: {
    sessionUuid: string;
    updatedAt: Date;
    updatedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    updatedBy?: string;
  };
}

/**
 * 会话过期事件
 */
export interface SessionExpiredEvent extends SessionDomainEventBase {
  eventType: 'SessionExpired';
  payload: {
    sessionUuid: string;
    expiredAt: Date;
    expiredReason: 'timeout' | 'idle_timeout' | 'manual_expiry';
    lastAccessAt: Date;
    sessionDuration: number; // 会话持续时间（秒）
    autoCleanup: boolean;
  };
}

/**
 * 会话终止事件
 */
export interface SessionTerminatedEvent extends SessionDomainEventBase {
  eventType: 'SessionTerminated';
  payload: {
    sessionUuid: string;
    terminatedAt: Date;
    terminationReason: SessionTerminationReason;
    terminatedBy?: string;
    lastAccessAt: Date;
    sessionDuration: number; // 会话持续时间（秒）
    wasForced: boolean;
    note?: string;
  };
}

/**
 * 会话撤销事件
 */
export interface SessionRevokedEvent extends SessionDomainEventBase {
  eventType: 'SessionRevoked';
  payload: {
    sessionUuid: string;
    revokedAt: Date;
    revokedBy: string;
    reason: string;
    affectedSessions: string[]; // 同时撤销的相关会话
  };
}

// ========== 安全相关事件 ==========

/**
 * 可疑会话活动事件
 */
export interface SuspiciousSessionActivityEvent extends SessionDomainEventBase {
  eventType: 'SuspiciousSessionActivity';
  payload: {
    sessionUuid: string;
    activityType: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    detectedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, any>;
    actionTaken: 'none' | 'warning' | 'session_terminated' | 'account_locked';
    details: Record<string, any>;
  };
}

/**
 * 会话安全违规事件
 */
export interface SessionSecurityViolationEvent extends SessionDomainEventBase {
  eventType: 'SessionSecurityViolation';
  payload: {
    sessionUuid: string;
    violationType:
      | 'invalid_ip'
      | 'device_mismatch'
      | 'token_tampering'
      | 'concurrent_limit_exceeded'
      | 'suspicious_location';
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: Date;
    currentIpAddress?: string;
    expectedIpAddress?: string;
    currentDeviceInfo?: Record<string, any>;
    expectedDeviceInfo?: Record<string, any>;
    actionTaken: string;
    autoBlocked: boolean;
  };
}

/**
 * 并发会话限制超出事件
 */
export interface ConcurrentSessionLimitExceededEvent extends SessionDomainEventBase {
  eventType: 'ConcurrentSessionLimitExceeded';
  payload: {
    accountUuid: string;
    currentSessionCount: number;
    maxAllowedSessions: number;
    newSessionUuid: string;
    terminatedSessionUuids: string[];
    terminatedAt: Date;
    strategy: 'terminate_oldest' | 'terminate_newest' | 'deny_new';
  };
}

// ========== 管理事件 ==========

/**
 * 会话清理事件
 */
export interface SessionCleanupEvent extends SessionDomainEventBase {
  eventType: 'SessionCleanup';
  payload: {
    cleanupType: 'expired_sessions' | 'orphaned_sessions' | 'manual_cleanup';
    cleanupAt: Date;
    cleanedSessionCount: number;
    cleanedSessionUuids: string[];
    cleanupCriteria: Record<string, any>;
    performedBy?: string;
  };
}

/**
 * 会话统计更新事件
 */
export interface SessionStatisticsUpdatedEvent extends SessionDomainEventBase {
  eventType: 'SessionStatisticsUpdated';
  payload: {
    accountUuid: string;
    statisticsType: 'daily' | 'weekly' | 'monthly';
    updatedAt: Date;
    statistics: {
      totalSessions: number;
      activeSessions: number;
      averageDuration: number;
      loginCount: number;
      deviceTypes: Record<DeviceType, number>;
    };
    previousStatistics?: Record<string, any>;
  };
}

/**
 * 会话配置更新事件
 */
export interface SessionConfigurationUpdatedEvent extends SessionDomainEventBase {
  eventType: 'SessionConfigurationUpdated';
  payload: {
    accountUuid?: string; // null 表示全局配置
    configType: 'security' | 'timeout' | 'cleanup' | 'global';
    updatedAt: Date;
    updatedBy: string;
    previousConfig: Record<string, any>;
    newConfig: Record<string, any>;
    affectedSessions: string[];
  };
}

// ========== 事件联合类型 ==========

/**
 * 所有会话管理领域事件的联合类型
 */
export type SessionManagementDomainEvent =
  | SessionCreatedEvent
  | SessionActivatedEvent
  | SessionAccessedEvent
  | SessionRefreshedEvent
  | SessionUpdatedEvent
  | SessionExpiredEvent
  | SessionTerminatedEvent
  | SessionRevokedEvent
  | SuspiciousSessionActivityEvent
  | SessionSecurityViolationEvent
  | ConcurrentSessionLimitExceededEvent
  | SessionCleanupEvent
  | SessionStatisticsUpdatedEvent
  | SessionConfigurationUpdatedEvent;

// ========== 事件处理器接口 ==========

/**
 * 会话事件处理器接口
 */
export interface ISessionEventHandler<
  T extends SessionDomainEventBase = SessionManagementDomainEvent,
> {
  handle(event: T): Promise<void>;
}

/**
 * 会话事件发布器接口
 */
export interface ISessionEventPublisher {
  publish(event: SessionManagementDomainEvent): Promise<void>;
  publishBatch(events: SessionManagementDomainEvent[]): Promise<void>;
}
