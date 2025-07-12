import { defineStore } from "pinia";

export const useAuthenticationStore = defineStore("authentication", {
  state: () => ({
    token: null as string | null,
    accountId: null as string | null,

  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,

  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setAccountId(accountId: string) {
      this.accountId = accountId;
    },
  },
});
