/**
 * 主题系统初始化任务
 * 在用户登录后初始化主题和偏好设置
 */

import { useThemeStore } from '../themeStore';
import { useUserPreferencesStore } from '@/modules/setting/presentation/stores/userPreferencesStore';
import { InitializationPhase, InitializationManager } from '@dailyuse/utils';
import type { InitializationTask } from '@dailyuse/utils';

/**
 * 注册主题系统初始化任务
 * 应该在用户登录后执行
 */
export function registerThemeInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 初始化用户偏好设置
  const userPreferencesInitTask: InitializationTask = {
    name: 'initialize-user-preferences',
    phase: InitializationPhase.USER_LOGIN,
    priority: 100,
    async initialize() {
      console.log('📋 [Theme Init] 初始化用户偏好设置');

      try {
        const userPreferencesStore = useUserPreferencesStore();
        await userPreferencesStore.initialize();

        console.log('✅ [Theme Init] 用户偏好设置初始化完成');
      } catch (error) {
        console.warn('⚠️ [Theme Init] 用户偏好设置初始化失败，将使用默认设置:', error);
        // 不抛出错误，允许应用继续运行
      }
    },
    async cleanup() {
      console.log('🧹 [Theme Init] 清理用户偏好设置');
      const userPreferencesStore = useUserPreferencesStore();
      userPreferencesStore.clearError();
    },
  };

  // 2. 初始化主题系统
  const themeSystemInitTask: InitializationTask = {
    name: 'initialize-theme-system',
    phase: InitializationPhase.USER_LOGIN,
    priority: 90, // 在用户偏好之后执行
    dependencies: ['initialize-user-preferences'],
    async initialize() {
      console.log('🎨 [Theme Init] 初始化主题系统');

      try {
        const themeStore = useThemeStore();
        await themeStore.initialize();

        console.log('✅ [Theme Init] 主题系统初始化完成');
      } catch (error) {
        console.warn('⚠️ [Theme Init] 主题系统初始化失败，将使用默认主题:', error);
        // 不抛出错误，允许应用继续运行
      }
    },
    async cleanup() {
      console.log('🧹 [Theme Init] 清理主题系统');
      // 主题系统不需要特别清理
    },
  };

  manager.registerTask(userPreferencesInitTask);
  manager.registerTask(themeSystemInitTask);

  console.log('📝 [Theme] 主题系统初始化任务已注册');
}
