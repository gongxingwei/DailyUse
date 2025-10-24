import { defineStore } from 'pinia';

export const useAuthenticationStore = defineStore('authentication', {
  state: () => ({
    username: null as string | null,
    token: null as string | null,
    accountUuid: null as string | null,
    sessionUuid: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,
    getAccountUuid: (state) => state.accountUuid,
    getSessionUuid: (state) => state.sessionUuid,
    getUsername: (state) => state.username,
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setAccountUuid(accountUuid: string) {
      this.accountUuid = accountUuid;
    },
    setSessionUuid(sessionUuid: string) {
      this.sessionUuid = sessionUuid;
    },
    setUsername(username: string) {
      this.username = username;
    },
  },
});
