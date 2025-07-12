import { AccountDTO } from '../../domain/types/account';
import type { User, AccountRegistrationRequest } from '../../index';

export class AccountIpcClient {
    async accountRegistration(
        registrationData: AccountRegistrationRequest
    ): Promise<TResponse<User>> {
        console.log('📝 [AccountIpcClient] 发送账号注册请求', registrationData);
        const serializedDto = JSON.parse(JSON.stringify(registrationData));
        console.log('📝 [AccountIpcClient] 序列化后的注册数据', serializedDto);
        return window.shared.ipcRenderer.invoke('account:register', serializedDto);
    }

    async getAccountByAccountId(accountId: string): Promise<TResponse<AccountDTO>> {
        console.log('📝 [AccountIpcClient] 获取账号信息', accountId);
        return window.shared.ipcRenderer.invoke('account:get-by-id', accountId);
    }
}

export const accountIpcClient = new AccountIpcClient();
