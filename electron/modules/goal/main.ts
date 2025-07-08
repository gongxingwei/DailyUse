import { registerGoalIpcHandlers } from './ipcs/goalIpcHandlers';
import { GoalEventHandlers } from './infrastructure/events/goalEventHandlers';

/**
 * Goal 模块主入口
 * 初始化所有 Goal 相关的服务和 IPC 处理器
 */
export function initializeGoalModule() {
  console.log('🎯 正在初始化 Goal 模块...');
  
  try {
    // 注册 IPC 处理器
    registerGoalIpcHandlers();
    
    // 注册事件处理器
    GoalEventHandlers.registerHandlers();
    
    console.log('✅ Goal 模块初始化完成');
  } catch (error) {
    console.error('❌ Goal 模块初始化失败:', error);
    throw error;
  }
}

/**
 * 清理 Goal 模块
 */
export function cleanupGoalModule() {
  console.log('🧹 正在清理 Goal 模块...');
  
  try {
    // 清理事件处理器
    GoalEventHandlers.cleanup();
    
    console.log('✅ Goal 模块清理完成');
  } catch (error) {
    console.error('❌ Goal 模块清理失败:', error);
  }
}

// 导出服务供其他模块使用
export { MainGoalApplicationService } from './application/mainGoalApplicationService';
export { GoalContainer } from './infrastructure/di/goalContainer';
export { GoalDatabaseRepository } from './infrastructure/repositories/goalDatabaseRepository';
