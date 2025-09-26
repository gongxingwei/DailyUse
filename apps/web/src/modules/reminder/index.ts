import { ReminderWebApplicationService } from './application/services/ReminderWebApplicationService';

/**
 * Reminder 模块导出
 */

// 懒加载的全局服务实例
let _reminderWebService: ReminderWebApplicationService | null = null;

/**
 * 获取 Reminder 服务实例（懒加载）
 */
export function getReminderWebService(): ReminderWebApplicationService {
  if (!_reminderWebService) {
    _reminderWebService = new ReminderWebApplicationService();
  }
  return _reminderWebService;
}

// 导出类型和服务
export { ReminderWebApplicationService } from './application/services/ReminderWebApplicationService';
export { useReminderStore, getReminderStore } from './presentation/stores/reminderStore';
export { default as useReminder } from './presentation/composables/useReminder';

// 导出初始化相关
export { registerReminderInitializationTasks } from './initialization';

// 导出类型
export type { ReminderStore } from './presentation/stores/reminderStore';

/**
 * 初始化 Reminder 模块
 * 应用启动时调用此方法来加载所有提醒数据
 */
export async function initializeReminderModule(): Promise<void> {
  try {
    console.log('正在初始化 Reminder 模块...');
    await getReminderWebService().initialize();
    console.log('Reminder 模块初始化完成');
  } catch (error) {
    console.error('Reminder 模块初始化失败:', error);
    throw error;
  }
}
