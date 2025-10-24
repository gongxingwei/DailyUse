//services
import type { AccountRegistrationRequest } from '../../index';

import { localAccountService } from '../../domain/services/localAccountService';
// domains
import { Account } from '../../domain/aggregates/account';
import { User } from '../../domain/entities/user';
// ipc
import { accountIpcClient } from '../../infrastructure/ipcs/accountIpcClient';

// stores
import { useAccountStore } from '../../presentation/stores/accountStore';
/**
 * 账号应用服务
 * 协调账号、认证和会话管理的业务流程
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;
  private localAccountService: typeof localAccountService;
  constructor() {
    this.localAccountService = localAccountService;
  }

  public static getInstance(): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  get accountStore() {
    return useAccountStore();
  }

  /**
   * 用户注册流程
   */
  async register(registerData: AccountRegistrationRequest): Promise<ApiResponse<Account>> {
    try {
      // 1. 注册账号
      const response = await this.localAccountService.register(registerData);

      if (!response.success || !response.data) {
        return {
          success: false,
          message: response.message,
          data: undefined,
        };
      }

      return {
        success: true,
        message: '注册成功',
        data: response.data,
      };
    } catch (error) {
      console.error('注册流程失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试',
        data: undefined,
      };
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(user: User): Promise<ApiResponse<void>> {
    try {
      const userDTO = user.toDTO();
      const response = await accountIpcClient.updateUserProfile(userDTO);
      if (!response.success) {
        return {
          success: false,
          message: response.message,
        };
      }

      // 更新本地账号状态
      const account = this.accountStore.currentAccount;
      if (!account) {
        return {
          success: false,
          message: '未找到当前账号',
        };
      }
      account.user = user;

      this.syncAccountToState(account as Account);

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      console.error('更新账号信息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新失败',
        data: undefined,
      };
    }
  }

  // ======= 同步方法 =======
  async syncAccountToState(account: Account): Promise<void> {
    this.accountStore.setAccount(account);
  }
}
