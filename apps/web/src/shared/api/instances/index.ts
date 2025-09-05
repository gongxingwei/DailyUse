/**
 * 预配置的API客户端实例
 * 提供开箱即用的API调用客户端
 */

import { createApiClient } from '../core/client';
import { environmentConfig } from '../core/config';
import type { HttpClientConfig } from '../core/types';

/**
 * 主API客户端 - 用于业务API调用
 */
export const apiClient = createApiClient({
  baseURL: environmentConfig.apiBaseUrl,
  enableAuth: true,
  enableLogging: environmentConfig.logLevel !== 'silent',
  enableRetry: true,
  retryCount: 3,
  authFailHandler: () => {
    // 认证失败时的处理
    console.warn('认证失败，跳转到登录页');
    // 可以在这里添加路由跳转逻辑
    // router.push('/auth/login');
  },
});

/**
 * 公共API客户端 - 用于不需要认证的API调用
 */
export const publicApiClient = createApiClient({
  baseURL: environmentConfig.apiBaseUrl,
  enableAuth: false,
  enableLogging: environmentConfig.logLevel !== 'silent',
  enableRetry: true,
  retryCount: 2,
});

/**
 * 上传客户端 - 用于文件上传
 */
export const uploadClient = createApiClient({
  baseURL: environmentConfig.uploadBaseUrl || environmentConfig.apiBaseUrl,
  timeout: 60000, // 60秒超时
  enableAuth: true,
  enableLogging: environmentConfig.logLevel !== 'silent',
  enableRetry: false, // 文件上传不重试
});

/**
 * 管理员API客户端 - 用于管理员功能
 */
export const adminApiClient = createApiClient({
  baseURL: `${environmentConfig.apiBaseUrl}/admin`,
  enableAuth: true,
  enableLogging: true, // 管理员操作总是记录日志
  enableRetry: true,
  retryCount: 2,
  authFailHandler: () => {
    console.warn('管理员认证失败');
    // 管理员认证失败的特殊处理
  },
});

/**
 * 快速API调用方法 - 常用的API调用快捷方式
 */
export const api = {
  // GET请求
  get: apiClient.get.bind(apiClient),
  // POST请求
  post: apiClient.post.bind(apiClient),
  // PUT请求
  put: apiClient.put.bind(apiClient),
  // DELETE请求
  delete: apiClient.delete.bind(apiClient),
  // PATCH请求
  patch: apiClient.patch.bind(apiClient),
  // 文件上传
  upload: uploadClient.upload.bind(uploadClient),
  // 文件下载
  download: apiClient.download.bind(apiClient),

  // 公共API
  public: {
    get: publicApiClient.get.bind(publicApiClient),
    post: publicApiClient.post.bind(publicApiClient),
    put: publicApiClient.put.bind(publicApiClient),
    delete: publicApiClient.delete.bind(publicApiClient),
    patch: publicApiClient.patch.bind(publicApiClient),
  },

  // 管理员API
  admin: {
    get: adminApiClient.get.bind(adminApiClient),
    post: adminApiClient.post.bind(adminApiClient),
    put: adminApiClient.put.bind(adminApiClient),
    delete: adminApiClient.delete.bind(adminApiClient),
    patch: adminApiClient.patch.bind(adminApiClient),
  },
};
