import { defineStore } from 'pinia';

export interface AuthenticationState {
  username: string | null;
  token: string | null;
  refreshToken: string | null;
  accountUuid: string | null;
  sessionUuid: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  rememberMe: boolean;
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    username: null,
    token: null,
    refreshToken: null,
    accountUuid: null,
    sessionUuid: null,
    expiresAt: null,
    isLoading: false,
    rememberMe: false,
  }),

  getters: {
    isAuthenticated: (state) => {
      if (!state.token || !state.expiresAt) {
        return false;
      }
      // 检查token是否过期
      return Date.now() < state.expiresAt;
    },

    getToken: (state) => state.token,
    getRefreshToken: (state) => state.refreshToken,
    getAccountUuid: (state) => state.accountUuid,
    getSessionUuid: (state) => state.sessionUuid,
    getUsername: (state) => state.username,

    isTokenExpiringSoon: (state) => {
      if (!state.expiresAt) return false;
      // 如果token在10分钟内过期，返回true
      return Date.now() > state.expiresAt - 10 * 60 * 1000;
    },
  },

  actions: {
    setAuthData(authData: {
      token: string;
      refreshToken?: string;
      accountUuid: string;
      sessionUuid: string;
      username: string;
      expiresIn?: number; // 秒
    }) {
      this.token = authData.token;
      this.refreshToken = authData.refreshToken || null;
      this.accountUuid = authData.accountUuid;
      this.sessionUuid = authData.sessionUuid;
      this.username = authData.username;

      // 计算过期时间
      if (authData.expiresIn) {
        this.expiresAt = Date.now() + authData.expiresIn * 1000;
      }

      // 如果记住登录状态，保存到localStorage
      if (this.rememberMe) {
        this.persistAuthData();
      }
    },

    setToken(token: string) {
      this.token = token;
      if (this.rememberMe) {
        localStorage.setItem('auth_token', token);
      }
    },

    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken;
      if (this.rememberMe) {
        localStorage.setItem('auth_refresh_token', refreshToken);
      }
    },

    setAccountUuid(accountUuid: string) {
      this.accountUuid = accountUuid;
      if (this.rememberMe) {
        localStorage.setItem('auth_account_uuid', accountUuid);
      }
    },

    setSessionUuid(sessionUuid: string) {
      this.sessionUuid = sessionUuid;
      if (this.rememberMe) {
        localStorage.setItem('auth_session_uuid', sessionUuid);
      }
    },

    setUsername(username: string) {
      this.username = username;
      if (this.rememberMe) {
        localStorage.setItem('auth_username', username);
      }
    },

    setRememberMe(remember: boolean) {
      this.rememberMe = remember;
      localStorage.setItem('auth_remember_me', remember.toString());

      if (!remember) {
        this.clearPersistedData();
      }
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    // 持久化认证数据
    persistAuthData() {
      if (this.rememberMe) {
        const authData = {
          username: this.username,
          token: this.token,
          refreshToken: this.refreshToken,
          accountUuid: this.accountUuid,
          sessionUuid: this.sessionUuid,
          expiresAt: this.expiresAt,
        };
        localStorage.setItem('auth_data', JSON.stringify(authData));
      }
    },

    // 从本地存储恢复认证数据
    async restoreAuthData() {
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
          // 尝试刷新token
          if (authData.refreshToken) {
            return await this.refreshAuthToken(authData.refreshToken);
          }
          return false;
        }

        // 恢复认证状态
        this.username = authData.username;
        this.token = authData.token;
        this.refreshToken = authData.refreshToken;
        this.accountUuid = authData.accountUuid;
        this.sessionUuid = authData.sessionUuid;
        this.expiresAt = authData.expiresAt;

        return true;
      } catch (error) {
        console.error('恢复认证数据失败:', error);
        this.clearPersistedData();
        return false;
      }
    },

    // 刷新访问令牌
    async refreshAuthToken(refreshToken?: string): Promise<boolean> {
      try {
        // TODO: 实现token刷新API调用
        console.log('刷新token:', refreshToken || this.refreshToken);
        // const response = await authApi.refreshToken(refreshToken || this.refreshToken);
        // this.setAuthData(response.data);
        return true;
      } catch (error) {
        console.error('刷新token失败:', error);
        this.logout();
        return false;
      }
    },

    // 清除认证数据
    logout() {
      this.username = null;
      this.token = null;
      this.refreshToken = null;
      this.accountUuid = null;
      this.sessionUuid = null;
      this.expiresAt = null;
      this.isLoading = false;

      this.clearPersistedData();
    },

    // 清除持久化数据
    clearPersistedData() {
      localStorage.removeItem('auth_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_account_uuid');
      localStorage.removeItem('auth_session_uuid');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('auth_remember_me');
    },
  },
});
