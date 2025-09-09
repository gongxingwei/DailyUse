/**
 * Account 模块领域事件定义
 *
 * 定义账户管理相关的领域事件，用于模块间通信
 */

import { AccountDTO, UserDTO, SessionDTO, MFADeviceDTO } from './dtos';

// ========== 账户事件 ==========

/**
 * 账户已注册事件
 */
export interface AccountRegisteredEvent {
  type: 'AccountRegistered';
  accountUuid: string;
  username: string;
  email?: string;
  accountType: string;
  timestamp: string;
  metadata: {
    registrationMethod: 'manual' | 'api' | 'import';
    source?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * 账户已创建事件（完整信息）
 */
export interface AccountCreatedEvent {
  type: 'AccountCreated';
  account: AccountDTO;
  user: UserDTO;
  timestamp: string;
  metadata: {
    createdBy?: string;
    source: string;
  };
}

/**
 * 账户状态已变更事件
 */
export interface AccountStatusChangedEvent {
  type: 'AccountStatusChanged';
  accountUuid: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  changedBy?: string;
  timestamp: string;
  metadata: {
    automatic?: boolean;
    policyId?: string;
  };
}

/**
 * 账户已更新事件
 */
export interface AccountUpdatedEvent {
  type: 'AccountUpdated';
  accountUuid: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  updatedBy?: string;
  timestamp: string;
  metadata: {
    source: string;
    reason?: string;
  };
}

/**
 * 账户注销确认事件
 */
export interface AccountDeactivationConfirmedEvent {
  type: 'AccountDeactivationConfirmed';
  accountUuid: string;
  reason: string;
  feedback?: string;
  deactivatedBy: string;
  timestamp: string;
  metadata: {
    dataRetentionDays?: number;
    backupCreated?: boolean;
  };
}

// ========== 认证事件 ==========

/**
 * 用户已登录事件
 */
export interface UserLoggedInEvent {
  type: 'UserLoggedIn';
  accountUuid: string;
  sessionUuid: string;
  username: string;
  authMethod: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceId?: string;
    mfaUsed?: boolean;
  };
}

/**
 * 用户已登出事件
 */
export interface UserLoggedOutEvent {
  type: 'UserLoggedOut';
  accountUuid: string;
  sessionUuid: string;
  logoutType: 'manual' | 'timeout' | 'forced' | 'security';
  timestamp: string;
  metadata: {
    reason?: string;
    duration?: number; // 会话持续时间（秒）
  };
}

/**
 * 登录尝试事件
 */
export interface LoginAttemptEvent {
  type: 'LoginAttempt';
  username: string;
  success: boolean;
  authMethod: string;
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
    accountUuid?: string; // 仅在成功时提供
  };
}

/**
 * 登录凭据验证事件
 */
export interface LoginCredentialVerificationEvent {
  type: 'LoginCredentialVerification';
  accountUuid: string;
  authMethod: string;
  success: boolean;
  timestamp: string;
  metadata: {
    credentialType: string;
    failureReason?: string;
    attemptsCount?: number;
  };
}

// ========== 会话事件 ==========

/**
 * 会话已终止事件
 */
export interface SessionTerminatedEvent {
  type: 'SessionTerminated';
  sessionUuid: string;
  accountUuid: string;
  terminationType: 'expired' | 'revoked' | 'logout' | 'security';
  timestamp: string;
  metadata: {
    reason?: string;
    terminatedBy?: string;
    duration?: number;
  };
}

/**
 * 所有会话已终止事件
 */
export interface AllSessionsTerminatedEvent {
  type: 'AllSessionsTerminated';
  accountUuid: string;
  terminationType: 'security' | 'password_change' | 'manual';
  sessionCount: number;
  timestamp: string;
  metadata: {
    reason?: string;
    terminatedBy?: string;
    excludeCurrentSession?: boolean;
  };
}

// ========== 权限事件 ==========

/**
 * 权限已授予事件
 */
export interface PermissionGrantedEvent {
  type: 'PermissionGranted';
  accountUuid: string;
  permission: string;
  resource: string;
  grantedBy: string;
  timestamp: string;
  metadata: {
    roleUuid?: string;
    expiresAt?: string;
    conditions?: any;
  };
}

/**
 * 权限已撤销事件
 */
export interface PermissionRevokedEvent {
  type: 'PermissionRevoked';
  accountUuid: string;
  permission: string;
  resource: string;
  revokedBy: string;
  timestamp: string;
  metadata: {
    reason?: string;
    roleUuid?: string;
  };
}

// ========== MFA事件 ==========

/**
 * MFA设备已注册事件
 */
export interface MFADeviceRegisteredEvent {
  type: 'MFADeviceRegistered';
  accountUuid: string;
  device: MFADeviceDTO;
  timestamp: string;
  metadata: {
    setupMethod: string;
    backupCodes?: boolean;
  };
}

/**
 * MFA设备已验证事件
 */
export interface MFADeviceVerifiedEvent {
  type: 'MFADeviceVerified';
  accountUuid: string;
  deviceUuid: string;
  verificationMethod: string;
  timestamp: string;
  metadata: {
    firstTimeVerification?: boolean;
  };
}

/**
 * MFA设备已停用事件
 */
export interface MFADeviceDeactivatedEvent {
  type: 'MFADeviceDeactivated';
  accountUuid: string;
  deviceUuid: string;
  reason: string;
  timestamp: string;
  metadata: {
    deactivatedBy?: string;
    hasBackupDevices?: boolean;
  };
}

// ========== 安全事件 ==========

/**
 * 密码已更改事件
 */
export interface PasswordChangedEvent {
  type: 'PasswordChanged';
  accountUuid: string;
  changeMethod: 'self_service' | 'reset' | 'admin_force';
  timestamp: string;
  metadata: {
    changedBy?: string;
    oldPasswordHash?: string; // 仅用于审计
    ipAddress?: string;
    terminateOtherSessions?: boolean;
  };
}

/**
 * 可疑活动检测事件
 */
export interface SuspiciousActivityDetectedEvent {
  type: 'SuspiciousActivityDetected';
  accountUuid: string;
  activityType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    actionTaken?: string;
    details?: any;
  };
}

// ========== 验证事件 ==========

/**
 * 邮箱验证请求事件
 */
export interface EmailVerificationRequestedEvent {
  type: 'EmailVerificationRequested';
  accountUuid: string;
  email: string;
  verificationToken: string;
  timestamp: string;
  metadata: {
    requestedBy?: string;
    expiresAt: string;
  };
}

/**
 * 邮箱已验证事件
 */
export interface EmailVerifiedEvent {
  type: 'EmailVerified';
  accountUuid: string;
  email: string;
  timestamp: string;
  metadata: {
    verificationMethod: string;
    ipAddress?: string;
  };
}

/**
 * 手机验证请求事件
 */
export interface PhoneVerificationRequestedEvent {
  type: 'PhoneVerificationRequested';
  accountUuid: string;
  phoneNumber: string;
  verificationCode: string;
  timestamp: string;
  metadata: {
    requestedBy?: string;
    expiresAt: string;
    method: 'sms' | 'call';
  };
}

/**
 * 手机已验证事件
 */
export interface PhoneVerifiedEvent {
  type: 'PhoneVerified';
  accountUuid: string;
  phoneNumber: string;
  timestamp: string;
  metadata: {
    verificationMethod: 'sms' | 'call';
  };
}

// ========== 请求响应事件 ==========

/**
 * 账户信息获取请求（按用户名）
 */
export interface AccountInfoGetterByUsernameRequested {
  type: 'AccountInfoGetterByUsernameRequested';
  username: string;
  requestId: string;
  timestamp: string;
  metadata: {
    requestedBy?: string;
    includeDetails?: boolean;
  };
}

/**
 * 账户信息获取响应（按用户名）
 */
export interface AccountInfoGetterByUsernameResponse {
  type: 'AccountInfoGetterByUsernameResponse';
  requestId: string;
  success: boolean;
  account?: AccountDTO;
  error?: string;
  timestamp: string;
}

/**
 * 账户信息获取请求（按UUID）
 */
export interface AccountInfoGetterByUuidRequested {
  type: 'AccountInfoGetterByUuidRequested';
  accountUuid: string;
  requestId: string;
  timestamp: string;
  metadata: {
    requestedBy?: string;
    includeDetails?: boolean;
  };
}

/**
 * 账户信息获取响应（按UUID）
 */
export interface AccountInfoGetterByUuidResponse {
  type: 'AccountInfoGetterByUuidResponse';
  requestId: string;
  success: boolean;
  account?: AccountDTO;
  error?: string;
  timestamp: string;
}

/**
 * 账户UUID获取响应
 */
export interface AccountUuidGetterResponse {
  type: 'AccountUuidGetterResponse';
  requestId: string;
  success: boolean;
  accountUuid?: string;
  error?: string;
  timestamp: string;
}

/**
 * 账户状态验证请求
 */
export interface AccountStatusVerificationRequested {
  type: 'AccountStatusVerificationRequested';
  accountUuid: string;
  requestId: string;
  timestamp: string;
}

/**
 * 账户状态验证响应
 */
export interface AccountStatusVerificationResponse {
  type: 'AccountStatusVerificationResponse';
  requestId: string;
  accountUuid: string;
  status: string;
  isValid: boolean;
  timestamp: string;
}

/**
 * 账户状态结果
 */
export interface AccountStatusResult {
  accountUuid: string;
  status: string;
  isActive: boolean;
  canLogin: boolean;
  restrictions?: string[];
}

/**
 * 账户注销验证请求
 */
export interface AccountDeactivationVerificationRequested {
  type: 'AccountDeactivationVerificationRequested';
  accountUuid: string;
  reason: string;
  requestId: string;
  timestamp: string;
}

/**
 * 账户注销验证响应
 */
export interface AccountDeactivationVerificationResponse {
  type: 'AccountDeactivationVerificationResponse';
  requestId: string;
  accountUuid: string;
  canDeactivate: boolean;
  blockers?: string[];
  warnings?: string[];
  timestamp: string;
}

// ========== 联合事件类型 ==========

/**
 * 所有账户相关事件的联合类型
 */
export type AccountEvent =
  | AccountRegisteredEvent
  | AccountCreatedEvent
  | AccountStatusChangedEvent
  | AccountUpdatedEvent
  | AccountDeactivationConfirmedEvent
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | LoginAttemptEvent
  | LoginCredentialVerificationEvent
  | SessionTerminatedEvent
  | AllSessionsTerminatedEvent
  | PermissionGrantedEvent
  | PermissionRevokedEvent
  | MFADeviceRegisteredEvent
  | MFADeviceVerifiedEvent
  | MFADeviceDeactivatedEvent
  | PasswordChangedEvent
  | SuspiciousActivityDetectedEvent
  | EmailVerificationRequestedEvent
  | EmailVerifiedEvent
  | PhoneVerificationRequestedEvent
  | PhoneVerifiedEvent
  | AccountInfoGetterByUsernameRequested
  | AccountInfoGetterByUsernameResponse
  | AccountInfoGetterByUuidRequested
  | AccountInfoGetterByUuidResponse
  | AccountUuidGetterResponse
  | AccountStatusVerificationRequested
  | AccountStatusVerificationResponse
  | AccountDeactivationVerificationRequested
  | AccountDeactivationVerificationResponse;
