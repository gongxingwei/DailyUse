import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from '../../../shared/initialization/initializationManager';
import { AccountIpcHandler } from '../infrastructure/ipc/accountIpcHandler';
import { registerAccountEventHandlers } from '../application/eventHandlers';

/**
 * 账户模块的初始化任务定义
 */

const accountIpcInitTask: InitializationTask = {
  name: 'account-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await new AccountIpcHandler().initialize();
    console.log('✓ Account IPC handlers registered');
  },
};

/**
 * Account 模块的 事件处理器 初始化
 */
const accountEventHandlersInitTask: InitializationTask = {
  name: 'account-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  dependencies: [],
  initialize: async () => {
    registerAccountEventHandlers();
    console.log('✓ Account 模块 的事件处理器 注册成功');
  },
};

/**
 * 注册所有账户模块的初始化任务
 */
export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(accountIpcInitTask);
  manager.registerTask(accountEventHandlersInitTask);

  console.log('Account module initialization tasks registered');
}
