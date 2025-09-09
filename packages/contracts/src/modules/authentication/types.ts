/**
 * Authentication 模块类型定义
 *
 * 定义认证授权相关的接口、枚举和类型
 */

import { AccountStatus, AccountType, AuthMethod, TokenType, SessionStatus } from '../account/types';

// ========== 枚举类型 ==========

/**
 * 登录结果枚举
 */
export enum LoginResult {
  /** 登录成功 */
  SUCCESS = 'success',
  /** 用户名或密码错误 */
  INVALID_CREDENTIALS = 'invalid_credentials',
  /** 账户被锁定 */
  ACCOUNT_LOCKED = 'account_locked',
  /** 账户未激活 */
  ACCOUNT_INACTIVE = 'account_inactive',
  /** 需要双因素认证 */
  MFA_REQUIRED = 'mfa_required',
  /** 双因素认证失败 */
  MFA_FAILED = 'mfa_failed',
  /** 密码已过期 */
  PASSWORD_EXPIRED = 'password_expired',
  /** 系统错误 */
  SYSTEM_ERROR = 'system_error',
}

/**
 * 登出类型枚举
 */
export enum LogoutType {
  /** 主动登出 */
  MANUAL = 'manual',
  /** 会话超时 */
  TIMEOUT = 'timeout',
  /** 强制登出 */
  FORCED = 'forced',
  /** 安全原因 */
  SECURITY = 'security',
}

/**
 * 会话终止类型枚举
 */
export enum SessionTerminationType {
  /** 正常过期 */
  EXPIRED = 'expired',
  /** 手动撤销 */
  REVOKED = 'revoked',
  /** 用户登出 */
  LOGOUT = 'logout',
  /** 安全策略 */
  SECURITY = 'security',
}

/**
 * 所有会话终止类型枚举
 */
export enum AllSessionsTerminationType {
  /** 安全原因 */
  SECURITY = 'security',
  /** 密码更改 */
  PASSWORD_CHANGE = 'password_change',
  /** 手动操作 */
  MANUAL = 'manual',
}

// ========== 核心接口 ==========

/**
 * 认证信息接口
 */
export interface AuthInfo {
  token: string;
  accountUuid: string;
  username: string;
  sessionUuid: string;
  refreshToken?: string;
  expiresAt?: Date;
  permissions?: string[];
  roles?: string[];
}

/**
 * 登录表单接口（密码认证）
 */
export interface AuthByPasswordForm {
  username: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
  deviceId?: string;
}

/**
 * 登录表单接口（用户名密码注册）
 */
export interface RegistrationByUsernameAndPasswordForm {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

/**
 * 登录请求接口
 */
export interface LoginRequest {
  credentials: AuthByPasswordForm;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    platform?: string;
  };
}

/**
 * 会话信息接口
 */
export interface SessionInfo {
  uuid: string;
  accountUuid: string;
  username: string;
  status: SessionStatus;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  isCurrentSession?: boolean;
}

/**
 * 验证结果接口
 */
export interface VerificationResult {
  isValid: boolean;
  accountUuid?: string;
  username?: string;
  permissions?: string[];
  roles?: string[];
  error?: string;
  expiresAt?: Date;
}

/**
 * 密码重置请求接口
 */
export interface PasswordResetRequest {
  identifier: string; // 用户名或邮箱
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * 密码重置确认接口
 */
export interface PasswordResetConfirmation {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 刷新Token请求接口
 */
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

/**
 * 客户端信息接口
 */
export interface ClientInfo {
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
  platform?: 'web' | 'desktop' | 'mobile';
  version?: string;
  fingerprint?: string;
}

// ========== 记住我功能相关 ==========

/**
 * 记住我Token信息
 */
export interface RememberMeToken {
  token: string;
  accountUuid: string;
  username: string;
  expiresAt: Date;
  deviceId?: string;
  deviceName?: string;
}

// ========== 双因素认证相关 ==========

/**
 * MFA挑战信息
 */
export interface MFAChallenge {
  challengeId: string;
  accountUuid: string;
  methods: Array<{
    type: string;
    identifier: string; // 掩码处理的手机号或邮箱
    primary?: boolean;
  }>;
  expiresAt: Date;
}

/**
 * MFA验证请求
 */
export interface MFAVerificationRequest {
  challengeId: string;
  method: string;
  code: string;
  deviceId?: string;
}

/**
 * MFA设置信息
 */
export interface MFASettings {
  isEnabled: boolean;
  backupCodesCount: number;
  devices: Array<{
    uuid: string;
    name: string;
    type: string;
    identifier: string;
    isActive: boolean;
    lastUsed?: Date;
  }>;
}

// ========== 认证策略相关 ==========

/**
 * 认证策略接口
 */
export interface AuthenticationPolicy {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge?: number; // 密码有效期（天）
    historyCount?: number; // 记住历史密码数量
  };
  sessionPolicy: {
    maxDuration: number; // 最大会话时长（秒）
    maxIdleDuration: number; // 最大空闲时长（秒）
    maxConcurrentSessions: number; // 最大并发会话数
    requireMFA: boolean;
  };
  lockoutPolicy: {
    maxFailedAttempts: number;
    lockoutDuration: number; // 锁定时长（秒）
    progressiveLockout: boolean;
  };
}

/**
 * 认证上下文
 */
export interface AuthenticationContext {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  permissions: string[];
  roles: string[];
  authMethod: AuthMethod;
  authTime: Date;
  clientInfo?: ClientInfo;
  mfaVerified?: boolean;
  tokenType: TokenType;
}

// ========== 审计相关 ==========

/**
 * 认证审计记录
 */
export interface AuthenticationAuditRecord {
  uuid: string;
  accountUuid?: string;
  username: string;
  action: 'login' | 'logout' | 'token_refresh' | 'password_reset' | 'mfa_verify';
  result: 'success' | 'failure';
  reason?: string;
  timestamp: Date;
  clientInfo?: ClientInfo;
  sessionUuid?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: any;
}
