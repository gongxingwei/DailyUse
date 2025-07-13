import { InitializationTask, InitializationPhase, InitializationManager } from '../../../shared/initialization/initializationManager';
import { GoalEventHandlers } from '../application/events/goalEventHandlers';

/**
 * Goal 模块初始化任务定义
 */

const goalEventHandlersInitializationTask: InitializationTask = {
  name: 'goal-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['notification'],
  initialize: async () => {
    GoalEventHandlers.registerHandlers();
    console.log('✓ Goal event handlers initialized');
  },
  cleanup: async () => {
    GoalEventHandlers.cleanup();
    console.log('✓ Goal event handlers cleaned up');
  }
};

/**
 * 注册 Goal 模块的所有初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  manager.registerTask(goalEventHandlersInitializationTask);
  
  console.log('🚀【主进程::Goal 模块】初始化任务注册完成');
}
