import { InitializationTask, InitializationPhase, InitializationManager } from '../../../shared/initialization/initializationManager';
import { registerReminderIpcHandlers, unregisterReminderIpcHandlers } from '../infrastructure/ipcs/reminderIpcHandlers';

/**
 * Reminder 模块初始化任务定义
 */

const reminderIpcHandlersInitializationTask: InitializationTask = {
  name: 'reminder-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['notification'],
  initialize: async () => {
    registerReminderIpcHandlers();
    console.log('✓ Reminder IPC handlers initialized');
  },
  cleanup: async () => {
    unregisterReminderIpcHandlers();
    console.log('✓ Reminder IPC handlers cleaned up');
  }
};

/**
 * 注册 Reminder 模块的所有初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask(reminderIpcHandlersInitializationTask);

  console.log('🚀【主进程::Reminder 模块】初始化任务注册完成');
}