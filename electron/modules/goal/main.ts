import { registerGoalIpcHandlers } from './ipcs/goalIpcHandlers';

/**
 * Goal 模块主入口
 * 初始化所有 Goal 相关的服务和 IPC 处理器
 */
export function initializeGoalModule() {
  console.log('🎯 正在初始化 Goal 模块...');
  
  try {
    // 注册 IPC 处理器
    registerGoalIpcHandlers();
    
    console.log('✅ Goal 模块初始化完成');
  } catch (error) {
    console.error('❌ Goal 模块初始化失败:', error);
    throw error;
  }
}

// 导出服务供其他模块使用
export { MainGoalApplicationService } from './application/mainGoalApplicationService';
export { GoalContainer } from './infrastructure/di/goalContainer';
export { GoalDatabaseRepository } from './infrastructure/repositories/goalDatabaseRepository';
