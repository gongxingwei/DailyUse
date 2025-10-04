import { defineStore } from 'pinia';
import type { AuthenticationContracts } from '@dailyuse/contracts';

// 类型别名
type UserInfoDTO = AuthenticationContracts.UserInfoDTO;
type UserSessionClientDTO = AuthenticationContracts.UserSessionClientDTO;
type MFADeviceClientDTO = AuthenticationContracts.MFADeviceClientDTO;

export interface AuthenticationState {
  // 用户信息
  user: UserInfoDTO | null;

  // 会话信息
  currentSession: UserSessionClientDTO | null;

  // 令牌信息
  accessToken: string | null;
  refreshToken: string | null;
  rememberToken: string | null; // 添加 rememberToken 到状态
  tokenType: string;
  expiresAt: number | null; // 毫秒时间戳

  // MFA 设备
  mfaDevices: MFADeviceClientDTO[];

  // UI 状态
  isLoading: boolean;
  error: string | null;

  // 持久化设置
  rememberMe: boolean;
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    user: null,
    currentSession: null,
    accessToken: null,
    refreshToken: null,
    rememberToken: null,
    tokenType: 'Bearer',
    expiresAt: null,
    mfaDevices: [],
    isLoading: false,
    error: null,
    rememberMe: false,
  }),

  getters: {
    /**
     * 是否已认证
     * 基于 accessToken 和 expiresAt 判断
     */
    isAuthenticated: (state) => {
      if (!state.accessToken || !state.expiresAt) {
        return false;
      }
      // 检查 token 是否过期
      return Date.now() < state.expiresAt;
    },

    /**
     * 获取访问令牌
     */
    getAccessToken: (state) => state.accessToken,

    /**
     * 获取刷新令牌
     */
    getRefreshToken: (state) => state.refreshToken,

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
    isTokenExpiringSoon: (state) => {
      if (!state.expiresAt) return false;
      return Date.now() > state.expiresAt - 10 * 60 * 1000;
    },

    /**
     * Token 是否已过期
     */
    isTokenExpired: (state) => {
      if (!state.expiresAt) return false;
      return Date.now() >= state.expiresAt;
    },

    /**
     * Token 是否需要刷新（提前5分钟）
     */
    needsRefresh: (state) => {
      if (!state.expiresAt) return false;
      return Date.now() >= state.expiresAt - 5 * 60 * 1000;
    },

    /**
     * 获取 Token 过期时间
     */
    tokenExpiry: (state) => state.expiresAt,

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
      this.accessToken = loginResponse.accessToken;
      this.refreshToken = loginResponse.refreshToken;
      this.tokenType = loginResponse.tokenType || 'Bearer';

      // 计算过期时间（毫秒）
      this.expiresAt = Date.now() + loginResponse.expiresIn * 1000;

      // 如果记住登录状态，保存到 localStorage
      if (this.rememberMe) {
        this.persistAuthData();
      }
    },

    /**
     * 设置用户信息
     */
    setUser(user: UserInfoDTO) {
      this.user = user;
      if (this.rememberMe) {
        this.persistAuthData();
      }
    },

    /**
     * 设置访问令牌
     */
    setAccessToken(token: string, expiresIn?: number) {
      this.accessToken = token;
      if (expiresIn) {
        this.expiresAt = Date.now() + expiresIn * 1000;
      }
      if (this.rememberMe) {
        localStorage.setItem('auth_access_token', token);
      }
    },

    /**
     * 设置刷新令牌
     */
    setRefreshToken(token: string) {
      this.refreshToken = token;
      if (this.rememberMe) {
        localStorage.setItem('auth_refresh_token', token);
      }
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
     * 设置记住我
     */
    setRememberMe(remember: boolean) {
      this.rememberMe = remember;
      localStorage.setItem('auth_remember_me', remember.toString());

      if (!remember) {
        this.clearPersistedData();
      }
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
     * 设置 Tokens (兼容 useAuthStore API)
     */
    setTokens(tokens: {
      accessToken: string;
      refreshToken: string;
      rememberToken?: string;
      expiresIn?: number;
    }) {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      if (tokens.rememberToken) {
        this.rememberToken = tokens.rememberToken;
      }
      if (tokens.expiresIn) {
        this.expiresAt = Date.now() + tokens.expiresIn * 1000;
      }
    },

    /**
     * 清除认证数据 (兼容 useAuthStore API)
     */
    clearAuth() {
      this.logout();
    },

    /**
     * 同步到 AuthManager (兼容 useAuthStore API)
     */
    syncToAuthManager() {
      if (this.accessToken && this.refreshToken) {
        const expiresIn = this.expiresAt
          ? Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000))
          : undefined;
        // AuthManager 已经在拦截器中处理，这里只是兼容接口
        console.log('Syncing to AuthManager:', { expiresIn });
      }
    },

    /**
     * 持久化认证数据
     */
    persistAuthData() {
      if (this.rememberMe) {
        const authData = {
          user: this.user,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          tokenType: this.tokenType,
          expiresAt: this.expiresAt,
        };
        localStorage.setItem('auth_data', JSON.stringify(authData));
      }
    },

    /**
     * 从本地存储恢复认证数据
     */
    async restoreAuthData(): Promise<boolean> {
      const rememberMe = localStorage.getItem('auth_remember_me') === 'true';
      this.rememberMe = rememberMe;

      if (!rememberMe) {
        return false;
      }

      const authDataStr = localStorage.getItem('auth_data');
      if (!authDataStr) {
        return false;
      }

      try {
        const authData = JSON.parse(authDataStr);

        // 检查数据是否过期
        if (authData.expiresAt && Date.now() > authData.expiresAt) {
          // 尝试刷新 token
          if (authData.refreshToken) {
            return await this.refreshAuthToken(authData.refreshToken);
          }
          return false;
        }

        // 恢复认证状态
        this.user = authData.user;
        this.accessToken = authData.accessToken;
        this.refreshToken = authData.refreshToken;
        this.tokenType = authData.tokenType || 'Bearer';
        this.expiresAt = authData.expiresAt;

        return true;
      } catch (error) {
        console.error('恢复认证数据失败:', error);
        this.clearPersistedData();
        return false;
      }
    },

    /**
     * 刷新访问令牌
     */
    async refreshAuthToken(refreshToken?: string): Promise<boolean> {
      try {
        // TODO: 实现 token 刷新 API 调用
        console.log('刷新 token:', refreshToken || this.refreshToken);
        // const response = await authApiClient.refreshToken({ refreshToken: refreshToken || this.refreshToken });
        // this.setAccessToken(response.data.accessToken, response.data.expiresIn);
        // this.setRefreshToken(response.data.refreshToken);
        return true;
      } catch (error) {
        console.error('刷新 token 失败:', error);
        this.logout();
        return false;
      }
    },

    /**
     * 清除认证数据（登出）
     */
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenType = 'Bearer';
      this.expiresAt = null;
      this.currentSession = null;
      this.mfaDevices = [];
      this.isLoading = false;
      this.error = null;

      this.clearPersistedData();
    },

    /**
     * 清除持久化数据
     */
    clearPersistedData() {
      localStorage.removeItem('auth_data');
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_remember_me');
    },
  },

  // 配置 Pinia 持久化
  persist: true,
});

// ===== 别名导出，向后兼容 =====
export const useAuthStore = useAuthenticationStore;

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthenticationStore>;
