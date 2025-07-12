import { InitializationTask, InitializationPhase, InitializationManager } from '../../../shared/initialization/initializationManager';
import { initializeGoalModule } from '../main';

/**
 * Goal 模块初始化任务定义
 */

// Goal 模块初始化任务
const goalModuleInitTask: InitializationTask = {
  name: 'goal-module',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['notification'],
  initialize: async () => {
    initializeGoalModule();
    console.log('✓ Goal module initialized');
    
    // 在开发模式下运行测试（暂时禁用，避免测试错误影响启动）
    // if (process.env.NODE_ENV === 'development') {
    //   try {
    //     const { runGoalModuleTests } = await import('../tests/goalModuleTest');
    //     // 延迟运行测试，确保所有模块都已初始化
    //     setTimeout(() => {
    //       runGoalModuleTests().catch(console.error);
    //     }, 2000);
    //   } catch (error) {
    //     console.log('Goal module tests not available:', error);
    //   }
    // }
  },
  cleanup: async () => {
    console.log('✓ Goal module cleaned up');
  }
};

/**
 * 注册 Goal 模块的所有初始化任务
 */
export function registerGoalInitializationTasks(): void {
  console.log('🚀, Registering Goal module initialization tasks...');
  const manager = InitializationManager.getInstance();
  
  manager.registerTask(goalModuleInitTask);
  
  console.log('Goal module initialization tasks registered');
}
