import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthApiService } from '../../infrastructure/api/ApiClient';
import type {
  AuthByPasswordForm,
  AuthResponseDTO,
  SuccessResponse,
  AuthByPasswordRequestDTO,
} from '@dailyuse/contracts';
import { AccountType } from '@dailyuse/domain-client';
import { AuthManager } from '../../../../shared/api/core/interceptors';

/**
 * Authentication Store
 * 认证状态管理 - 使用Pinia管理认证状态和操作
 */
export const useAuthStore = defineStore('authentication', () => {
  // 状态
  const user = ref<AuthResponseDTO | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!user.value && AuthManager.isAuthenticated());

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 登录
   */
  const login = async (loginData: AuthByPasswordForm) => {
    try {
      loading.value = true;
      error.value = null;

      const authRequest: AuthByPasswordRequestDTO = {
        ...loginData,
        accountType: AccountType.GUEST,
      };

      const response = await AuthApiService.loginCompat(authRequest);

      if (!response.success) {
        throw new Error(response.message);
      }

      // 保存令牌
      if (response.data?.accessToken && response.data?.refreshToken) {
        AuthManager.setTokens(response.data.accessToken, response.data.refreshToken);
      }

      // 设置用户信息
      user.value = response.data;

      return response;
    } catch (err: any) {
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      loading.value = true;

      // 调用后端登出API
      if (isAuthenticated.value) {
        // TODO: 实现登出API调用
        // await AuthApiService.logout();
      }
    } catch (err: any) {
      console.warn('登出API调用失败:', err.message);
    } finally {
      // 无论API调用是否成功，都清除本地状态
      AuthManager.clearTokens();
      user.value = null;
      error.value = null;
      loading.value = false;
    }
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    if (!isAuthenticated.value) return;

    try {
      loading.value = true;
      // TODO: 实现获取用户信息API
      // const userInfo = await AuthApiService.getCurrentUser();
      // user.value = userInfo;
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败';
      throw err;
    } finally {
      loading.value = false;
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
      loading.value = true;
      error.value = null;

      // TODO: 实现修改密码API
      // await AuthApiService.changePassword({
      //   currentPassword,
      //   newPassword,
      // });
    } catch (err: any) {
      error.value = err.message || '修改密码失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 检查权限
   */
  const hasPermission = (permission: string): boolean => {
    // TODO: 实现权限检查逻辑
    return false;
  };

  /**
   * 检查角色
   */
  const hasRole = (role: string): boolean => {
    // TODO: 实现角色检查逻辑
    return false;
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
});

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthStore>;
