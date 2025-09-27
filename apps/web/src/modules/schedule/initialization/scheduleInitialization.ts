/**
 * Schedule 模块初始化任务注册
 * @description 为 schedule 模块注册初始化任务到应用级别的初始化管理器中
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

/**
 * 注册 Schedule 模块的初始化任务
 */
export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // Schedule 模块核心初始化任务
  const scheduleInitTask: InitializationTask = {
    name: 'schedule-core',
    phase: InitializationPhase.APP_STARTUP,
    priority: 25, // 在 SSE 连接之后
    initialize: async () => {
      console.log('📅 [Schedule] 开始初始化调度模块...');

      try {
        // 这里可以添加调度模块的初始化逻辑
        // 例如：预加载调度任务、设置本地存储等

        console.log('✅ [Schedule] 调度模块初始化完成');
      } catch (error) {
        console.error('❌ [Schedule] 调度模块初始化失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Schedule] 清理调度模块...');

      try {
        // 清理调度模块资源
        console.log('✅ [Schedule] 调度模块清理完成');
      } catch (error) {
        console.error('❌ [Schedule] 调度模块清理失败:', error);
      }
    },
  };

  // 用户登录后的调度任务同步
  const scheduleUserSyncTask: InitializationTask = {
    name: 'schedule-user-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    initialize: async (context) => {
      console.log(`📅 [Schedule] 同步用户调度任务: ${context?.accountUuid}`);

      try {
        // 这里可以预加载用户的调度任务
        // 或者清理其他用户的本地缓存数据

        console.log('✅ [Schedule] 用户调度任务同步完成');
      } catch (error) {
        console.error('❌ [Schedule] 用户调度任务同步失败:', error);
        // 不抛出错误，不应该阻止用户登录
      }
    },
    cleanup: async (context) => {
      console.log(`🔒 [Schedule] 清理用户调度会话: ${context?.accountUuid}`);

      try {
        // 清理用户相关的调度数据
        console.log('✅ [Schedule] 用户调度会话清理完成');
      } catch (error) {
        console.error('❌ [Schedule] 用户调度会话清理失败:', error);
      }
    },
  };

  // 注册所有任务
  manager.registerTask(scheduleInitTask);
  manager.registerTask(scheduleUserSyncTask);

  console.log('📝 [Schedule] 调度模块初始化任务已注册');
}
