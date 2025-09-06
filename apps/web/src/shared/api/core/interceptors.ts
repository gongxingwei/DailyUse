/**
 * HTTP拦截器管理器
 * 统一管理请求和响应拦截器
 */

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { HttpClientConfig, BaseApiResponse, ErrorResponse } from './types';
import { environmentConfig } from './config';

// 扩展 Axios 配置类型以支持自定义元数据
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    requestId: string;
    startTime: number;
  };
  _retry?: boolean;
}

/**
 * 认证管理器
 */
class AuthManager {
  private static readonly TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly REMEMBER_TOKEN_KEY = 'remember_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 获取记住我令牌
   */
  static getRememberToken(): string | null {
    return localStorage.getItem(this.REMEMBER_TOKEN_KEY);
  }

  /**
   * 获取令牌过期时间
   */
  static getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }

  /**
   * 设置令牌
   */
  static setTokens(
    accessToken: string,
    refreshToken?: string,
    rememberToken?: string,
    expiresIn?: number,
  ): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);

    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    if (rememberToken) {
      localStorage.setItem(this.REMEMBER_TOKEN_KEY, rememberToken);
    }
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  }

  /**
   * 更新访问令牌
   */
  static updateAccessToken(accessToken: string, expiresIn?: number): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);

    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  }

  /**
   * 清除令牌
   */
  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * 检查是否已认证
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * 检查 Token 是否过期
   */
  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() >= expiry;
  }

  /**
   * 检查是否需要刷新 Token
   */
  static needsRefresh(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() >= expiry - 5 * 60 * 1000; // 提前5分钟
  }

  /**
   * 获取 Authorization Header 值
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }
}

/**
 * 日志管理器
 */
class LogManager {
  private static shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevel = environmentConfig.logLevel;
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(level);

    return currentIndex !== -1 && targetIndex >= currentIndex;
  }

  static debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [API Debug] ${message}`, data);
    }
  }

  static info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [API Info] ${message}`, data);
    }
  }

  static warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [API Warning] ${message}`, data);
    }
  }

  static error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(`❌ [API Error] ${message}`, data);
    }
  }
}

/**
 * HTTP拦截器管理器
 */
export class InterceptorManager {
  private instance: AxiosInstance;
  private config: HttpClientConfig;
  private requestId = 0;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(instance: AxiosInstance, config: HttpClientConfig) {
    this.instance = instance;
    this.config = config;
    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // 生成请求ID
        const requestId = `req-${++this.requestId}-${Date.now()}`;
        config.metadata = { requestId, startTime: Date.now() };

        // 认证处理
        if (this.config.enableAuth && AuthManager.isAuthenticated()) {
          const token = AuthManager.getAccessToken();
          if (token) {
            config.headers = config.headers || {};
            if (this.config.authType === 'basic') {
              config.headers.Authorization = `Basic ${token}`;
            } else {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        }

        // 请求变换
        if (this.config.requestTransformer) {
          const transformedConfig = this.config.requestTransformer(config);
          Object.assign(config, transformedConfig);
        }

        // 日志记录
        if (this.config.enableLogging) {
          LogManager.info(`发起请求: ${config.method?.toUpperCase()} ${config.url}`, {
            requestId,
            headers: config.headers,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        LogManager.error('请求拦截器错误', error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => {
        const config = response.config as ExtendedAxiosRequestConfig;
        const requestId = config.metadata?.requestId;
        const startTime = config.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : 0;

        // 日志记录
        if (this.config.enableLogging) {
          LogManager.info(`请求完成: ${response.status} ${response.config.url}`, {
            requestId,
            duration: `${duration}ms`,
            status: response.status,
            data: response.data,
          });
        }

        // 响应变换
        if (this.config.responseTransformer) {
          return this.config.responseTransformer(response);
        }

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as ExtendedAxiosRequestConfig;
        const requestId = config?.metadata?.requestId;
        const startTime = config?.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : 0;

        LogManager.error(`请求失败: ${error.config?.url}`, {
          requestId,
          duration: `${duration}ms`,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        // 401 错误处理 - Token 过期或无效
        if (error.response?.status === 401 && !config._retry) {
          if (this.isRefreshing) {
            // 如果正在刷新，将请求加入队列
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
              }
              return this.instance(config);
            });
          }

          config._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);

            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.instance(config);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.handleUnauthorized();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // 处理其他错误状态
        await this.handleErrorStatus(error);

        // 重试逻辑
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        // 错误处理
        if (this.config.errorHandler) {
          this.config.errorHandler(error);
        }

        return Promise.reject(this.transformError(error));
      },
    );
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // 使用原始 axios 实例避免拦截器循环
      const response = await this.instance.post(
        '/api/auth/refresh',
        {
          refreshToken,
        },
        {
          headers: {
            'X-Skip-Auth': 'true', // 标记为刷新请求，避免重复拦截
          },
        } as any,
      );

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      // 更新 AuthManager
      AuthManager.updateAccessToken(accessToken, expiresIn);
      if (newRefreshToken) {
        AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);
      }

      return accessToken;
    } catch (error) {
      LogManager.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * 处理队列中的请求
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * 处理错误状态
   */
  private async handleErrorStatus(error: AxiosError): Promise<void> {
    const status = error.response?.status;

    if (status === 403) {
      // 禁止访问
      LogManager.warn('访问被禁止', error.response?.data);
      // 通知应用显示权限不足提示
      window.dispatchEvent(
        new CustomEvent('api:forbidden', {
          detail: { message: '访问被禁止' },
        }),
      );
    } else if (status === 429) {
      // 请求过于频繁
      LogManager.warn('请求过于频繁，请稍后再试', error.response?.data);
      window.dispatchEvent(
        new CustomEvent('api:rate_limit', {
          detail: { message: '请求过于频繁，请稍后再试' },
        }),
      );
    } else if (status === 500) {
      // 服务器错误
      LogManager.error('服务器内部错误', error.response?.data);
      window.dispatchEvent(
        new CustomEvent('api:server_error', {
          detail: { message: '服务器错误，请稍后再试' },
        }),
      );
    }
  }

  /**
   * 处理未授权错误
   */
  private async handleUnauthorized(): Promise<void> {
    LogManager.warn('认证失败，清除令牌');

    AuthManager.clearTokens();

    if (this.config.authFailHandler) {
      this.config.authFailHandler();
    } else {
      // 默认跳转到登录页
      window.location.href = '/auth/login';
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!this.config.enableRetry) return false;

    const retryCount = (error.config as any)?._retryCount || 0;
    const maxRetries = this.config.retryCount || 3;

    if (retryCount >= maxRetries) return false;

    // 自定义重试条件
    if (this.config.retryCondition) {
      return this.config.retryCondition(error);
    }

    // 默认重试条件：网络错误、超时、5xx错误
    return (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'NETWORK_ERROR' ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  /**
   * 重试请求
   */
  private async retryRequest(error: AxiosError): Promise<any> {
    const config = error.config as any;
    const retryCount = config._retryCount || 0;
    const delay = this.config.retryDelay || 1000;

    config._retryCount = retryCount + 1;

    LogManager.info(`重试请求 (${config._retryCount}/${this.config.retryCount}): ${config.url}`);

    // 指数退避延迟
    await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, retryCount)));

    return this.instance.request(config);
  }

  /**
   * 转换错误格式
   */
  private transformError(error: AxiosError): ErrorResponse {
    const response = error.response;
    const config = error.config as ExtendedAxiosRequestConfig;

    // 如果是我们自己的API错误格式，直接返回
    if (response?.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data as ErrorResponse;
    }

    // 转换为标准错误格式
    return {
      success: false,
      message: this.getErrorMessage(error),
      errors: [this.getErrorMessage(error)],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: AxiosError): string {
    if (
      error.response?.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data
    ) {
      return (error.response.data as any).message;
    }

    const status = error.response?.status;

    switch (status) {
      case 400:
        return '请求参数错误';
      case 401:
        return '未授权访问';
      case 403:
        return '访问被禁止';
      case 404:
        return '请求的资源不存在';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
        return '服务器内部错误';
      case 502:
        return '网关错误';
      case 503:
        return '服务暂时不可用';
      case 504:
        return '网关超时';
      default:
        if (error.code === 'ECONNABORTED') return '请求超时';
        if (error.code === 'NETWORK_ERROR') return '网络连接错误';
        return error.message || '未知错误';
    }
  }
}

/**
 * 导出认证管理器
 */
export { AuthManager };
