/**
 * 核心API客户端
 * 提供统一的HTTP请求接口
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  IApiClient,
  HttpClientConfig,
  RequestOptions,
  UploadOptions,
  SuccessResponse,
  ErrorResponse,
} from './types';
import { InterceptorManager } from './interceptors';
import { environmentConfig } from './config';

/**
 * 默认HTTP客户端配置
 */
const defaultConfig: HttpClientConfig = {
  baseURL: environmentConfig.apiBaseUrl,
  timeout: environmentConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  enableAuth: true,
  authType: 'bearer',
  enableLogging: environmentConfig.logLevel !== 'silent',
  enableRetry: true,
  retryCount: 3,
  retryDelay: 1000,
  enableCache: false,
  cacheTimeout: 300000, // 5分钟
};

/**
 * 核心API客户端类
 */
export class ApiClient implements IApiClient {
  private instance: AxiosInstance;
  private config: HttpClientConfig;
  private requestCache = new Map<string, { data: any; timestamp: number }>();

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.instance = axios.create(this.config);

    // 设置拦截器
    new InterceptorManager(this.instance, this.config);
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const cacheKey = this.getCacheKey('GET', url, options);

    // 检查缓存
    if (options.enableCache !== false && this.config.enableCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.instance.get(url, {
      ...options,
      params: options.params,
    });

    const result = this.extractData<T>(response.data);

    // 缓存结果
    if (options.enableCache !== false && this.config.enableCache) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.post(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.put(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.delete(url, options);
    return this.extractData<T>(response.data);
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.patch(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * 文件上传
   */
  async upload<T = any>(
    url: string,
    file: File | FormData,
    options: UploadOptions = {},
  ): Promise<T> {
    let formData: FormData;

    if (file instanceof FormData) {
      formData = file;
    } else {
      // 验证文件
      this.validateFile(file, options);

      formData = new FormData();
      formData.append('file', file);
    }

    const response = await this.instance.post(url, formData, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options.onUploadProgress) {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          options.onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            progress,
          });
        }
      },
    });

    return this.extractData<T>(response.data);
  }

  /**
   * 文件下载
   */
  async download(url: string, filename?: string, options: RequestOptions = {}): Promise<void> {
    const response = await this.instance.get(url, {
      ...options,
      responseType: 'blob',
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = filename || this.getFilenameFromResponse(response) || 'download';
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 取消请求
   */
  cancelRequest(requestId: string): void {
    // TODO: 实现请求取消逻辑
    console.warn('请求取消功能暂未实现', requestId);
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.requestCache.clear();
    }
  }

  /**
   * 获取Axios实例（用于特殊需求）
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * 验证文件
   */
  private validateFile(file: File, options: UploadOptions): void {
    // 文件大小验证
    if (options.maxFileSize && file.size > options.maxFileSize) {
      throw new Error(`文件大小超过限制: ${options.maxFileSize / 1024 / 1024}MB`);
    }

    // 文件类型验证
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileType = file.type;
      const isAllowed = options.allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
    }
  }

  /**
   * 从响应中提取数据
   */
  private extractData<T>(responseData: any): T {
    // 如果是标准的API响应格式
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      const apiResponse = responseData as SuccessResponse<T> | ErrorResponse;

      if (apiResponse.success === true) {
        return (apiResponse as SuccessResponse<T>).data;
      } else {
        // 错误响应，抛出异常
        throw new Error(apiResponse.message || '请求失败');
      }
    }

    // 直接返回数据
    return responseData as T;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(method: string, url: string, options: any): string {
    const params = options.params ? JSON.stringify(options.params) : '';
    return `${method}:${url}:${params}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const timeout = this.config.cacheTimeout || 300000;

    if (now - cached.timestamp > timeout) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 从响应头获取文件名
   */
  private getFilenameFromResponse(response: any): string | null {
    const contentDisposition = response.headers['content-disposition'];
    if (!contentDisposition) return null;

    const matches = contentDisposition.match(/filename[^;=\\n]*=((['\"]*)(.*?)\\2|[^;\\n]*)/);
    return matches && matches[3] ? matches[3] : null;
  }
}

/**
 * 创建API客户端实例
 */
export function createApiClient(config?: Partial<HttpClientConfig>): ApiClient {
  return new ApiClient(config);
}
