/**
 * Authentication 模块数据传输对象 (DTO)
 *
 * 定义认证授权相关的DTO类型，用于API数据传输
 */

import { LoginResult, LogoutType, SessionTerminationType } from './types';
import { AccountStatus, AccountType, AuthMethod, TokenType, SessionStatus } from '../account/types';

// ========== 请求 DTO ==========

/**
 * 密码认证请求DTO
 */
export interface AuthByPasswordRequestDTO {
  username: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
  deviceId?: string;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    platform?: string;
    version?: string;
    fingerprint?: string;
  };
}

/**
 * 用户名密码注册请求DTO
 */
export interface RegistrationByUsernameAndPasswordRequestDTO {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
  newsletter?: boolean;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    platform?: string;
  };
}

/**
 * 记住我Token认证请求DTO
 */
export interface AuthByRememberMeTokenRequestDTO {
  token: string;
  deviceId?: string;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    platform?: string;
  };
}

/**
 * 刷新Token请求DTO
 */
export interface RefreshTokenRequestDTO {
  refreshToken: string;
  deviceId?: string;
}

/**
 * 密码重置请求DTO
 */
export interface PasswordResetRequestDTO {
  identifier: string; // 用户名或邮箱
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * 密码重置确认DTO
 */
export interface PasswordResetConfirmationDTO {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * MFA验证请求DTO
 */
export interface MFAVerificationRequestDTO {
  challengeId: string;
  method: string;
  code: string;
  deviceId?: string;
  trustDevice?: boolean;
}

/**
 * 登录请求DTO
 */
export interface LoginRequestDTO {
  authMethod: AuthMethod;
  credentials: AuthByPasswordRequestDTO | AuthByRememberMeTokenRequestDTO;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    platform?: string;
    version?: string;
    fingerprint?: string;
  };
}

// ========== 响应 DTO ==========

/**
 * 认证响应DTO
 */
export interface AuthResponseDTO {
  success: boolean;
  result: LoginResult;
  token?: string;
  refreshToken?: string;
  expiresAt?: string; // ISO string
  accountUuid?: string;
  username?: string;
  sessionUuid?: string;
  permissions?: string[];
  roles?: string[];
  mfaRequired?: boolean;
  mfaChallenge?: {
    challengeId: string;
    methods: Array<{
      type: string;
      identifier: string;
      primary?: boolean;
    }>;
    expiresAt: string; // ISO string
  };
  error?: string;
  metadata?: {
    isFirstLogin?: boolean;
    passwordExpired?: boolean;
    accountStatus?: AccountStatus;
  };
}

/**
 * 登录响应DTO
 */
export interface LoginResponseDTO {
  success: boolean;
  result: LoginResult;
  session?: {
    token: string;
    refreshToken?: string;
    expiresAt: string; // ISO string
    sessionUuid: string;
  };
  account?: {
    uuid: string;
    username: string;
    status: AccountStatus;
    accountType: AccountType;
    permissions?: string[];
    roles?: string[];
  };
  user?: {
    uuid: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  mfaRequired?: boolean;
  mfaChallenge?: {
    challengeId: string;
    methods: Array<{
      type: string;
      identifier: string;
      primary?: boolean;
    }>;
    expiresAt: string; // ISO string
  };
  rememberMeToken?: {
    token: string;
    expiresAt: string; // ISO string
    deviceId?: string;
  };
  error?: string;
  warnings?: string[];
}

/**
 * 注册响应DTO
 */
export interface RegistrationResponseDTO {
  success: boolean;
  accountUuid?: string;
  username?: string;
  requiresVerification?: boolean;
  verificationMethods?: Array<{
    type: 'email' | 'phone';
    identifier: string;
  }>;
  autoLogin?: boolean;
  session?: {
    token: string;
    refreshToken?: string;
    expiresAt: string; // ISO string
    sessionUuid: string;
  };
  error?: string;
  validationErrors?: { [field: string]: string[] };
}

/**
 * Token刷新响应DTO
 */
export interface TokenRefreshResponseDTO {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: string; // ISO string
  error?: string;
}

/**
 * 登出响应DTO
 */
export interface LogoutResponseDTO {
  success: boolean;
  logoutType: LogoutType;
  sessionUuid?: string;
  error?: string;
}

/**
 * 密码重置响应DTO
 */
export interface PasswordResetResponseDTO {
  success: boolean;
  message?: string;
  resetTokenSent?: boolean;
  expiresAt?: string; // ISO string
  error?: string;
}

/**
 * MFA验证响应DTO
 */
export interface MFAVerificationResponseDTO {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: string; // ISO string
  accountUuid?: string;
  sessionUuid?: string;
  error?: string;
  remainingAttempts?: number;
}

// ========== 数据 DTO ==========

/**
 * 会话数据DTO
 */
export interface SessionDataDTO {
  uuid: string;
  accountUuid: string;
  username: string;
  status: SessionStatus;
  createdAt: string; // ISO string
  lastAccessAt: string; // ISO string
  expiresAt?: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  platform?: string;
  isCurrentSession?: boolean;
  metadata?: any;
}

/**
 * 认证上下文DTO
 */
export interface AuthContextDTO {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  permissions: string[];
  roles: string[];
  authMethod: AuthMethod;
  authTime: string; // ISO string
  tokenType: TokenType;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    platform?: string;
  };
  mfaVerified?: boolean;
  expiresAt?: string; // ISO string
}

/**
 * 记住我Token DTO
 */
export interface RememberMeTokenDTO {
  token: string;
  accountUuid: string;
  username: string;
  expiresAt: string; // ISO string
  deviceId?: string;
  deviceName?: string;
  createdAt: string; // ISO string
  lastUsedAt?: string; // ISO string
}

/**
 * MFA设置DTO
 */
export interface MFASettingsDTO {
  isEnabled: boolean;
  isRequired: boolean;
  backupCodesCount: number;
  devices: Array<{
    uuid: string;
    name: string;
    type: string;
    identifier: string; // 掩码处理
    isActive: boolean;
    isVerified: boolean;
    createdAt: string; // ISO string
    lastUsed?: string; // ISO string
  }>;
  trustedDevices?: Array<{
    deviceId: string;
    deviceName?: string;
    platform?: string;
    trustedAt: string; // ISO string
    expiresAt?: string; // ISO string
  }>;
}

/**
 * 认证审计DTO
 */
export interface AuthAuditDTO {
  uuid: string;
  accountUuid?: string;
  username: string;
  action: string;
  result: 'success' | 'failure';
  reason?: string;
  timestamp: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionUuid?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  metadata?: any;
}

/**
 * 认证策略DTO
 */
export interface AuthPolicyDTO {
  passwordPolicy: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    forbiddenPatterns?: string[];
    maxAge?: number; // 天
    historyCount?: number;
  };
  sessionPolicy: {
    maxDuration: number; // 秒
    maxIdleDuration: number; // 秒
    maxConcurrentSessions: number;
    requireMFA: boolean;
    allowRememberMe: boolean;
    rememberMeDuration: number; // 天
  };
  lockoutPolicy: {
    enabled: boolean;
    maxFailedAttempts: number;
    lockoutDuration: number; // 秒
    progressiveLockout: boolean;
    notifyOnLockout: boolean;
  };
  mfaPolicy: {
    required: boolean;
    gracePeriod: number; // 秒
    backupCodesCount: number;
    trustedDeviceDuration: number; // 天
    allowedMethods: string[];
  };
}

// ========== 列表和分页 DTO ==========

/**
 * 会话列表DTO
 */
export interface SessionListDTO {
  sessions: SessionDataDTO[];
  total: number;
  page: number;
  pageSize: number;
  currentSessionUuid?: string;
}

/**
 * 认证审计列表DTO
 */
export interface AuthAuditListDTO {
  audits: AuthAuditDTO[];
  total: number;
  page: number;
  pageSize: number;
  filters?: {
    action?: string;
    result?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
  };
}

/**
 * 记住我Token列表DTO
 */
export interface RememberMeTokenListDTO {
  tokens: Array<{
    deviceId: string;
    deviceName?: string;
    platform?: string;
    createdAt: string; // ISO string
    lastUsedAt?: string; // ISO string
    expiresAt: string; // ISO string
    isCurrentDevice?: boolean;
  }>;
  total: number;
}

// ========== 验证和状态 DTO ==========

/**
 * Token验证DTO
 */
export interface TokenValidationDTO {
  isValid: boolean;
  accountUuid?: string;
  username?: string;
  permissions?: string[];
  roles?: string[];
  sessionUuid?: string;
  expiresAt?: string; // ISO string
  error?: string;
  errorCode?: string;
}

/**
 * 账户认证状态DTO
 */
export interface AccountAuthStatusDTO {
  accountUuid: string;
  username: string;
  canLogin: boolean;
  status: AccountStatus;
  isLocked: boolean;
  lockoutExpiresAt?: string; // ISO string
  passwordExpired: boolean;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  activeSessions: number;
  lastLoginAt?: string; // ISO string
  failedAttempts: number;
  restrictions?: string[];
}
