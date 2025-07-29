import { authenticationService } from "@/modules/Authentication/application/services/authenticationService";

import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@electron/shared/initialization/initializationManager";
export class MainWindowInit {
  async initialize() {
    // 只在主窗口执行
    const argv: string[] = window.env?.argv || [];
    if (!argv.includes('--window-type=main')) {
      return;
    }
    try {
      console.log("🚀 [MainWindowInit] 初始化主窗口登录信息");
      const response = await authenticationService.getAuthInfo();
      if (!response.success || !response.data) {
        throw new Error("获取认证信息失败");
      }


    } catch (error) {
      console.error('初始化账户信息失败:', error);
    }
  }
}

const mainWindowInitTask: InitializationTask = {
  name: 'src-mainWindowInitTask',
    phase: InitializationPhase.APP_STARTUP,
    priority: 100,
    dependencies: [''],
    initialize: async () => {
        const mainWindowInit = new MainWindowInit();
        await mainWindowInit.initialize();
        console.log('✓ 渲染进程主窗口初始化用户信息任务完成');
        }
};

export function registerMainWindowInitTask(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(mainWindowInitTask);
  console.log('主窗口初始化任务已注册');
}