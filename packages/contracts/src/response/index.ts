/**
 * 响应系统类型定义
 * 提供统一的API响应格式和错误处理机制
 */

/**
 * 基础响应状态码枚举
 */
export const ResponseStatus = {
  // 成功状态
  SUCCESS: 'SUCCESS',

  // 客户端错误 4xx
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',

  // 服务器错误 5xx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // 业务逻辑错误
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  DOMAIN_ERROR: 'DOMAIN_ERROR',
} as const;

export type ResponseStatus = (typeof ResponseStatus)[keyof typeof ResponseStatus];

/**
 * 响应严重级别
 */
export const ResponseSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ResponseSeverity = (typeof ResponseSeverity)[keyof typeof ResponseSeverity];

/**
 * 错误详情接口
 */
export interface ErrorDetail {
  /** 错误字段名 */
  field?: string;
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误值 */
  value?: any;
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 响应元数据
 */
export interface ResponseMetadata {
  /** 请求ID，用于追踪 */
  requestId?: string;
  /** 响应时间戳 */
  timestamp: number;
  /** API版本 */
  version?: string;
  /** 处理耗时（毫秒） */
  duration?: number;
  /** 服务节点标识 */
  nodeId?: string;
}

/**
 * 基础响应接口
 */
export interface BaseResponse {
  /** 响应状态 */
  status: ResponseStatus;
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 严重级别 */
  severity?: ResponseSeverity;
  /** 响应元数据 */
  metadata: ResponseMetadata;
}

/**
 * 成功响应接口
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  status: typeof ResponseStatus.SUCCESS;
  success: true;
  /** 响应数据 */
  data: T;
  /** 分页信息（如果适用） */
  pagination?: PaginationInfo;
}

/**
 * API错误响应接口
 */
export interface ApiErrorResponse extends BaseResponse {
  success: false;
  /** 错误代码 */
  errorCode?: string;
  /** 错误详情列表 */
  errors?: ErrorDetail[];
  /** 调试信息（仅开发环境） */
  debug?: {
    stack?: string;
    query?: any;
    params?: any;
    body?: any;
  };
}

/**
 * 通用响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ApiErrorResponse;

/**
 * 响应构建器选项
 */
export interface ResponseBuilderOptions {
  /** 请求ID */
  requestId?: string;
  /** API版本 */
  version?: string;
  /** 处理开始时间 */
  startTime?: number;
  /** 服务节点ID */
  nodeId?: string;
  /** 是否包含调试信息 */
  includeDebug?: boolean;
}

/**
 * 列表响应数据结构
 */
export interface ListResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 分页信息 */
  pagination: PaginationInfo;
}

/**
 * 批量操作响应
 */
export interface BatchResponse<T = any> {
  /** 成功处理的数量 */
  successCount: number;
  /** 失败处理的数量 */
  failureCount: number;
  /** 总数量 */
  totalCount: number;
  /** 成功的项目 */
  successes?: T[];
  /** 失败的项目详情 */
  failures?: Array<{
    item: any;
    error: ErrorDetail;
  }>;
}

// 导出状态码相关工具
export * from './statusCodes';
