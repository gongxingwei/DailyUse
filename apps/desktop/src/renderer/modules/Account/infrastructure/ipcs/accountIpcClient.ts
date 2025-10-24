import type { AccountRegistrationRequest, AccountDTO } from '@electron/modules/Account';
import { ipcInvokeWithAuth } from '@renderer/shared/utils/ipcInvokeWithAuth';

export class AccountIpcClient {
  async accountRegistration(
    registrationData: AccountRegistrationRequest,
  ): Promise<ApiResponse<AccountDTO>> {
    console.log('📝 [AccountIpcClient] 发送账号注册请求', registrationData);
    const serializedDto = JSON.parse(JSON.stringify(registrationData));
    console.log('📝 [AccountIpcClient] 序列化后的注册数据', serializedDto);
    return window.shared.ipcRenderer.invoke('account:register', serializedDto);
  }

  async getAccountByAccountUuid(accountUuid: string): Promise<ApiResponse<AccountDTO>> {
    console.log('📝 [AccountIpcClient] 获取账号信息', accountUuid);
    return ipcInvokeWithAuth('account:get-by-id', accountUuid);
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(userDTO: any): Promise<ApiResponse<void>> {
    console.log('📝 [AccountIpcClient] 更新用户信息', userDTO);
    const data = JSON.parse(JSON.stringify(userDTO));
    return ipcInvokeWithAuth('account:update-user-profile', data);
  }

  async getCurrentAccount(): Promise<ApiResponse<AccountDTO>> {
    console.log('📝 [AccountIpcClient] 获取当前账号信息');
    return ipcInvokeWithAuth('account:get-current-account');
  }
}

export const accountIpcClient = new AccountIpcClient();
