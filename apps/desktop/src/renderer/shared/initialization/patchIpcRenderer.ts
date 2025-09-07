import { useAccountStore } from "@renderer/modules/Account";
import { useAuthenticationStore } from "@renderer/modules/Authentication/presentation/stores/authenticationStore";
import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@main/shared/initialization/initializationManager";
export function patchIpcRendererInvokeWithAuth() {
  const accountStore = useAccountStore();
  const authenticationStore = useAuthenticationStore();

  const originalInvoke = window.shared.ipcRenderer.invoke;
  window.shared.ipcRenderer.invoke = function(channel: string, ...args: any[]) {
    const token = authenticationStore?.getToken ? authenticationStore.getToken : undefined;
    const account_uuid = accountStore?.getAccountUuid ? accountStore.getAccountUuid : undefined;
    // 检查最后一个参数是否已经有 auth，避免重复添加
    const lastArg = args[args.length - 1];
    if (lastArg && typeof lastArg === 'object' && lastArg.auth) {
      return originalInvoke.call(this, channel, ...args);
    }
    console.log('Patching ipcRenderer.invoke with auth:', { token, account_uuid });
    return originalInvoke.call(this, channel, ...args, { auth: { token, account_uuid } });
  };
}

const patchIpcRendererInvokeWithAuthTask: InitializationTask = {
  name: "PatchIpcRendererInvokeWithAuth",
  phase: InitializationPhase.APP_STARTUP,
  priority: 100,
  initialize: async () => {
    console.log("【PatchIpcRendererInvokeWithAuth 开始初始化】");
    patchIpcRendererInvokeWithAuth();
    console.log("ipcRenderer.invoke patched successfully.");
  },
  cleanup: async () => {
    console.log("Cleaning up ipcRenderer.invoke patch...");
    // 如果需要，可以在这里添加清理逻辑
  },
};

export function registerPatchIpcRendererInvokeWithAuthTask() {
  const manager = InitializationManager.getInstance();
  manager.registerTask(patchIpcRendererInvokeWithAuthTask);
}
