/**
 * Schedule模块统一导出
 * @description 统一导出Schedule模块的所有公共接口
 * @author DailyUse Team
 * @date 2025-01-09
 */

// ========== 领域层导出 ==========
export { ScheduleTask } from './aggregates/ScheduleTask';
export { ScheduleDomainService } from './services/ScheduleDomainService';

// ========== 应用层导出 ==========
export { ScheduleApplicationService } from './application/ScheduleApplicationService';

// ========== 事件处理导出 ==========
export { ScheduleEventHandlers } from './events/ScheduleEventHandlers';

// ========== 基础设施层导出 ==========
export {
  ReminderTriggerHandler,
  reminderTriggerHandler,
  type PopupReminderConfig,
  type SoundReminderConfig,
} from './infrastructure/ReminderTriggerHandler';

// ========== 初始化管理导出 ==========
export {
  ScheduleInitializationManager,
  getScheduleInitializationManager,
  type PersistedScheduleTask,
} from './initialization/ScheduleInitializationManager';

// ========== 原有导出保留 ==========
export * from './aggregates/ScheduleTaskCore';
