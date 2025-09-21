// 导出应用层
export { ReminderApplicationService } from './application/index.js';

// 导出领域层
export { ReminderDomainService } from './domain/index.js';

// 导出接口层
export {
  ReminderTemplateController,
  ReminderTemplateGroupController,
  reminderRouter,
} from './interface/index.js';
