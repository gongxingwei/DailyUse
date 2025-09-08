/**
 * 账户模块初始化任务注册
 * Account Module Initialization Tasks
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { AccountEventHandlers } from '../application/events/accountEventHandlers';

/**
 * 注册账户模块的所有初始化任务
 */
export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 账户事件处理器初始化任务
  const accountEventHandlersTask: InitializationTask = {
    name: 'account-event-handlers',
    phase: InitializationPhase.APP_STARTUP,
    priority: 20, // 在基础设施之后初始化
    initialize: async () => {
      AccountEventHandlers.initializeEventHandlers();
      console.log('✅ [AccountModule] 事件处理器已初始化');
    },
    cleanup: async () => {
      AccountEventHandlers.destroyEventHandlers();
      console.log('🧹 [AccountModule] 事件处理器已清理');
    },
  };

  // 2. 账户数据预加载任务（用户登录时）
  const accountDataPreloadTask: InitializationTask = {
    name: 'account-data-preload',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`🔄 [AccountModule] 预加载账户数据: ${context.accountUuid}`);
        // 这里可以预加载一些账户相关的数据
        // 例如：用户偏好设置、权限信息等
      }
    },
    cleanup: async () => {
      console.log('🧹 [AccountModule] 清理账户数据缓存');
      // 清理账户相关的缓存数据
    },
  };

  // 3. 账户状态同步任务（用户登录时）
  const accountStateSyncTask: InitializationTask = {
    name: 'account-state-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    dependencies: ['account-data-preload'], // 依赖数据预加载
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`🔄 [AccountModule] 同步账户状态: ${context.accountUuid}`);
        // 同步账户状态到其他系统
      }
    },
    cleanup: async () => {
      console.log('🧹 [AccountModule] 清理账户状态同步');
    },
  };

  // 注册所有任务
  manager.registerTask(accountEventHandlersTask);
  manager.registerTask(accountDataPreloadTask);
  manager.registerTask(accountStateSyncTask);

  console.log('📝 [AccountModule] 所有初始化任务已注册');
}
