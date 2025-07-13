import type { PasswordAuthenticationRequest, PasswordAuthenticationResponse } from "@/modules/Authentication/domain/types";
export class AuthenticationIpcClient { 
    private static instance: AuthenticationIpcClient | null = null;
    private constructor() {}
    public static getInstance(): AuthenticationIpcClient {
        if (!AuthenticationIpcClient.instance) {
            AuthenticationIpcClient.instance = new AuthenticationIpcClient();
        }
        return AuthenticationIpcClient.instance;
    }
    async passwordAuthentication(credentials: PasswordAuthenticationRequest): Promise<TResponse<PasswordAuthenticationResponse>> {
        console.log(['[AuthenticationIpcClient] passwordAuthentication', credentials])
        const serializedCredentials = JSON.parse(JSON.stringify(credentials));
        return await window.shared.ipcRenderer.invoke('authentication:password-authentication', serializedCredentials);
    }

    async loginSuccessEvent(): Promise<void> {
        console.log('[AuthenticationIpcClient] 发送登录成功事件');
       return await window.shared.ipcRenderer.send('login:success');
    }

    
}

export const authenticationIpcClient = AuthenticationIpcClient.getInstance();