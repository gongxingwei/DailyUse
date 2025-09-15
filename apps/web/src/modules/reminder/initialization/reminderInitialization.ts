/**
 * Reminder 模块初始化任务
 * 负责模块的启动初始化和用户会话初始化
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  eventBus,
} from '@dailyuse/utils';
import { useReminderStore } from '../presentation/stores/reminderStore';
import { reminderApiClient } from '../infrastructure/api/reminderApiClient';

/**
 * Reminder 模块启动初始化任务
 * 在应用启动时执行，不依赖用户会话
 */
const reminderAppStartupInitTask: InitializationTask = {
  name: 'reminder-app-startup',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30, // 在基础设施之后，用户会话之前
  initialize: async () => {
    console.log('📔 [Reminder] 开始模块启动初始化...');

    // 1. 注册全局事件监听器
    eventBus.on('reminder:template-created', (event: any) => {
      console.log('📔 [Reminder] 收到模板创建事件:', event.data);
    });

    eventBus.on('reminder:instance-triggered', (event: any) => {
      console.log('📔 [Reminder] 收到实例触发事件:', event.data);
    });

    eventBus.on('reminder:instance-responded', (event: any) => {
      console.log('📔 [Reminder] 收到实例响应事件:', event.data);
    });

    // 2. 初始化 API 客户端配置
    // reminderApiClient 已经通过 shared/api/instances 初始化

    console.log('✅ [Reminder] 模块启动初始化完成');
  },
  cleanup: async () => {
    console.log('🧹 [Reminder] 清理模块启动资源...');

    // 移除事件监听器
    eventBus.off('reminder:template-created');
    eventBus.off('reminder:instance-triggered');
    eventBus.off('reminder:instance-responded');

    console.log('✅ [Reminder] 模块启动资源清理完成');
  },
};

/**
 * Reminder 模块用户会话初始化任务
 * 在用户登录时执行，需要用户上下文
 */
const reminderUserSessionInitTask: InitializationTask = {
  name: 'reminder-user-session',
  phase: InitializationPhase.USER_LOGIN,
  priority: 30, // 中等优先级
  initialize: async (context: { accountUuid: string }) => {
    if (!context?.accountUuid) {
      throw new Error('Account UUID is required for reminder user session initialization');
    }

    console.log(`📔 [Reminder] 开始用户会话初始化: ${context.accountUuid}`);

    try {
      // 1. 初始化 Reminder Store（需要在 Pinia 上下文中）
      // 注意：这里不能直接调用 useReminderStore，需要在 Vue 组件上下文中调用
      console.log('📔 [Reminder] Reminder Store 将在首次使用时自动初始化');

      // 2. 发送模块初始化完成事件
      eventBus.emit('reminder:module-initialized', {
        data: { accountUuid: context.accountUuid },
        timestamp: Date.now(),
      });

      console.log(`✅ [Reminder] 用户会话初始化完成: ${context.accountUuid}`);
    } catch (error) {
      console.error(`❌ [Reminder] 用户会话初始化失败: ${context.accountUuid}`, error);
      throw error;
    }
  },
  cleanup: async () => {
    console.log('🧹 [Reminder] 清理用户会话...');

    try {
      // 1. 清除 Store 数据（如果可访问）
      // 注意：Store 清理将在用户登出时自动处理

      // 2. 发送模块清理事件
      eventBus.emit('reminder:module-cleanup', {
        data: {},
        timestamp: Date.now(),
      });

      console.log('✅ [Reminder] 用户会话清理完成');
    } catch (error) {
      console.error('❌ [Reminder] 用户会话清理失败', error);
    }
  },
};

/**
 * 注册所有 Reminder 模块的初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask(reminderAppStartupInitTask);
  manager.registerTask(reminderUserSessionInitTask);

  console.log('📝 [Reminder] 初始化任务已注册');
}

/**
 * Reminder 模块的手动初始化方法
 * 可用于动态加载或测试场景
 */
export async function initializeReminderModule(accountUuid?: string): Promise<void> {
  console.log('🔧 [Reminder] 手动初始化模块...');

  try {
    // 执行启动初始化
    await reminderAppStartupInitTask.initialize();

    // 如果提供了账户UUID，执行用户会话初始化
    if (accountUuid) {
      await reminderUserSessionInitTask.initialize({ accountUuid });
    }

    console.log('✅ [Reminder] 手动初始化完成');
  } catch (error) {
    console.error('❌ [Reminder] 手动初始化失败', error);
    throw error;
  }
}

/**
 * Reminder 模块的清理方法
 */
export async function cleanupReminderModule(): Promise<void> {
  console.log('🧹 [Reminder] 清理模块...');

  try {
    await reminderUserSessionInitTask.cleanup?.();
    await reminderAppStartupInitTask.cleanup?.();

    console.log('✅ [Reminder] 模块清理完成');
  } catch (error) {
    console.error('❌ [Reminder] 模块清理失败', error);
  }
}

/**
 * 检查 Reminder 模块是否已初始化
 */
export function isReminderModuleInitialized(): boolean {
  const manager = InitializationManager.getInstance();
  return (
    manager.isTaskCompleted('reminder-app-startup') &&
    manager.isTaskCompleted('reminder-user-session')
  );
}

/**
 * 获取 Reminder 模块初始化状态
 */
export function getReminderModuleStatus(): {
  appStartup: boolean;
  userSession: boolean;
  fullyInitialized: boolean;
} {
  const manager = InitializationManager.getInstance();
  const appStartup = manager.isTaskCompleted('reminder-app-startup');
  const userSession = manager.isTaskCompleted('reminder-user-session');

  return {
    appStartup,
    userSession,
    fullyInitialized: appStartup && userSession,
  };
}
