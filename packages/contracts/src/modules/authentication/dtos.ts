/**
 * ==========================================
 * Authentication 模块数据传输对象 (DTOs) - RESTful API 设计
 * ==========================================
 *
 * 设计原则：
 * 1. RESTful 风格：所有请求数据在 JSON body 中，ID 在 URL path 参数中
 * 2. DTO vs ClientDTO：
 *    - DTO: 服务端内部传输对象（纯数据，时间为 number 类型的时间戳）
 *    - ClientDTO: 客户端渲染对象（包含计算属性和格式化数据，时间为 number 类型）
 * 3. Request DTO: 使用 Pick/Partial 模式，直接映射实体属性
 * 4. Response: 统一格式，列表数据嵌套在 data 对象中，包含分页信息
 * 5. 时间戳格式：统一使用 number 类型（毫秒时间戳）
 *
 * 类型组织：
 * - 基础 DTO（服务端传输）
 * - Client DTO（客户端使用）
 * - Request DTO（API 请求）
 * - Response DTO（API 响应）
 */

import { AccountType } from '../account/enums';
import { AuthMethod, MFADeviceType, TokenType, SessionTerminationType } from './enums';

// ========================================
// 基础 DTO - 服务端数据传输对象
// ========================================

/**
 * 认证凭据数据传输对象（服务端）
 * 所有时间字段使用 number 类型（毫秒时间戳）
 */
export interface AuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  method: AuthMethod;
  identifier: string;
  isVerified: boolean;
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil?: number; // timestamp in milliseconds
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  lastAuthAt?: number; // timestamp in milliseconds
}

/**
 * 用户会话数据传输对象（服务端）
 */
export interface UserSessionDTO {
  uuid: string;
  accountUuid: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent?: string;
  status: string; // SessionStatus
  createdAt: number; // timestamp in milliseconds
  lastActiveAt: number; // timestamp in milliseconds
  expiresAt: number; // timestamp in milliseconds
  terminatedAt?: number; // timestamp in milliseconds
  terminationType?: SessionTerminationType;
  metadata?: Record<string, any>;
}

/**
 * MFA 设备数据传输对象（服务端）
 */
export interface MFADeviceDTO {
  uuid: string;
  accountUuid: string;
  type: MFADeviceType;
  name: string;
  secretKey?: string; // TOTP密钥（加密后）
  phoneNumber?: string; // SMS设备
  emailAddress?: string; // 邮箱设备
  isVerified: boolean;
  isEnabled: boolean;
  verificationAttempts: number;
  maxAttempts: number;
  isLocked: boolean;
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  lastUsedAt?: number; // timestamp in milliseconds
}

/**
 * 令牌数据传输对象（服务端）
 */
export interface TokenDTO {
  uuid: string;
  accountUuid: string;
  type: TokenType;
  value: string;
  deviceInfo?: string;
  issuedAt: number; // timestamp in milliseconds
  expiresAt: number; // timestamp in milliseconds
  isRevoked: boolean;
  revokedAt?: number; // timestamp in milliseconds
}

// ========================================
// Client DTO - 客户端渲染对象（包含计算属性）
// ========================================

/**
 * 认证凭据客户端 DTO - 前端渲染对象
 * 包含所有服务端数据 + 计算属性
 */
export interface AuthCredentialClientDTO extends AuthCredentialDTO {
  // 计算属性
  isLocked: boolean; // 是否被锁定
  lockTimeRemaining: number; // 锁定剩余时间（分钟）
  canAttemptLogin: boolean; // 是否可以尝试登录
  daysSinceLastAuth: number; // 距离上次认证的天数
}

/**
 * 用户会话客户端 DTO - 前端渲染对象
 */
export interface UserSessionClientDTO extends UserSessionDTO {
  // 计算属性
  isExpired: boolean; // 是否已过期
  isActive: boolean; // 是否激活
  minutesRemaining: number; // 剩余有效时间（分钟）
  durationMinutes: number; // 会话持续时间（分钟）
  isCurrent: boolean; // 是否为当前会话
}

/**
 * MFA 设备客户端 DTO - 前端渲染对象
 */
export interface MFADeviceClientDTO extends MFADeviceDTO {
  // 计算属性
  isUsable: boolean; // 是否可用（已验证且未锁定且已启用）
  daysSinceLastUsed?: number; // 距离上次使用的天数
  displayName: string; // 显示名称（类型 + 名称）
}

/**
 * 令牌客户端 DTO - 前端渲染对象
 */
export interface TokenClientDTO extends TokenDTO {
  // 计算属性
  isValid: boolean; // 是否有效（未过期且未撤销）
  isExpired: boolean; // 是否已过期
  minutesRemaining: number; // 剩余有效时间（分钟）
  typeName: string; // 令牌类型名称
}

// ========================================
// Request DTO - API 请求
// ========================================

/**
 * 登录请求 - POST /api/v1/auth/login
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  accountType?: AccountType;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
  };
  mfaCode?: string; // 如果需要 MFA
}

/**
 * 密码认证请求DTO（向后兼容）
 * @deprecated 使用 LoginRequest 代替
 */
export interface AuthByPasswordRequestDTO {
  username: string;
  password: string;
  remember: boolean;
  accountType: AccountType;
}

/**
 * 刷新令牌请求 - POST /api/v1/auth/refresh
 */
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: {
    deviceId: string;
    userAgent: string;
  };
}

/**
 * 登出请求 - POST /api/v1/auth/logout
 */
export interface LogoutRequest {
  sessionId?: string; // 如果不提供，使用当前会话
  allSessions?: boolean; // 是否登出所有会话
}

/**
 * 验证 MFA 请求 - POST /api/v1/auth/mfa/verify
 */
export interface VerifyMFARequest {
  sessionId: string;
  mfaCode: string;
  deviceId: string;
}

/**
 * 创建 MFA 设备请求 - POST /api/v1/auth/mfa/devices
 * 前端生成 uuid
 */
export type CreateMFADeviceRequest = Pick<MFADeviceDTO, 'uuid' | 'type' | 'name'> & {
  phoneNumber?: string; // SMS 设备需要
  emailAddress?: string; // Email 设备需要
  totpCode?: string; // TOTP 设备验证需要
};

/**
 * 更新 MFA 设备请求 - PATCH /api/v1/auth/mfa/devices/:deviceId
 */
export type UpdateMFADeviceRequest = Partial<Pick<MFADeviceDTO, 'name' | 'isEnabled'>>;

/**
 * 删除 MFA 设备请求 - DELETE /api/v1/auth/mfa/devices/:deviceId
 */
export interface DeleteMFADeviceRequest {
  verificationCode?: string; // 需要验证码确认
}

/**
 * 终止会话请求 - DELETE /api/v1/auth/sessions/:sessionId
 */
export interface TerminateSessionRequest {
  reason?: string; // 终止原因
}

/**
 * 密码更改请求 - POST /api/v1/auth/password/change
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  logoutAllSessions?: boolean; // 是否登出所有会话
}

// ========================================
// Response DTO - API 响应（嵌套 data 结构）
// ========================================

/**
 * 用户信息响应（用于登录成功后返回）
 */
export interface UserInfoDTO {
  uuid: string;
  username: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  status: string;
  lastLoginAt?: number; // timestamp in milliseconds
}

/**
 * 登录响应 - POST /api/v1/auth/login
 */
export interface LoginResponse {
  data: {
    user: UserInfoDTO;
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // 秒数
    tokenType: string; // "Bearer"
    sessionId: string;
    rememberToken?: string; // 如果 rememberMe 为 true
  };
}

/**
 * 认证响应（向后兼容）
 * @deprecated 使用 LoginResponse 代替
 */
export interface AuthResponse {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  rememberToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * 刷新令牌响应 - POST /api/v1/auth/refresh
 */
export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // 秒数
    tokenType: string; // "Bearer"
  };
}

/**
 * 登出响应 - POST /api/v1/auth/logout
 */
export interface LogoutResponse {
  data: {
    message: string;
    sessionsClosed: number; // 关闭的会话数
  };
}

/**
 * MFA 验证响应 - POST /api/v1/auth/mfa/verify
 */
export interface VerifyMFAResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    sessionId: string;
  };
}

/**
 * MFA 设备创建响应 - POST /api/v1/auth/mfa/devices
 */
export interface MFADeviceCreationResponse {
  data: {
    device: MFADeviceClientDTO;
    qrCode?: string; // TOTP 设备的二维码
    backupCodes?: string[]; // 备份码
  };
}

/**
 * MFA 设备详情响应 - GET /api/v1/auth/mfa/devices/:deviceId
 */
export interface MFADeviceDetailResponse {
  data: {
    device: MFADeviceClientDTO;
  };
}

/**
 * MFA 设备列表响应 - GET /api/v1/auth/mfa/devices
 */
export interface MFADeviceListResponse {
  data: {
    devices: MFADeviceClientDTO[];
    total: number;
  };
}

/**
 * 会话详情响应 - GET /api/v1/auth/sessions/:sessionId
 */
export interface SessionDetailResponse {
  data: {
    session: UserSessionClientDTO;
  };
}

/**
 * 会话列表响应 - GET /api/v1/auth/sessions
 */
export interface SessionListResponse {
  data: {
    sessions: UserSessionClientDTO[];
    total: number;
    current?: string; // 当前会话 ID
  };
}

/**
 * 密码更改响应 - POST /api/v1/auth/password/change
 */
export interface PasswordChangeResponse {
  data: {
    message: string;
    sessionsClosed?: number; // 如果 logoutAllSessions 为 true
  };
}
