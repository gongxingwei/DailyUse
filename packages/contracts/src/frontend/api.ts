import { z } from 'zod';

/**
 * 前端API客户端相关类型定义
 */

// =================== HTTP 客户端配置 ===================

/**
 * API客户端配置
 */
export const ApiClientConfigSchema = z.object({
  baseURL: z.string(),
  timeout: z.number().default(10000),
  enableAuth: z.boolean().default(true),
  enableCache: z.boolean().default(false),
  enableLogging: z.boolean().default(false),
  retryCount: z.number().default(3),
  retryDelay: z.number().default(1000),
  cacheTimeout: z.number().default(300000), // 5分钟
});

export type ApiClientConfig = z.infer<typeof ApiClientConfigSchema>;

/**
 * 请求选项
 */
export const RequestOptionsSchema = z.object({
  timeout: z.number().optional(),
  retries: z.number().optional(),
  enableCache: z.boolean().optional(),
  signal: z.any().optional(), // AbortSignal
  headers: z.record(z.string()).optional(),
  validateStatus: z.function().optional(),
});

export type RequestOptions = z.infer<typeof RequestOptionsSchema>;

/**
 * 分页参数
 */
export const PaginationParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * 分页响应数据
 */
export const PaginatedDataSchema = z.object({
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PaginatedData<T = any> = Omit<z.infer<typeof PaginatedDataSchema>, 'items'> & {
  items: T[];
};

// =================== 文件上传相关 ===================

/**
 * 文件上传选项
 */
export const UploadOptionsSchema = z.object({
  maxFileSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
  onUploadProgress: z.function().optional(),
  timeout: z.number().optional(),
});

export type UploadOptions = z.infer<typeof UploadOptionsSchema>;

/**
 * 上传进度信息
 */
export const UploadProgressSchema = z.object({
  loaded: z.number(),
  total: z.number(),
  progress: z.number().min(0).max(100),
});

export type UploadProgress = z.infer<typeof UploadProgressSchema>;

/**
 * 文件上传响应
 */
export const FileUploadResponseSchema = z.object({
  url: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadedAt: z.string(),
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

// =================== 认证相关扩展 ===================

/**
 * 扩展登录请求（包含设备信息）
 */
export const FrontendLoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
  deviceInfo: z
    .object({
      deviceId: z.string(),
      deviceName: z.string(),
      userAgent: z.string(),
      ipAddress: z.string().optional(),
    })
    .optional(),
});

export type FrontendLoginRequest = z.infer<typeof FrontendLoginRequestSchema>;

/**
 * 前端用户信息（简化版）
 */
export const FrontendUserInfoSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  username: z.string(),
  email: z.string(),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  status: z.string(),
  lastLoginAt: z.string().optional(),
});

export type FrontendUserInfo = z.infer<typeof FrontendUserInfoSchema>;

/**
 * 前端登录响应
 */
export const FrontendLoginResponseSchema = z.object({
  user: FrontendUserInfoSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string().default('Bearer'),
});

export type FrontendLoginResponse = z.infer<typeof FrontendLoginResponseSchema>;

/**
 * 刷新令牌请求
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * 会话信息
 */
export const SessionInfoSchema = z.object({
  id: z.string(),
  deviceInfo: z.string(),
  ipAddress: z.string(),
  location: z.string().optional(),
  lastActivity: z.string(),
  isCurrent: z.boolean(),
});

export type SessionInfo = z.infer<typeof SessionInfoSchema>;

/**
 * MFA验证请求
 */
export const MFAVerifyRequestSchema = z.object({
  sessionId: z.string(),
  code: z.string(),
  deviceType: z.string().optional(),
});

export type MFAVerifyRequest = z.infer<typeof MFAVerifyRequestSchema>;

// =================== 账户管理相关扩展 ===================

/**
 * 前端账户查询参数
 */
export const FrontendAccountQueryParamsSchema = PaginationParamsSchema.extend({
  status: z.string().optional(),
  keyword: z.string().optional(),
  accountType: z.string().optional(),
});

export type FrontendAccountQueryParams = z.infer<typeof FrontendAccountQueryParamsSchema>;

/**
 * 前端账户信息
 */
export const FrontendAccountInfoSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().optional(),
});

export type FrontendAccountInfo = z.infer<typeof FrontendAccountInfoSchema>;

/**
 * 前端创建账户请求
 */
export const FrontendCreateAccountRequestSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  nickname: z.string().optional(),
});

export type FrontendCreateAccountRequest = z.infer<typeof FrontendCreateAccountRequestSchema>;

/**
 * 前端更新账户请求
 */
export const FrontendUpdateAccountRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
});

export type FrontendUpdateAccountRequest = z.infer<typeof FrontendUpdateAccountRequestSchema>;

/**
 * 邮箱验证请求
 */
export const EmailVerifyRequestSchema = z.object({
  token: z.string(),
});

export type EmailVerifyRequest = z.infer<typeof EmailVerifyRequestSchema>;

/**
 * 手机验证请求
 */
export const PhoneVerifyRequestSchema = z.object({
  code: z.string(),
});

export type PhoneVerifyRequest = z.infer<typeof PhoneVerifyRequestSchema>;

// =================== API错误相关 ===================

/**
 * 前端API错误详情
 */
export const FrontendApiErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export type FrontendApiErrorDetail = z.infer<typeof FrontendApiErrorDetailSchema>;

/**
 * 前端API错误响应
 */
export const FrontendApiErrorResponseSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
  errors: z.array(FrontendApiErrorDetailSchema).optional(),
  timestamp: z.string(),
  path: z.string().optional(),
});

export type FrontendApiErrorResponse = z.infer<typeof FrontendApiErrorResponseSchema>;
