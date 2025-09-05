/**
 * 环境配置管理
 * 统一管理不同环境下的API配置
 */

/**
 * 环境配置类型
 */
export interface EnvironmentConfig {
  apiBaseUrl: string;
  uploadBaseUrl?: string;
  timeout: number;
  enableMock: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
}

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    uploadBaseUrl: import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:3000/api/v1/upload',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
  };

  return config;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
}

/**
 * 导出当前环境配置
 */
export const environmentConfig = getEnvironmentConfig();
