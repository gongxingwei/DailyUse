/**
 * SessionManagement 模块类型定义
 *
 * 定义会话管理相关的接口、枚举和类型
 */

// ========== 枚举类型 ==========

/**
 * 会话状态枚举
 */
export enum SessionStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已撤销 */
  REVOKED = 'revoked',
  /** 已暂停 */
  SUSPENDED = 'suspended',
  /** 待激活 */
  PENDING = 'pending',
}

/**
 * 会话类型枚举
 */
export enum SessionType {
  /** 标准会话 */
  STANDARD = 'standard',
  /** 记住我会话 */
  REMEMBER_ME = 'remember_me',
  /** 临时会话 */
  TEMPORARY = 'temporary',
  /** 管理员会话 */
  ADMIN = 'admin',
}

/**
 * 会话终止原因枚举
 */
export enum SessionTerminationReason {
  /** 正常登出 */
  NORMAL_LOGOUT = 'normal_logout',
  /** 会话超时 */
  TIMEOUT = 'timeout',
  /** 手动撤销 */
  MANUAL_REVOKE = 'manual_revoke',
  /** 安全原因 */
  SECURITY_VIOLATION = 'security_violation',
  /** 并发会话限制 */
  CONCURRENT_SESSION_LIMIT = 'concurrent_session_limit',
  /** 密码更改 */
  PASSWORD_CHANGED = 'password_changed',
  /** 账户被锁定 */
  ACCOUNT_LOCKED = 'account_locked',
  /** 系统维护 */
  SYSTEM_MAINTENANCE = 'system_maintenance',
}

/**
 * 设备类型枚举
 */
export enum DeviceType {
  /** 桌面应用 */
  DESKTOP = 'desktop',
  /** 网页浏览器 */
  WEB = 'web',
  /** 移动应用 */
  MOBILE = 'mobile',
  /** 未知设备 */
  UNKNOWN = 'unknown',
}

// ========== 接口定义 ==========

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  deviceName?: string;
  /** 设备类型 */
  deviceType: DeviceType;
  /** 操作系统 */
  os?: string;
  /** 操作系统版本 */
  osVersion?: string;
  /** 浏览器 */
  browser?: string;
  /** 浏览器版本 */
  browserVersion?: string;
  /** 应用版本 */
  appVersion?: string;
  /** 设备指纹 */
  fingerprint?: string;
  /** 屏幕分辨率 */
  screenResolution?: string;
  /** 时区 */
  timezone?: string;
  /** 语言设置 */
  language?: string;
}

/**
 * 会话安全配置接口
 */
export interface SessionSecurityConfig {
  /** 会话超时时间（秒） */
  timeoutSeconds: number;
  /** 空闲超时时间（秒） */
  idleTimeoutSeconds: number;
  /** 最大并发会话数 */
  maxConcurrentSessions: number;
  /** 是否启用IP验证 */
  ipValidationEnabled: boolean;
  /** 是否启用设备验证 */
  deviceValidationEnabled: boolean;
  /** 是否需要双因素认证 */
  mfaRequired: boolean;
  /** 是否允许记住我 */
  rememberMeAllowed: boolean;
  /** 记住我最大天数 */
  rememberMeMaxDays: number;
}

/**
 * 用户会话接口
 */
export interface IUserSession {
  /** 会话UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 用户名 */
  username: string;
  /** 账户类型 */
  accountType: string;
  /** 会话类型 */
  sessionType: SessionType;
  /** 访问令牌 */
  token?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 是否记住我 */
  rememberMe: boolean;
  /** 是否自动登录 */
  autoLogin: boolean;
  /** 会话状态 */
  status: SessionStatus;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessAt: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** IP地址 */
  ipAddress?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 设备信息 */
  deviceInfo?: DeviceInfo;
  /** 安全配置 */
  securityConfig: SessionSecurityConfig;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 会话管理器配置接口
 */
export interface SessionManagerConfig {
  /** 默认会话超时时间（秒） */
  defaultTimeoutSeconds: number;
  /** 默认空闲超时时间（秒） */
  defaultIdleTimeoutSeconds: number;
  /** 会话清理间隔（秒） */
  cleanupIntervalSeconds: number;
  /** 是否启用会话持久化 */
  persistentSession: boolean;
  /** 会话存储路径 */
  sessionStoragePath?: string;
  /** 最大会话历史记录数 */
  maxSessionHistory: number;
}

/**
 * 会话活动记录接口
 */
export interface SessionActivity {
  /** 活动UUID */
  uuid: string;
  /** 会话UUID */
  sessionUuid: string;
  /** 活动类型 */
  activityType: 'login' | 'access' | 'refresh' | 'logout' | 'timeout' | 'revoke';
  /** 活动时间 */
  timestamp: Date;
  /** IP地址 */
  ipAddress?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 活动详情 */
  details?: Record<string, any>;
  /** 风险评分 */
  riskScore?: number;
}

/**
 * 会话统计信息接口
 */
export interface SessionStatistics {
  /** 总会话数 */
  totalSessions: number;
  /** 活跃会话数 */
  activeSessions: number;
  /** 过期会话数 */
  expiredSessions: number;
  /** 撤销会话数 */
  revokedSessions: number;
  /** 平均会话时长（秒） */
  averageSessionDuration: number;
  /** 最长会话时长（秒） */
  maxSessionDuration: number;
  /** 今日登录次数 */
  todayLogins: number;
  /** 本周登录次数 */
  weeklyLogins: number;
  /** 本月登录次数 */
  monthlyLogins: number;
}

/**
 * 会话验证结果接口
 */
export interface SessionValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 会话信息 */
  session?: IUserSession;
  /** 错误代码 */
  errorCode?: string;
  /** 错误消息 */
  errorMessage?: string;
  /** 需要刷新 */
  needsRefresh?: boolean;
  /** 风险级别 */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 会话刷新结果接口
 */
export interface SessionRefreshResult {
  /** 是否成功 */
  success: boolean;
  /** 新的会话信息 */
  session?: IUserSession;
  /** 新的访问令牌 */
  newToken?: string;
  /** 新的刷新令牌 */
  newRefreshToken?: string;
  /** 错误消息 */
  errorMessage?: string;
}

/**
 * 会话查询参数接口
 */
export interface SessionQueryParams {
  /** 账户UUID */
  accountUuid?: string;
  /** 会话状态 */
  status?: SessionStatus[];
  /** 会话类型 */
  sessionType?: SessionType[];
  /** 设备类型 */
  deviceType?: DeviceType[];
  /** 开始时间 */
  startDate?: Date;
  /** 结束时间 */
  endDate?: Date;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}
