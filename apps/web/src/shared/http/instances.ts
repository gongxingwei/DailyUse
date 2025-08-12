import { HttpFactory } from './http-factory';

// 主API实例 - 需要认证
export const apiClient = HttpFactory.create(
  'api',
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  {
    enableAuth: true,
    enableLogging: import.meta.env.DEV,
    enableRetry: true,
  },
);

// 公共API实例 - 不需要认证
export const publicApiClient = HttpFactory.create(
  'public-api',
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  {
    enableAuth: false,
    enableLogging: import.meta.env.DEV,
    enableRetry: true,
  },
);

// 文件上传实例 - 特殊配置
export const uploadClient = HttpFactory.create(
  'upload',
  {
    baseURL: import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 60000, // 60秒超时
    headers: {
      // 不设置Content-Type，让浏览器自动设置boundary
    },
  },
  {
    enableAuth: true,
    enableLogging: import.meta.env.DEV,
    enableRetry: false, // 文件上传不重试
  },
);

// 外部服务实例 - 如果你有外部API调用
export const externalApiClient = HttpFactory.create(
  'external',
  {
    baseURL: 'https://api.external-service.com',
    timeout: 5000,
  },
  {
    enableAuth: false,
    enableLogging: false,
    enableRetry: true,
  },
);
