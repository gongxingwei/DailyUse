import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import type { AuthResponseDTO } from '@dailyuse/contracts';
import { AuthManager } from '../../../../shared/api/core/interceptors';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  rememberToken?: string;
  expiresIn?: number;
}

/**
 * Authentication Store
 * 认证状态管理 - 只负责状态存储和状态管理函数，使用 Pinia 持久化
 */
export const useAuthStore = defineStore(
  'authentication',
  () => {
    // 状态
    const user = ref<AuthResponseDTO | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Token 状态
    const accessToken = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);
    const rememberToken = ref<string | null>(null);
    const tokenExpiry = ref<number | null>(null); // 计算属性
    const isAuthenticated = computed(
      () => !!user.value && !!accessToken.value && AuthManager.isAuthenticated(),
    );

    const isTokenExpired = computed(() => {
      if (!tokenExpiry.value) return false;
      return Date.now() >= tokenExpiry.value;
    });

    const needsRefresh = computed(() => {
      if (!tokenExpiry.value) return false;
      // 提前5分钟刷新token
      return Date.now() >= tokenExpiry.value - 5 * 60 * 1000;
    });

    /**
     * 设置加载状态
     */
    const setLoading = (value: boolean) => {
      loading.value = value;
    };

    /**
     * 设置错误信息
     */
    const setError = (message: string | null) => {
      error.value = message;
    };

    /**
     * 清除错误
     */
    const clearError = () => {
      error.value = null;
    };

    /**
     * 设置用户信息
     */
    const setUser = (userData: AuthResponseDTO | null) => {
      user.value = userData;
    };

    /**
     * 设置 Tokens
     */
    const setTokens = (tokens: TokenInfo) => {
      accessToken.value = tokens.accessToken;
      refreshToken.value = tokens.refreshToken;

      if (tokens.rememberToken) {
        rememberToken.value = tokens.rememberToken;
      }
      if (tokens.expiresIn) {
        tokenExpiry.value = Date.now() + tokens.expiresIn * 1000;
      }

      // 同步到 AuthManager
      AuthManager.setTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.rememberToken,
        tokens.expiresIn,
      );
    };

    /**
     * 更新访问令牌
     */
    const updateAccessToken = (newAccessToken: string, expiresIn?: number) => {
      accessToken.value = newAccessToken;
      if (expiresIn) {
        tokenExpiry.value = Date.now() + expiresIn * 1000;
      }

      // 同步到 AuthManager
      AuthManager.updateAccessToken(newAccessToken, expiresIn);
    };

    /**
     * 清除用户信息和相关状态
     */
    const clearAuth = () => {
      user.value = null;
      error.value = null;
      loading.value = false;
      accessToken.value = null;
      refreshToken.value = null;
      rememberToken.value = null;
      tokenExpiry.value = null;

      // 同步到 AuthManager
      AuthManager.clearTokens();
    };

    /**
     * 初始化时同步到 AuthManager
     */
    const syncToAuthManager = () => {
      if (accessToken.value && refreshToken.value) {
        const expiresIn = tokenExpiry.value
          ? Math.max(0, Math.floor((tokenExpiry.value - Date.now()) / 1000))
          : undefined;
        AuthManager.setTokens(
          accessToken.value,
          refreshToken.value,
          rememberToken.value || undefined,
          expiresIn,
        );
      }
    };

    return {
      // 状态
      isAuthenticated,
      isTokenExpired,
      needsRefresh,
      user,
      loading,
      error,

      // Token 状态 (readonly)
      accessToken: readonly(accessToken),
      refreshToken: readonly(refreshToken),
      rememberToken: readonly(rememberToken),
      tokenExpiry: readonly(tokenExpiry),

      // 状态管理方法
      setLoading,
      setError,
      clearError,
      setUser,
      setTokens,
      updateAccessToken,
      clearAuth,
      syncToAuthManager,
    };
  },
  {
    // 配置 Pinia 持久化
    persist: true,
  },
);

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthStore>;
