import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface InterceptorConfig {
  enableAuth?: boolean;
  enableLogging?: boolean;
  enableRetry?: boolean;
  onAuthFail?: () => void;
}

export class HttpInterceptors {
  private instance: AxiosInstance;
  private config: InterceptorConfig;

  constructor(instance: AxiosInstance, config: InterceptorConfig = {}) {
    this.instance = instance;
    this.config = {
      enableAuth: true,
      enableLogging: import.meta.env.DEV,
      enableRetry: true,
      ...config,
    };
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  private setupRequestInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        // 认证拦截器
        if (this.config.enableAuth) {
          const token = this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 日志拦截器
        if (this.config.enableLogging) {
          console.log('🚀 Request:', {
            url: config.url,
            method: config.method,
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      },
    );
  }

  private setupResponseInterceptors() {
    this.instance.interceptors.response.use(
      (response) => {
        if (this.config.enableLogging) {
          console.log('✅ Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        if (this.config.enableLogging) {
          console.error('❌ Response Error:', error);
        }

        // 401错误处理
        if (error.response?.status === 401 && this.config.enableAuth) {
          this.handleAuthError();
        }

        // 重试逻辑
        if (this.config.enableRetry && this.shouldRetry(error)) {
          return this.retry(error.config);
        }

        return Promise.reject(error);
      },
    );
  }

  private getAuthToken(): string | null {
    // 动态获取token
    return localStorage.getItem('auth_token');
  }

  private handleAuthError() {
    if (this.config.onAuthFail) {
      this.config.onAuthFail();
    } else {
      // 默认处理
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private async retry(config: AxiosRequestConfig): Promise<any> {
    const retryCount = (config as any)._retryCount || 0;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      throw new Error('Max retries exceeded');
    }

    (config as any)._retryCount = retryCount + 1;

    // 延迟重试
    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

    return this.instance.request(config);
  }
}
