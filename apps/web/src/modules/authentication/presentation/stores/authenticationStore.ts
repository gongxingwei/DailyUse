import { defineStore } from 'pinia';
import type { AuthenticationContracts } from '@dailyuse/contracts';
import { AuthManager } from '@/shared/api';

// 类型别名
type UserInfoDTO = AuthenticationContracts.UserInfoDTO;
type UserSessionClientDTO = AuthenticationContracts.UserSessionClientDTO;
type MFADeviceClientDTO = AuthenticationContracts.MFADeviceClientDTO;

export interface AuthenticationState {
  // 用户信息
  user: UserInfoDTO | null;

  // 会话信息
  currentSession: UserSessionClientDTO | null;

  // MFA 设备
  mfaDevices: MFADeviceClientDTO[];

  // UI 状态
  isLoading: boolean;
  error: string | null;
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    user: null,
    currentSession: null,
    mfaDevices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * 是否已认证 - 委托给 AuthManager
     */
    isAuthenticated: () => AuthManager.isAuthenticated(),

    /**
     * 获取访问令牌 - 委托给 AuthManager
     */
    getAccessToken: () => AuthManager.getAccessToken(),

    /**
     * 获取刷新令牌 - 委托给 AuthManager
     */
    getRefreshToken: () => AuthManager.getRefreshToken(),

    /**
     * 获取当前用户
     */
    getCurrentUser: (state) => state.user,

    /**
     * 获取用户 UUID
     */
    getUserUuid: (state) => state.user?.uuid,

    /**
     * 获取用户名
     */
    getUsername: (state) => state.user?.username,

    /**
     * 获取当前会话
     */
    getCurrentSession: (state) => state.currentSession,

    /**
     * 会话是否活跃（使用 ClientDTO 计算属性）
     */
    isSessionActive: (state) => state.currentSession?.isActive ?? false,

    /**
     * 会话剩余时间（分钟）
     */
    sessionMinutesRemaining: (state) => state.currentSession?.minutesRemaining ?? 0,

    /**
     * Token 是否即将过期（10分钟内）
     */
    isTokenExpiringSoon: () => {
      const expiry = AuthManager.getTokenExpiry();
      if (!expiry) return false;
      return Date.now() > expiry - 10 * 60 * 1000;
    },

    /**
     * Token 是否已过期 - 委托给 AuthManager
     */
    isTokenExpired: () => AuthManager.isTokenExpired(),

    /**
     * Token 是否需要刷新 - 委托给 AuthManager
     */
    needsRefresh: () => AuthManager.needsRefresh(),

    /**
     * 获取 Token 过期时间
     */
    tokenExpiry: () => AuthManager.getTokenExpiry(),

    /**
     * 获取用户角色
     */
    getUserRoles: (state) => state.user?.roles ?? [],

    /**
     * 获取用户权限
     */
    getUserPermissions: (state) => state.user?.permissions ?? [],

    /**
     * 检查是否有指定角色
     */
    hasRole: (state) => (role: string) => {
      return state.user?.roles?.includes(role) ?? false;
    },

    /**
     * 检查是否有指定权限
     */
    hasPermission: (state) => (permission: string) => {
      return state.user?.permissions?.includes(permission) ?? false;
    },

    /**
     * 获取 MFA 设备列表
     */
    getMFADevices: (state) => state.mfaDevices,

    /**
     * 是否启用 MFA
     */
    hasMFAEnabled: (state) => state.mfaDevices.some((device) => device.isEnabled),

    /**
     * 是否正在加载
     */
    getLoading: (state) => state.isLoading,

    /**
     * 是否正在加载 (兼容 useAuthStore API)
     */
    loading: (state) => state.isLoading,

    /**
     * 获取错误信息
     */
    getError: (state) => state.error,

    /**
     * 访问 token - 兼容旧代码
     */
    accessToken: () => AuthManager.getAccessToken(),

    /**
     * 刷新 token - 兼容旧代码
     */
    refreshToken: () => AuthManager.getRefreshToken(),
  },

  actions: {
    /**
     * 设置认证数据（从 LoginResponse 设置）
     */
    setAuthData(loginResponse: {
      user: UserInfoDTO;
      accessToken: string;
      refreshToken: string;
      expiresIn: number; // 秒
      tokenType?: string;
      sessionId?: string;
    }) {
      this.user = loginResponse.user;

      // 将 token 存储到 AuthManager
      AuthManager.setTokens(
        loginResponse.accessToken,
        loginResponse.refreshToken,
        undefined,
        loginResponse.expiresIn,
      );
    },

    /**
     * 设置用户信息
     */
    setUser(user: UserInfoDTO) {
      this.user = user;
    },

    /**
     * 设置访问令牌 - 委托给 AuthManager
     */
    setAccessToken(token: string, expiresIn?: number) {
      AuthManager.updateAccessToken(token, expiresIn);
    },

    /**
     * 设置刷新令牌 - 委托给 AuthManager
     * @deprecated 直接使用 AuthManager.setTokens()
     */
    setRefreshToken(token: string) {
      // 保留为空方法以兼容旧代码
      console.warn('setRefreshToken is deprecated, use AuthManager.setTokens() instead');
    },

    /**
     * 设置当前会话
     */
    setCurrentSession(session: UserSessionClientDTO) {
      this.currentSession = session;
    },

    /**
     * 设置 MFA 设备列表
     */
    setMFADevices(devices: MFADeviceClientDTO[]) {
      this.mfaDevices = devices;
    },

    /**
     * 添加 MFA 设备
     */
    addMFADevice(device: MFADeviceClientDTO) {
      this.mfaDevices.push(device);
    },

    /**
     * 移除 MFA 设备
     */
    removeMFADevice(deviceUuid: string) {
      this.mfaDevices = this.mfaDevices.filter((d) => d.uuid !== deviceUuid);
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 清除错误信息
     */
    clearError() {
      this.error = null;
    },

    /**
     * 设置 Tokens (兼容 useAuthStore API) - 委托给 AuthManager
     */
    setTokens(tokens: {
      accessToken: string;
      refreshToken: string;
      rememberToken?: string;
      expiresIn?: number;
    }) {
      AuthManager.setTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.rememberToken,
        tokens.expiresIn,
      );
    },

    /**
     * 清除认证数据 (兼容 useAuthStore API)
     */
    clearAuth() {
      this.logout();
    },

    /**
     * 清除认证数据（登出）
     */
    logout() {
      this.user = null;
      this.currentSession = null;
      this.mfaDevices = [];
      this.isLoading = false;
      this.error = null;

      // 清除 AuthManager 中的 tokens
      AuthManager.clearTokens();
    },
  },

  // 配置 Pinia 持久化（只持久化用户信息和会话，不持久化 tokens）
  persist: true,
});

// ===== 别名导出，向后兼容 =====
export const useAuthStore = useAuthenticationStore;

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthenticationStore>;
