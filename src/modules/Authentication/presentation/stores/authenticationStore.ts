import { defineStore } from "pinia";

export const useAuthenticationStore = defineStore("authentication", {
  state: () => ({
    token: null as string | null,
    accountUuid: null as string | null,

  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,
    getAccountUuid: (state) => state.accountUuid,

  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setAccountUuid(accountUuid: string) {
      this.accountUuid = accountUuid;
    },
  },
});
