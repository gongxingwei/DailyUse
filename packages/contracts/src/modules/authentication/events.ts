/**
 * Authentication 模块领域事件定义
 *
 * 定义认证授权相关的领域事件，用于模块间通信
 */




// ========== 认证事件 ==========

/**
 * 认证尝试事件
 */
export interface AuthenticationAttemptEvent {
  type: 'AuthenticationAttempt';
  username: string;
  authMethod: string;
  success: boolean;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    failureReason?: string;
    accountUuid?: string; // 仅在成功时提供
  };
}

/**
 * 认证成功事件
 */
export interface AuthenticationSuccessEvent {
  type: 'AuthenticationSuccess';
  accountUuid: string;
  sessionUuid: string;
  username: string;
  authMethod: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    platform?: string;
    mfaUsed?: boolean;
    rememberMeUsed?: boolean;
    isFirstLogin?: boolean;
  };
}

/**
 * 认证失败事件
 */
export interface AuthenticationFailureEvent {
  type: 'AuthenticationFailure';
  username: string;
  authMethod: string;
  reason: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    accountUuid?: string;
    failedAttempts?: number;
    lockoutTriggered?: boolean;
  };
}



/**
 * 认证上下文更新事件
 */
export interface AuthenticationContextUpdatedEvent {
  type: 'AuthenticationContextUpdated';
  accountUuid: string;
  sessionUuid: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  timestamp: string;
}

// ========== Token事件 ==========

/**
 * Token创建事件
 */
export interface TokenCreatedEvent {
  type: 'TokenCreated';
  tokenUuid: string;
  accountUuid: string;
  tokenType: string;
  expiresAt?: string;
  timestamp: string;
  metadata: {
    purpose?: string;
    requestedBy?: string;
    deviceId?: string;
  };
}

/**
 * Token刷新事件
 */
export interface TokenRefreshedEvent {
  type: 'TokenRefreshed';
  oldTokenUuid: string;
  newTokenUuid: string;
  accountUuid: string;
  sessionUuid: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * Token撤销事件
 */
export interface TokenRevokedEvent {
  type: 'TokenRevoked';
  tokenUuid: string;
  accountUuid: string;
  tokenType: string;
  reason: string;
  timestamp: string;
  metadata: {
    revokedBy?: string;
    automatic?: boolean;
    policyId?: string;
  };
}

/**
 * Token过期事件
 */
export interface TokenExpiredEvent {
  type: 'TokenExpired';
  tokenUuid: string;
  accountUuid: string;
  tokenType: string;
  sessionUuid?: string;
  timestamp: string;
  metadata: {
    gracePeriod?: number;
    autoCleanup?: boolean;
  };
}

// ========== 会话事件 ==========

/**
 * 会话创建事件
 */
export interface SessionCreatedEvent {
  type: 'SessionCreated';
  sessionUuid: string;
  accountUuid: string;
  username: string;
  authMethod: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    platform?: string;
    expectedDuration?: number;
  };
}

/**
 * 会话活动事件
 */
export interface SessionActivityEvent {
  type: 'SessionActivity';
  sessionUuid: string;
  accountUuid: string;
  activityType: 'heartbeat' | 'api_call' | 'user_action';
  timestamp: string;
  metadata: {
    endpoint?: string;
    action?: string;
    duration?: number;
    ipAddress?: string;
  };
}

/**
 * 会话延期事件
 */
export interface SessionExtendedEvent {
  type: 'SessionExtended';
  sessionUuid: string;
  accountUuid: string;
  oldExpiresAt: string;
  newExpiresAt: string;
  reason: string;
  timestamp: string;
}

/**
 * 会话终止事件
 */
export interface SessionTerminatedEvent {
  type: 'SessionTerminated';
  sessionUuid: string;
  accountUuid: string;
  terminationType: string;
  reason?: string;
  timestamp: string;
  metadata: {
    duration?: number;
    terminatedBy?: string;
    forced?: boolean;
  };
}

/**
 * 会话清理事件
 */
export interface SessionCleanupEvent {
  type: 'SessionCleanup';
  accountUuid?: string;
  cleanedSessions: number;
  criteria: string;
  timestamp: string;
  metadata: {
    automatic?: boolean;
    policyId?: string;
    reason?: string;
  };
}

// ========== MFA事件 ==========

/**
 * MFA挑战创建事件
 */
export interface MFAChallengeCreatedEvent {
  type: 'MFAChallengeCreated';
  challengeId: string;
  accountUuid: string;
  methods: string[];
  expiresAt: string;
  timestamp: string;
  metadata: {
    triggerReason?: string;
    riskLevel?: string;
  };
}

/**
 * MFA验证尝试事件
 */
export interface MFAVerificationAttemptEvent {
  type: 'MFAVerificationAttempt';
  challengeId: string;
  accountUuid: string;
  method: string;
  success: boolean;
  timestamp: string;
  metadata: {
    deviceId?: string;
    attemptNumber?: number;
    remainingAttempts?: number;
    ipAddress?: string;
  };
}

/**
 * MFA验证成功事件
 */
export interface MFAVerificationSuccessEvent {
  type: 'MFAVerificationSuccess';
  challengeId: string;
  accountUuid: string;
  method: string;
  deviceUuid?: string;
  timestamp: string;
  metadata: {
    trustDevice?: boolean;
    deviceId?: string;
  };
}

/**
 * MFA验证失败事件
 */
export interface MFAVerificationFailureEvent {
  type: 'MFAVerificationFailure';
  challengeId: string;
  accountUuid: string;
  method: string;
  reason: string;
  timestamp: string;
  metadata: {
    attemptNumber?: number;
    remainingAttempts?: number;
    deviceId?: string;
    lockoutTriggered?: boolean;
  };
}

/**
 * MFA挑战过期事件
 */
export interface MFAChallengeExpiredEvent {
  type: 'MFAChallengeExpired';
  challengeId: string;
  accountUuid: string;
  timestamp: string;
  metadata: {
    autoCleanup?: boolean;
  };
}

// ========== 记住我功能事件 ==========

/**
 * 记住我Token创建事件
 */
export interface RememberMeTokenCreatedEvent {
  type: 'RememberMeTokenCreated';
  tokenUuid: string;
  accountUuid: string;
  deviceId: string;
  expiresAt: string;
  timestamp: string;
  metadata: {
    deviceName?: string;
    platform?: string;
    userAgent?: string;
  };
}

/**
 * 记住我Token使用事件
 */
export interface RememberMeTokenUsedEvent {
  type: 'RememberMeTokenUsed';
  tokenUuid: string;
  accountUuid: string;
  deviceId: string;
  success: boolean;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionUuid?: string;
  };
}

/**
 * 记住我Token撤销事件
 */
export interface RememberMeTokenRevokedEvent {
  type: 'RememberMeTokenRevoked';
  tokenUuid: string;
  accountUuid: string;
  deviceId: string;
  reason: string;
  timestamp: string;
  metadata: {
    revokedBy?: string;
    automatic?: boolean;
  };
}

// ========== 安全事件 ==========

/**
 * 账户锁定事件
 */
export interface AccountLockedEvent {
  type: 'AccountLocked';
  accountUuid: string;
  reason: string;
  lockoutDuration?: number;
  timestamp: string;
  metadata: {
    failedAttempts?: number;
    ipAddress?: string;
    automatic?: boolean;
    policyId?: string;
  };
}

/**
 * 账户解锁事件
 */
export interface AccountUnlockedEvent {
  type: 'AccountUnlocked';
  accountUuid: string;
  method: 'automatic' | 'manual' | 'admin';
  timestamp: string;
  metadata: {
    unlockedBy?: string;
    lockDuration?: number;
  };
}

/**
 * 可疑登录事件
 */
export interface SuspiciousLoginEvent {
  type: 'SuspiciousLogin';
  accountUuid: string;
  username: string;
  riskFactors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: {
    ipAddress?: string;
    location?: string;
    userAgent?: string;
    deviceId?: string;
    actionTaken?: string;
  };
}

/**
 * 暴力破解检测事件
 */
export interface BruteForceDetectedEvent {
  type: 'BruteForceDetected';
  targetUsername?: string;
  sourceIp?: string;
  attemptCount: number;
  timeWindow: number; // 检测时间窗口（秒）
  timestamp: string;
  metadata: {
    userAgents?: string[];
    targetAccounts?: string[];
    actionTaken?: string;
    blocked?: boolean;
  };
}

// ========== 策略事件 ==========

/**
 * 认证策略更新事件
 */
export interface AuthPolicyUpdatedEvent {
  type: 'AuthPolicyUpdated';
  policyType: 'password' | 'session' | 'lockout' | 'mfa';
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  updatedBy: string;
  timestamp: string;
  metadata: {
    reason?: string;
    effectiveAt?: string;
  };
}

/**
 * 策略违规事件
 */
export interface PolicyViolationEvent {
  type: 'PolicyViolation';
  accountUuid?: string;
  policyType: string;
  violation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: {
    actionTaken?: string;
    automaticResponse?: boolean;
    details?: any;
  };
}

// ========== 审计事件 ==========


/**
 * 批量审计记录清理事件
 */
export interface AuthAuditCleanupEvent {
  type: 'AuthAuditCleanup';
  recordsDeleted: number;
  criteria: {
    olderThan?: string;
    result?: string;
    action?: string;
  };
  timestamp: string;
  metadata: {
    automatic?: boolean;
    retentionPolicyId?: string;
  };
}

// ========== 联合事件类型 ==========

/**
 * 所有认证相关事件的联合类型
 */
export type AuthenticationEvent =
  | AuthenticationAttemptEvent
  | AuthenticationSuccessEvent
  | AuthenticationFailureEvent
  | AuthenticationContextUpdatedEvent
  | TokenCreatedEvent
  | TokenRefreshedEvent
  | TokenRevokedEvent
  | TokenExpiredEvent
  | SessionCreatedEvent
  | SessionActivityEvent
  | SessionExtendedEvent
  | SessionTerminatedEvent
  | SessionCleanupEvent
  | MFAChallengeCreatedEvent
  | MFAVerificationAttemptEvent
  | MFAVerificationSuccessEvent
  | MFAVerificationFailureEvent
  | MFAChallengeExpiredEvent
  | RememberMeTokenCreatedEvent
  | RememberMeTokenUsedEvent
  | RememberMeTokenRevokedEvent
  | AccountLockedEvent
  | AccountUnlockedEvent
  | SuspiciousLoginEvent
  | BruteForceDetectedEvent
  | AuthPolicyUpdatedEvent
  | PolicyViolationEvent
  | AuthAuditCleanupEvent;
