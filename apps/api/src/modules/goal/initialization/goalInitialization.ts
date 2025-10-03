import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { GoalApplicationService } from '../application/services/GoalApplicationService';

/**
 * Goal 模块初始化任务注册
 * 负责注册用户登录时的数据初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 用户登录时初始化目标模块数据
  const userGoalDataInitTask: InitializationTask = {
    name: 'userGoalData',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20, // 较高优先级，确保在其他模块之前初始化
    initialize: async (context?: { accountUuid?: string }) => {
      if (!context?.accountUuid) {
        console.warn('⚠️ [Goal] 用户登录初始化缺少 accountUuid');
        return;
      }

      console.log(`🎯 [Goal] 开始初始化用户目标数据: ${context.accountUuid}`);

      try {
        const goalService = await GoalApplicationService.getInstance();

        // 初始化用户目标模块数据（创建默认目录）
        await goalService.initializeUserData(context.accountUuid);

        console.log(`✅ [Goal] 用户目标数据初始化完成: ${context.accountUuid}`);
      } catch (error) {
        console.error(`❌ [Goal] 用户目标数据初始化失败:`, error);
        // 不抛出错误，避免影响其他模块的初始化
      }
    },
    cleanup: async () => {
      console.log('🧹 [Goal] 清理用户目标数据...');
      // 这里可以添加清理逻辑，如清除缓存等
    },
  };

  manager.registerTask(userGoalDataInitTask);

  console.log('✓ Goal module initialization tasks registered');
}
