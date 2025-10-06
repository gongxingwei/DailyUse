// 导出应用层
export { ReminderApplicationService } from './application/index.js';

// ReminderDomainService 已被删除 - 请直接使用聚合根和仓储

// 导出接口层
export {
  ReminderTemplateController,
  ReminderTemplateGroupController,
  reminderRouter,
} from './interface/index.js';
