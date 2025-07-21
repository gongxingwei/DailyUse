import type { AccountRegistrationRequest, AccountDTO } from '@electron/modules/Account';
import { ipcInvokeWithAuth } from '@/shared/utils/ipcInvokeWithAuth';

export class AccountIpcClient {
    async accountRegistration(
        registrationData: AccountRegistrationRequest
    ): Promise<TResponse<AccountDTO>> {
        console.log('📝 [AccountIpcClient] 发送账号注册请求', registrationData);
        const serializedDto = JSON.parse(JSON.stringify(registrationData));
        console.log('📝 [AccountIpcClient] 序列化后的注册数据', serializedDto);
        return window.shared.ipcRenderer.invoke('account:register', serializedDto);
    }

    async getAccountByAccountUuid(accountUuid: string): Promise<TResponse<AccountDTO>> {
        console.log('📝 [AccountIpcClient] 获取账号信息', accountUuid);
        return ipcInvokeWithAuth('account:get-by-id', accountUuid);
    }
}

export const accountIpcClient = new AccountIpcClient();
