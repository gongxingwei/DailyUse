import { AccountDTO } from "../../domain/types/account";
import { Account } from "@electron/modules/Account";
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

  async initAccountInfo(accountId: string): Promise<TResponse<AccountDTO>> {
    try {
      const response = await accountIpcClient.getAccountByAccountId(accountId);
      if (response.success && response.data) {
        let account = Account.fromDTO(response.data);
        this.accountStore.setAccount(account);
        console.log('success to get account info', account)
      }
      return response;
    } catch (error) {
      console.error(error);
      return { success: false, message: "Failed to fetch account information" };
    }
  }
}

export const accountLoggedService = new AccountLoggedService();
