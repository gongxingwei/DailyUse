// 导出应用层
export { GoalApplicationService } from './application/index.js';
export { GoalDirApplicationService } from './application/services/GoalDirApplicationService.js';

// 导出领域层
export { GoalDomainService } from './domain/index.js';
export { GoalDirDomainService } from './domain/services/GoalDirDomainService.js';

// 导出接口层
export { GoalController, GoalDirController, goalRouter, goalDirRouter } from './interface/index.js';

// 导出初始化和事件处理
export { registerGoalInitializationTasks } from './initialization/goalInitialization';
export {
  registerGoalEventHandlers,
  initializeGoalEventHandlers,
} from './application/events/goalEventHandlers';
