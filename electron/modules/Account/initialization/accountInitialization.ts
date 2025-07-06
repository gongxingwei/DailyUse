import { InitializationManager, InitializationPhase, InitializationTask } from '../../../shared/initialization/initializationManager';
import { setupUserHandlers } from '../ipcs/userIpc';
import { setupLoginSessionHandlers } from '../ipcs/loginSessionIpc';
import { StoreIpc } from '../ipcs/storeIpc';

/**
 * 账户模块的初始化任务定义
 */

// 用户 IPC 处理器初始化
const userIpcInitTask: InitializationTask = {
  name: 'user-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  dependencies: ['filesystem'],
  initialize: async () => {
    setupUserHandlers();
    console.log('✓ User IPC handlers registered');
  }
};

// 登录会话 IPC 处理器初始化
const loginSessionIpcInitTask: InitializationTask = {
  name: 'login-session-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25,
  dependencies: ['user-ipc-handlers'],
  initialize: async () => {
    setupLoginSessionHandlers();
    console.log('✓ Login session IPC handlers registered');
  }
};

// 存储 IPC 处理器初始化
const storeIpcInitTask: InitializationTask = {
  name: 'store-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30,
  dependencies: ['user-ipc-handlers'],
  initialize: async () => {
    StoreIpc.registerHandlers();
    console.log('✓ Store IPC handlers registered');
  }
};

/**
 * 注册所有账户模块的初始化任务
 */
export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  manager.registerTask(userIpcInitTask);
  manager.registerTask(loginSessionIpcInitTask);
  manager.registerTask(storeIpcInitTask);
  
  console.log('Account module initialization tasks registered');
}
