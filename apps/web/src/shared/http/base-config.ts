import type { AxiosRequestConfig } from 'axios';

export interface HttpConfig extends AxiosRequestConfig {
  // 可以扩展自定义配置
  enableAuth?: boolean;
  enableLogging?: boolean;
  retryCount?: number;
}

export const baseConfig: HttpConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  enableAuth: true,
  enableLogging: import.meta.env.DEV,
  retryCount: 3,
};
