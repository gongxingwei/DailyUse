/**
 * 认证相关的组合式API
 * 提供Vue 3 Composition API风格的认证功能
 */

import { ref, computed, reactive } from 'vue';
import { AuthService, type LoginRequest, type UserInfo } from '../services/authService';
import { AuthManager } from '../core/interceptors';

/**
 * 认证状态
 */
interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
}

/**
 * 全局认证状态
 */
const authState = reactive<AuthState>({
  user: null,
  loading: false,
  error: null,
});

/**
 * 认证组合式API
 */
export function useAuth() {
  const isAuthenticated = computed(() => !!authState.user && AuthManager.isAuthenticated());
  const user = computed(() => authState.user);
  const loading = computed(() => authState.loading);
  const error = computed(() => authState.error);

  /**
   * 清除错误
   */
  const clearError = () => {
    authState.error = null;
  };

  /**
   * 登录
   */
  const login = async (loginData: LoginRequest) => {
    try {
      authState.loading = true;
      authState.error = null;

      const response = await AuthService.login(loginData);

      // 保存令牌
      AuthManager.setTokens(response.accessToken, response.refreshToken);

      // 设置用户信息
      authState.user = response.user;

      return response;
    } catch (err: any) {
      authState.error = err.message || '登录失败';
      throw err;
    } finally {
      authState.loading = false;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      authState.loading = true;

      // 调用后端登出API
      if (isAuthenticated.value) {
        await AuthService.logout();
      }
    } catch (err: any) {
      console.warn('登出API调用失败:', err.message);
    } finally {
      // 无论API调用是否成功，都清除本地状态
      AuthManager.clearTokens();
      authState.user = null;
      authState.error = null;
      authState.loading = false;
    }
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    if (!isAuthenticated.value) return;

    try {
      authState.loading = true;
      const userInfo = await AuthService.getCurrentUser();
      authState.user = userInfo;
    } catch (err: any) {
      authState.error = err.message || '获取用户信息失败';
      throw err;
    } finally {
      authState.loading = false;
    }
  };

  /**
   * 初始化认证状态
   */
  const initAuth = async () => {
    if (!AuthManager.isAuthenticated()) return;

    try {
      await refreshUser();
    } catch (err) {
      // 如果获取用户信息失败，清除认证状态
      await logout();
    }
  };

  /**
   * 修改密码
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      authState.loading = true;
      authState.error = null;

      await AuthService.changePassword({
        currentPassword,
        newPassword,
      });
    } catch (err: any) {
      authState.error = err.message || '修改密码失败';
      throw err;
    } finally {
      authState.loading = false;
    }
  };

  /**
   * 检查权限
   */
  const hasPermission = (permission: string): boolean => {
    return authState.user?.permissions.includes(permission) || false;
  };

  /**
   * 检查角色
   */
  const hasRole = (role: string): boolean => {
    return authState.user?.roles.includes(role) || false;
  };

  return {
    // 状态
    isAuthenticated,
    user,
    loading,
    error,

    // 方法
    login,
    logout,
    refreshUser,
    initAuth,
    changePassword,
    clearError,
    hasPermission,
    hasRole,
  };
}
