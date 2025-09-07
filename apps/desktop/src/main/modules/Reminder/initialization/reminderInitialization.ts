import { InitializationTask, InitializationPhase, InitializationManager } from '../../../shared/initialization/initializationManager';
import { registerReminderIpcHandlers, unregisterReminderIpcHandlers } from '../infrastructure/ipcs/reminderIpcHandlers';
import { MainReminderApplicationService } from '../application/services/reminderApplicationService';

const reminderAppService = new MainReminderApplicationService();

// 初始化系统根 ReminderGroup 任务，后续应该添加到用户注册时的初始化流程中
const reminderModuleInitializationTask: InitializationTask = {
  name: 'reminder-module-initialization',
  phase: InitializationPhase.USER_LOGIN,
  priority: 10,
  initialize: async (context: { accountUuid: string }) => {
    // 初始化提醒模块
    const response = await reminderAppService.initializeReminderModule(context.accountUuid);
    if (!response.success) {
      throw new Error(`提醒模块初始化失败: ${response.message}`);
    }
    console.log('【主进程初始化根分组】');
  }
};

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

const reminderSchedulesInitializationTask: InitializationTask = {
  name: 'reminder-schedules-initialization',
  phase: InitializationPhase.USER_LOGIN,
  priority: 20,
  dependencies: ['reminder-module-initialization'],
  initialize: async (context: { accountUuid: string }) => {
    reminderAppService.initializeReminderSchedule(context.accountUuid);
    console.log('✓ Reminder schedules initialized');
  }
};

/**
 * 注册 Reminder 模块的所有初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(reminderModuleInitializationTask);
  manager.registerTask(reminderIpcHandlersInitializationTask);
  manager.registerTask(reminderSchedulesInitializationTask);

  console.log('🚀【主进程::Reminder 模块】初始化任务注册完成');
}
