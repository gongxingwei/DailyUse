import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { GoalEventPublisher } from '../application/services/GoalEventPublisher';

/**
 * Goal 模块初始化任务
 */
const goalEventHandlersInitTask: InitializationTask = {
  name: 'goalEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20, // 应用启动后期执行
  initialize: async () => {
    await GoalEventPublisher.initialize();
    console.log('✓ Goal event handlers initialized');
  },
};

/**
 * 注册 Goal 模块的初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册事件处理器初始化任务
  manager.registerTask(goalEventHandlersInitTask);

  console.log('Goal module initialization tasks registered');
}
