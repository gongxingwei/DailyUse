/**
 * 认证相关的组合式API
 * 提供Vue 3 Composition API风格的认证功能
 * 现在基于 useAuthentication 实现，保持向后兼容
 */

import { useAuthentication } from '../../../modules/authentication/presentation/composables/useAuthentication';
import { useAuthStore } from '../../../modules/authentication/presentation/stores/authenticationStore';

/**
 * 认证组合式API
 * @deprecated 建议直接使用 useAuthentication，这个函数保留仅为向后兼容
 */
export function useAuth() {
  const auth = useAuthentication();
  const authStore = useAuthStore();

  // 保持原有接口，但内部使用新的架构
  return {
    // 状态
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.isLoading,
    error: auth.error,

    // 方法 - 重命名以匹配原有接口
    login: auth.login,
    logout: auth.logout,
    refreshUser: auth.refreshUser,
    initAuth: auth.initAuth,
    changePassword: auth.changePassword,
    clearError: authStore.clearError,
    hasPermission: auth.hasPermission,
    hasRole: auth.hasRole,
  };
}
