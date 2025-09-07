import { useAuthenticationStore } from "@renderer/modules/Authentication/presentation/stores/authenticationStore";

export async function ipcInvokeWithAuth(channel: string, ...args: any[]) {
  const authStore = useAuthenticationStore();
  const token = authStore.getToken;
  const accountUuid = authStore.getAccountUuid;
  console.log(`IPC Invoke with Auth - Channel: ${channel}, Token: ${token}, accountUuid: ${accountUuid}`);
  return await window.shared.ipcRenderer.invoke(channel, ...args, { auth: { token, accountUuid } });
}
