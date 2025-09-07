/**
 * 前端API客户端工具函数
 */

/**
 * 获取环境配置
 */
export interface EnvironmentConfig {
  apiBaseUrl: string;
  uploadBaseUrl: string;
  timeout: number;
  enableMock: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
}

/**
 * 获取当前环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // 安全地访问环境变量，在构建时避免 TypeScript 错误
  const env = (globalThis as any).import?.meta?.env || (process as any)?.env || {};

  const config: EnvironmentConfig = {
    apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    uploadBaseUrl: env.VITE_UPLOAD_BASE_URL || 'http://localhost:3000/api/v1/upload',
    timeout: Number(env.VITE_API_TIMEOUT) || 10000,
    enableMock: env.VITE_ENABLE_MOCK === 'true',
    logLevel: env.VITE_LOG_LEVEL || 'info',
  };

  return config;
}

/**
 * 创建认证头
 */
export function createAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  const env = (globalThis as any).import?.meta?.env || (process as any)?.env || {};
  return env.DEV || env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  const env = (globalThis as any).import?.meta?.env || (process as any)?.env || {};
  return env.PROD || env.NODE_ENV === 'production';
}

/**
 * 安全地解析JSON
 */
export function safeParseJSON<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 生成唯一请求ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建查询字符串
 */
export function createQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * 延迟函数（用于重试机制）
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 指数退避延迟计算
 */
export function exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // 最大30秒
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return (
    !error.response ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ECONNABORTED' ||
    error.message === 'Network Error'
  );
}

/**
 * 检查是否应该重试
 */
export function shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) return false;

  // 网络错误重试
  if (isNetworkError(error)) return true;

  // 5xx服务器错误重试
  if (error.response?.status >= 500) return true;

  // 429 限流错误重试
  if (error.response?.status === 429) return true;

  return false;
}

/**
 * 创建缓存键
 */
export function createCacheKey(method: string, url: string, params?: any): string {
  const baseKey = `${method.toUpperCase()}:${url}`;

  if (!params) return baseKey;

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as any);

  return `${baseKey}:${JSON.stringify(sortedParams)}`;
}

/**
 * 检查缓存是否过期
 */
export function isCacheExpired(timestamp: number, timeout: number): boolean {
  return Date.now() - timestamp > timeout;
}

/**
 * 清理过期缓存
 */
export function cleanExpiredCache<T>(
  cache: Map<string, { data: T; timestamp: number }>,
  timeout: number,
): void {
  const now = Date.now();

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > timeout) {
      cache.delete(key);
    }
  }
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as any;

  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    }, wait);

    if (callNow) func.apply(this, args);
  };
}
