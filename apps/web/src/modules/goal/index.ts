import { GoalWebApplicationService } from './application/services/GoalWebApplicationService';

/**
 * Goal 模块导出
 */

// 懒加载的全局服务实例
let _goalWebService: GoalWebApplicationService | null = null;

/**
 * 获取 Goal 服务实例（懒加载）
 */
export function getGoalWebService(): GoalWebApplicationService {
  if (!_goalWebService) {
    _goalWebService = new GoalWebApplicationService();
  }
  return _goalWebService;
}

// 导出类型和服务
export { GoalWebApplicationService } from './application/services/GoalWebApplicationService';
export { useGoalStore } from './presentation/stores/goalStore';
export { useGoal } from './presentation/composables/useGoal';

// 导出初始化相关
export { registerGoalInitializationTasks } from './initialization';

// 导出类型
export type { GoalStore } from './presentation/stores/goalStore';

/**
 * 初始化 Goal 模块
 * 应用启动时调用此方法来加载所有目标数据
 */
export async function initializeGoalModule(): Promise<void> {
  try {
    console.log('正在初始化 Goal 模块...');
    await getGoalWebService().initialize();
    console.log('Goal 模块初始化完成');
  } catch (error) {
    console.error('Goal 模块初始化失败:', error);
    throw error;
  }
}
