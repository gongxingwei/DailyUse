/**
 * 认证相关的组合式API
 * 提供Vue 3 Composition API风格的认证功能
 * 现在基于 useAuthenticationService 实现，保持向后兼容
 */

import { useAuthenticationService } from '../../../modules/authentication/presentation/composables/useAuthenticationService';
import { useAuthStore } from '../../../modules/authentication/presentation/stores/useAuthStore';

/**
 * 认证组合式API
 * @deprecated 建议直接使用 useAuthenticationService，这个函数保留仅为向后兼容
 */
export function useAuth() {
  const authService = useAuthenticationService();
  const authStore = useAuthStore();

  // 保持原有接口，但内部使用新的架构
  return {
    // 状态
    isAuthenticated: authService.isAuthenticated,
    user: authService.user,
    loading: authService.loading,
    error: authService.error,

    // 方法 - 重命名以匹配原有接口
    login: authService.handleLogin,
    logout: authService.handleLogout,
    refreshUser: authService.handleRefreshUser,
    initAuth: authService.handleInitAuth,
    changePassword: authService.handleChangePassword,
    clearError: authStore.clearError,
    hasPermission: (permission: string) => {
      // TODO: 实现权限检查逻辑
      return false;
    },
    hasRole: (role: string) => {
      // TODO: 实现角色检查逻辑
      return false;
    },
  };
}
