import { defineStore } from 'pinia';
import { Account } from '@dailyuse/domain-client';
import type { AccountContracts } from '@dailyuse/contracts';

// Type aliases
type AccountClientDTO = AccountContracts.AccountClientDTO;

export const useAccountStore = defineStore('account', {
  state: () => ({
    // 使用 Account 聚合根
    account: null as Account | null,
    loading: false,
    error: null as string | null,
    // 保存的账户列表（DTO 格式，用于持久化）
    savedAccounts: [] as Array<AccountClientDTO>,
  }),

  getters: {
    isAuthenticated: (state) => !!state.account,
    currentAccount: (state) => state.account,
    getAccountUuid: (state) => state.account?.uuid ?? null,
    
    // 获取账户状态
    isAccountActive: (state) => state.account?.isActive() ?? false,
    isAccountLocked: (state) => state.account?.isLocked() ?? false,
    isAccountDeleted: (state) => state.account?.isDeleted() ?? false,

    getAllSavedAccounts: (state) => {
      return state.savedAccounts;
    },

    // 获取已记住的账号列表
    rememberedAccounts: (state) =>
      state.savedAccounts.filter((account) => (account as any).remember),
  },

  actions: {
    /**
     * 设置账户（从 DTO 创建聚合根）
     */
    setAccount(accountDTO: AccountClientDTO) {
      // 从 DTO 创建 Account 聚合根
      this.account = Account.fromClientDTO(accountDTO);

      // 持久化到 localStorage（存储 DTO）
      if (this.account) {
        const dto = this.account.toClientDTO();
        localStorage.setItem('currentAccount', JSON.stringify(dto));
      } else {
        localStorage.removeItem('currentAccount');
      }
    },

    /**
     * 设置账户聚合根（直接设置）
     */
    setAccountAggregate(account: Account | null) {
      this.account = account;

      // 持久化到 localStorage
      if (account) {
        const dto = account.toClientDTO();
        localStorage.setItem('currentAccount', JSON.stringify(dto));
      } else {
        localStorage.removeItem('currentAccount');
      }
    },

    /**
     * 登出
     */
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('currentAccount');
      this.account = null;
      this.loading = false;
      this.error = null;
    },

    /**
     * 保存账户列表
     */
    setSavedAccounts(accounts: Array<AccountClientDTO>) {
      this.savedAccounts = accounts;
      localStorage.setItem('savedAccounts', JSON.stringify(accounts));
    },

    /**
     * 移除已保存的账户
     */
    removeSavedAccount(username: string) {
      this.savedAccounts = this.savedAccounts.filter((account) => account.username !== username);
      localStorage.setItem('savedAccounts', JSON.stringify(this.savedAccounts));
    },

    /**
     * 从 localStorage 恢复账户信息
     */
    restoreAccount() {
      try {
        const savedAccount = localStorage.getItem('currentAccount');
        if (savedAccount) {
          const accountDTO: AccountClientDTO = JSON.parse(savedAccount);
          this.account = Account.fromClientDTO(accountDTO);
        }

        const savedAccounts = localStorage.getItem('savedAccounts');
        if (savedAccounts) {
          this.savedAccounts = JSON.parse(savedAccounts);
        }
      } catch (error) {
        console.error('恢复账户信息失败:', error);
      }
    },

    /**
     * 更新用户资料
     */
    updateProfile(profileData: {
      displayName?: string;
      avatar?: string;
      bio?: string;
    }) {
      if (!this.account) {
        throw new Error('No account available');
      }

      // 使用聚合根的业务方法
      this.account.updateProfile(profileData);

      // 持久化更新
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 更新邮箱
     */
    updateEmail(email: string) {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.updateEmail(email);

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 验证邮箱
     */
    verifyEmail() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.verifyEmail();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 更新手机号
     */
    updatePhone(phoneNumber: string) {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.updatePhone(phoneNumber);

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 验证手机号
     */
    verifyPhone() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.verifyPhone();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 更新偏好设置
     */
    updatePreferences(preferences: Partial<AccountClientDTO['preferences']>) {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.updatePreferences(preferences as any);

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 激活账户
     */
    activateAccount() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.activate();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 停用账户
     */
    deactivateAccount() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.deactivate();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 记录登录
     */
    recordLogin() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.recordLogin();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 记录活动
     */
    recordActivity() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.recordActivity();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 启用两步验证
     */
    enableTwoFactor() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.enableTwoFactor();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 禁用两步验证
     */
    disableTwoFactor() {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.disableTwoFactor();

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },

    /**
     * 检查存储配额
     */
    checkStorageQuota(requiredBytes: number): boolean {
      if (!this.account) {
        return false;
      }

      return this.account.checkStorageQuota(requiredBytes);
    },

    /**
     * 更新存储使用量
     */
    updateStorageUsage(bytesUsed: number) {
      if (!this.account) {
        throw new Error('No account available');
      }

      this.account.updateStorageUsage(bytesUsed);

      // 持久化
      const dto = this.account.toClientDTO();
      localStorage.setItem('currentAccount', JSON.stringify(dto));
    },
  },
});
