import { defineStore } from 'pinia';
import type { TUser } from '../types/account';
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as Omit<TUser, "password"> | null,
        loading: false,
        error: null as string | null,
        savedAccounts: [] as Array<any>,
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        currentUser: (state) => state.user,

        getAllSavedAccounts: (state) => {
            return state.savedAccounts;
        },

        // 获取已记住的账号列表
        rememberedAccounts: (state) => 
            state.savedAccounts.filter(account => account.remember),

    },

    actions: {
        setUser(user: Omit<TUser, "password">) {
            this.user = user;
        },
        logout() {
            localStorage.removeItem('token');
            this.user = null;
            this.loading = false;
            this.error = null;
        },
        setSavedAccounts(accounts: Array<any>) {
            this.savedAccounts = accounts;
        },
        removeSavedAccount(username: string) {
            this.savedAccounts = this.savedAccounts.filter(
                (account) => account.username !== username
            );
        }
    },
});