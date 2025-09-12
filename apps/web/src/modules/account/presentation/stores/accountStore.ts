import { defineStore } from 'pinia';

// 临时类型定义，后续需要替换为实际的domain类型
interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  bio?: string;
  avatar?: string;
  socialAccounts?: Record<string, any>;
}

interface Account {
  uuid?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  user?: User;
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    account: null as Account | null,
    loading: false,
    error: null as string | null,
    savedAccounts: [] as Array<Account>,
  }),

  getters: {
    isAuthenticated: (state) => !!state.account,
    currentAccount: (state) => state.account,
    getAccountUuid: (state) => (state.account ? state.account.uuid : null),
    getAllSavedAccounts: (state) => {
      return state.savedAccounts;
    },

    // 获取已记住的账号列表
    rememberedAccounts: (state) =>
      state.savedAccounts.filter((account) => (account as any).remember),
  },

  actions: {
    setAccount(account: Account) {
      this.account = account;

      // 持久化到localStorage
      if (account) {
        localStorage.setItem('currentAccount', JSON.stringify(account));
      } else {
        localStorage.removeItem('currentAccount');
      }
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('currentAccount');
      this.account = null;
      this.loading = false;
      this.error = null;
    },

    setSavedAccounts(accounts: Array<Account>) {
      this.savedAccounts = accounts;
      localStorage.setItem('savedAccounts', JSON.stringify(accounts));
    },

    removeSavedAccount(username: string) {
      this.savedAccounts = this.savedAccounts.filter((account) => account.username !== username);
      localStorage.setItem('savedAccounts', JSON.stringify(this.savedAccounts));
    },

    // 从localStorage恢复账户信息
    restoreAccount() {
      try {
        const savedAccount = localStorage.getItem('currentAccount');
        if (savedAccount) {
          this.account = JSON.parse(savedAccount);
        }

        const savedAccounts = localStorage.getItem('savedAccounts');
        if (savedAccounts) {
          this.savedAccounts = JSON.parse(savedAccounts);
        }
      } catch (error) {
        console.error('恢复账户信息失败:', error);
      }
    },

    // 更新用户信息
    updateUserProfile(userData: Partial<User>) {
      if (this.account?.user) {
        Object.assign(this.account.user, userData);
        // 持久化更新
        localStorage.setItem('currentAccount', JSON.stringify(this.account));
      }
    },
  },
});
