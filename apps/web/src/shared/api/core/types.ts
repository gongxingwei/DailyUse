/**
 * 前端API客户端类型定义
 * 基于packages/contracts的类型定义
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API客户端配置
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  enableAuth?: boolean;
  enableCache?: boolean;
  enableLogging?: boolean;
  retryCount?: number;
  retryDelay?: number;
  cacheTimeout?: number;
}

/**
 * 请求选项
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  enableCache?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
  params?: Record<string, any>;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginatedData<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  onUploadProgress?: (progressEvent: UploadProgress) => void;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  loaded: number;
  total?: number;
  progress?: number;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * 文件上传进度回调
 */
export interface UploadProgressCallback {
  (progressEvent: UploadProgress): void;
}

/**
 * 基础API响应
 */
export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

/**
 * 成功响应
 */
export interface SuccessResponse<T = any> extends BaseApiResponse<T> {
  success: true;
  data: T;
}

/**
 * 错误响应
 */
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  errors: string[];
}

/**
 * API客户端接口
 */
export interface IApiClient {
  get<T = any>(url: string, options?: RequestOptions): Promise<T>;
  post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T = any>(url: string, options?: RequestOptions): Promise<T>;
  patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  upload<T = any>(url: string, file: File | FormData, options?: UploadOptions): Promise<T>;
  download(url: string, filename?: string, options?: RequestOptions): Promise<void>;
}

/**
 * HTTP客户端配置扩展
 */
export interface HttpClientConfig extends AxiosRequestConfig, Partial<ApiClientConfig> {
  // 认证配置
  authType?: 'bearer' | 'basic';

  // 重试配置
  enableRetry?: boolean;
  retryCondition?: (error: any) => boolean;

  // 错误处理
  errorHandler?: (error: any) => void;
  authFailHandler?: () => void;

  // 请求变换
  requestTransformer?: (config: AxiosRequestConfig) => AxiosRequestConfig;
  responseTransformer?: <T>(response: AxiosResponse<T>) => T;
}
