import { defineStore } from 'pinia';
import { Account } from '../../domain/aggregates/account';

export const useAccountStore = defineStore('auth', {
    state: () => ({
        account: null as Account | null,
        loading: false,
        error: null as string | null,
        savedAccounts: [] as Array<any>,
    }),

    getters: {
        isAuthenticated: (state) => !!state.account,
        currentAccount: (state) => state.account,
        getAccountUuid: (state) => state.account ? state.account.uuid : null,
        getAllSavedAccounts: (state) => {
            return state.savedAccounts;
        },

        // 获取已记住的账号列表
        rememberedAccounts: (state) => 
            state.savedAccounts.filter(account => account.remember),

    },

    actions: {
        setAccount(account: Account) {
            this.account = account;
        },
        logout() {
            localStorage.removeItem('token');
            this.account = null;
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
