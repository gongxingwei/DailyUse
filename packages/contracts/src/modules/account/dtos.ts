/**
 * ==========================================
 * Account 模块数据传输对象 (DTOs) - RESTful API 设计
 * ==========================================
 *
 * 设计原则：
 * 1. RESTful 风格：所有请求数据在 JSON body 中，ID 在 URL path 参数中
 * 2. DTO vs ClientDTO：
 *    - DTO: 服务端内部传输对象（纯数据，时间为 number 类型的时间戳）
 *    - ClientDTO: 客户端渲染对象（包含计算属性和格式化数据，时间为 number 类型）
 * 3. Request DTO: 使用 Pick/Partial 模式，直接映射实体属性，前端生成 UUID
 * 4. Response: 统一格式，列表数据嵌套在 data.items 中，包含分页信息
 *
 * 类型组织：
 * - 基础 DTO（服务端传输）
 * - Client DTO（客户端使用）
 * - Request DTO（API 请求）
 * - Response DTO（API 响应）
 */

import { AccountStatus, AccountType, SessionStatus } from './enums';

// ========================================
// 基础 DTO - 服务端数据传输对象
// ========================================

/**
 * 账户数据传输对象（服务端）
 * 所有时间字段使用 number 类型（毫秒时间戳）
 */
export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  lastLoginAt?: number; // timestamp in milliseconds
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phoneNumber?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  user: UserDTO;
  roles?: RoleDTO[];
}

/**
 * 用户数据传输对象（服务端）
 */
export interface UserDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  addresses?: AddressDTO[];
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
}

/**
 * 角色数据传输对象（服务端）
 */
export interface RoleDTO {
  uuid: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions?: PermissionDTO[];
  createdAt?: number; // timestamp in milliseconds
  updatedAt?: number; // timestamp in milliseconds
}

/**
 * 权限数据传输对象（服务端）
 */
export interface PermissionDTO {
  uuid: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  conditions?: any;
  createdAt?: number; // timestamp in milliseconds
  updatedAt?: number; // timestamp in milliseconds
}

/**
 * 会话数据传输对象（服务端）
 * ⚠️ 修复：所有时间字段改为 number 类型（毫秒时间戳）
 */
export interface SessionDTO {
  uuid: string;
  accountUuid: string;
  status: SessionStatus;
  createdAt: number; // timestamp in milliseconds (FIXED from ISO string)
  lastAccessAt: number; // timestamp in milliseconds (FIXED from ISO string)
  expiresAt?: number; // timestamp in milliseconds (FIXED from ISO string)
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * 地址数据传输对象
 */
export interface AddressDTO {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
}

/**
 * 邮箱数据传输对象（服务端）
 */
export interface EmailDTO {
  uuid: string;
  userUuid: string;
  email: string;
  isVerified: boolean;
  isPrimary: boolean;
  verifiedAt?: number; // timestamp in milliseconds (FIXED from ISO string)
  createdAt: number; // timestamp in milliseconds (FIXED from ISO string)
}

/**
 * 电话数据传输对象（服务端）
 */
export interface PhoneNumberDTO {
  uuid: string;
  userUuid: string;
  phoneNumber: string;
  countryCode: string;
  isVerified: boolean;
  isPrimary: boolean;
  verifiedAt?: number; // timestamp in milliseconds (FIXED from ISO string)
  createdAt: number; // timestamp in milliseconds (FIXED from ISO string)
}

// ========================================
// Client DTO - 客户端使用的 DTO（包含计算属性）
// ========================================

/**
 * 账户客户端 DTO
 * 在 AccountDTO 基础上添加计算属性，用于前端渲染
 */
export interface AccountClientDTO extends AccountDTO {
  // 计算属性
  isActive: boolean; // status === 'active'
  daysSinceLastLogin?: number; // 距离上次登录的天数
  roleNames: string[]; // 角色名称数组
  hasVerifiedEmail: boolean; // isEmailVerified 的语义化别名
  hasVerifiedPhone: boolean; // isPhoneVerified 的语义化别名
}

/**
 * 用户客户端 DTO
 * 在 UserDTO 基础上添加计算属性
 */
export interface UserClientDTO extends UserDTO {
  // 计算属性
  fullName: string; // firstName + lastName
  initials: string; // 名字首字母（如 "John Doe" -> "JD"）
  hasAvatar: boolean; // !!avatar
  addressCount: number; // addresses?.length || 0
  hasSocialAccounts: boolean; // !!socialAccounts && Object.keys(socialAccounts).length > 0
}

/**
 * 角色客户端 DTO
 * 在 RoleDTO 基础上添加计算属性
 */
export interface RoleClientDTO extends RoleDTO {
  // 计算属性
  permissionCount: number; // permissions?.length || 0
  isSystemRole: boolean; // !!isSystem
  permissionNames: string[]; // permissions?.map(p => p.name) || []
}

/**
 * 权限客户端 DTO
 * 在 PermissionDTO 基础上添加计算属性
 */
export interface PermissionClientDTO extends PermissionDTO {
  // 计算属性
  displayName: string; // 格式化显示名称（如 "Read User Profile"）
  resourceAction: string; // resource:action 格式（如 "user:read"）
  hasConditions: boolean; // !!conditions
}

/**
 * 会话客户端 DTO
 * 在 SessionDTO 基础上添加计算属性
 */
export interface SessionClientDTO extends SessionDTO {
  // 计算属性
  isExpired: boolean; // Date.now() > expiresAt
  isActive: boolean; // status === 'active' && !isExpired
  minutesRemaining?: number; // (expiresAt - Date.now()) / 60000
  durationMinutes?: number; // (lastAccessAt - createdAt) / 60000
}

/**
 * 邮箱客户端 DTO
 */
export interface EmailClientDTO extends EmailDTO {
  // 计算属性
  domain: string; // email.split('@')[1]
  hasBeenVerified: boolean; // !!verifiedAt
  daysSinceVerification?: number; // verifiedAt 距今天数
}

/**
 * 电话客户端 DTO
 */
export interface PhoneNumberClientDTO extends PhoneNumberDTO {
  // 计算属性
  formattedNumber: string; // 格式化显示（如 "+86 138-xxxx-xxxx"）
  hasBeenVerified: boolean; // !!verifiedAt
  daysSinceVerification?: number; // verifiedAt 距今天数
}

/**
 * 用户信息DTO（包含账户信息）
 * 用于个人资料页面展示
 */
export interface UserInfoDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  socialAccounts?: { [key: string]: string };
  account: {
    uuid: string;
    username: string;
    email?: string;
    phone?: string;
    accountType: AccountType;
    status: AccountStatus;
  };
}

// ========================================
// Request DTO - API 请求对象（使用 Pick/Partial 模式）
// ========================================

/**
 * 创建账户请求
 * 前端生成 UUID，提供必要的账户信息
 */
export type CreateAccountRequest = Pick<AccountDTO, 'uuid' | 'username' | 'accountType'> & {
  password: string; // 密码（仅用于请求，不在响应中）
  confirmPassword: string; // 确认密码
  email?: string;
  phoneNumber?: string;
  // 用户信息
  firstName?: string;
  lastName?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
};

/**
 * 更新账户请求
 * 所有字段可选，只更新提供的字段
 */
export type UpdateAccountRequest = Partial<
  Omit<AccountDTO, 'uuid' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'user' | 'roles'>
> & {
  // 支持更新用户信息
  firstName?: string;
  lastName?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
};

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 创建用户请求
 */
export type CreateUserRequest = Pick<UserDTO, 'uuid'> & {
  firstName?: string;
  lastName?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
};

/**
 * 更新用户请求
 */
export type UpdateUserRequest = Partial<Omit<UserDTO, 'uuid' | 'createdAt' | 'updatedAt'>>;

/**
 * 创建角色请求
 */
export type CreateRoleRequest = Pick<RoleDTO, 'uuid' | 'name'> & {
  description?: string;
  permissionUuids?: string[]; // 关联的权限 UUID 列表
};

/**
 * 更新角色请求
 */
export type UpdateRoleRequest = Partial<
  Omit<RoleDTO, 'uuid' | 'createdAt' | 'updatedAt' | 'permissions'>
> & {
  permissionUuids?: string[]; // 更新关联的权限
};

/**
 * 创建权限请求
 */
export type CreatePermissionRequest = Pick<
  PermissionDTO,
  'uuid' | 'name' | 'resource' | 'action'
> & {
  description?: string;
  conditions?: any;
};

/**
 * 更新权限请求
 */
export type UpdatePermissionRequest = Partial<
  Omit<PermissionDTO, 'uuid' | 'createdAt' | 'updatedAt'>
>;

/**
 * 邮箱验证请求
 */
export interface VerifyEmailRequest {
  email: string;
  verificationToken: string;
}

/**
 * 电话验证请求
 */
export interface VerifyPhoneRequest {
  phoneNumber: string;
  verificationCode: string;
}

/**
 * 账户注销请求（软删除）
 */
export interface DeactivateAccountRequest {
  reason: string;
  confirmDeletion: boolean;
  feedback?: string;
}

// 保留旧的类型别名以兼容现有代码
/**
 * @deprecated 使用 CreateAccountRequest 替代
 */
export type AccountRegistrationRequest = CreateAccountRequest;

/**
 * @deprecated 使用 UpdateAccountRequest 替代
 */
export type AccountUpdateData = UpdateAccountRequest;

/**
 * @deprecated 使用 ChangePasswordRequest 替代
 */
export type PasswordChangeRequest = ChangePasswordRequest;

/**
 * @deprecated 使用 DeactivateAccountRequest 替代
 */
export type AccountDeactivationRequest = DeactivateAccountRequest;

// ========================================
// Response DTO - API 响应对象（嵌套 data 结构）
// ========================================

/**
 * 账户创建响应
 */
export interface AccountCreationResponse {
  data: {
    account: AccountClientDTO;
    initialSession?: SessionClientDTO;
  };
}

/**
 * 账户详情响应
 */
export interface AccountDetailResponse {
  data: AccountClientDTO;
}

/**
 * 账户列表响应
 * 标准分页格式
 */
export interface AccountListResponse {
  data: {
    accounts: AccountClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 用户信息响应
 */
export interface UserInfoResponse {
  data: UserInfoDTO;
}

/**
 * 角色详情响应
 */
export interface RoleDetailResponse {
  data: RoleClientDTO;
}

/**
 * 角色列表响应
 */
export interface RoleListResponse {
  data: {
    roles: RoleClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 权限详情响应
 */
export interface PermissionDetailResponse {
  data: PermissionClientDTO;
}

/**
 * 权限列表响应
 */
export interface PermissionListResponse {
  data: {
    permissions: PermissionClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 会话详情响应
 */
export interface SessionDetailResponse {
  data: SessionClientDTO;
}

/**
 * 会话列表响应
 */
export interface SessionListResponse {
  data: {
    sessions: SessionClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 权限验证响应
 */
export interface PermissionCheckResponse {
  data: {
    hasPermission: boolean;
    permissions: string[];
    roles: string[];
  };
}

/**
 * 登录响应
 */
export interface LoginResponse {
  data: {
    account: AccountClientDTO;
    session: SessionClientDTO;
    token: string; // JWT token
  };
}
