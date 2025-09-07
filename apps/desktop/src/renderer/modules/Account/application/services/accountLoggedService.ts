import { AccountDTO } from "../../domain/types/account";
import { Account } from "../../../../modules/Account";
import { accountIpcClient } from "../../infrastructure/ipcs/accountIpcClient";
import { useAccountStore } from "../../presentation/stores/accountStore";

export class AccountLoggedService {
  private _accountStore: ReturnType<typeof useAccountStore> | null = null;

  private get accountStore() {
    if (!this._accountStore) {
      this._accountStore = useAccountStore();
    }
    return this._accountStore;
  }

  async initAccountInfo(accountUuid: string): Promise<ApiResponse<AccountDTO>> {
    try {
      const response = await accountIpcClient.getAccountByAccountUuid(accountUuid);
      console.log('获取账户信息响应:', response);
      if (response.success && response.data) {
        const account = Account.fromDTO(response.data);
        this.accountStore.setAccount(account);
       
        console.log('success to get account info', account)
         console.log('是否认证状态', this.accountStore.isAuthenticated);
      }
      return response;
    } catch (error) {
      console.error(error);
      return { success: false, message: "Failed to fetch account information" };
    }
  }
}

export const accountLoggedService = new AccountLoggedService();
