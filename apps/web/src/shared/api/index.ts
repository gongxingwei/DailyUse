/**
 * API模块统一导出入口
 * 提供完整的前端API解决方案
 */

// 核心类型
export type * from './core/types';

// 核心配置
export { environmentConfig, isDevelopment, isProduction } from './core/config';

// 核心客户端
export { ApiClient, createApiClient } from './core/client';
export { InterceptorManager, AuthManager } from './core/interceptors';

// 预配置实例
export { api, apiClient, publicApiClient, uploadClient, adminApiClient } from './instances';

// 业务服务
export { AuthService } from './services/authService';
export { AccountService } from './services/accountService';

// 重新导出服务类型
export type {
  LoginRequest,
  LoginResponse,
  UserInfo,
  RefreshTokenRequest,
  SessionInfo,
  MFAVerifyRequest,
} from './services/authService';

export type {
  AccountInfo,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountQueryParams,
  EmailVerifyRequest,
  PhoneVerifyRequest,
} from './services/accountService';

// 组合式API
export { useAuth } from './composables/useAuth';
export { useRequest, usePagination, useInfiniteScroll } from './composables/useRequest';

// 导出默认API实例以便快速使用
export { api as default } from './instances';
