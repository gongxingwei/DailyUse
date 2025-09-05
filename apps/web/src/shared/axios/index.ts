import axios, { type AxiosInstance } from 'axios';
import type { ApiClientConfig, FrontendApiErrorResponse } from '@dailyuse/contracts';

/**
 * @deprecated 此文件已废弃，请使用 @/shared/api 中的新API客户端
 * 保留此文件仅为了向后兼容，建议迁移到新的API系统
 *
 * 迁移指南：
 * - 使用 `import { api } from '@/shared/api'` 替代 `import duAxios from '@/shared/axios'`
 * - 新的API客户端提供更好的类型安全和错误处理
 */

// 创建专用实例而不是修改全局defaults
const duAxios = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 请求拦截器 - 动态添加认证token
duAxios.interceptors.request.use(
  (config) => {
    // 动态获取token，而不是在模块加载时获取
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器 - 统一错误处理
duAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败
      console.warn('认证失败，请重新登录');
      // localStorage.removeItem('auth_token');
      // 可以触发全局事件或路由跳转
    }
    return Promise.reject(error);
  },
);

export default duAxios;
