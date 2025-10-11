/**
 * Theme 模块初始化任务注册
 * 负责在应用启动时初始化主题服务和事件监听器
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { ThemeApplicationService } from '../application/services/ThemeApplicationService';
import { PrismaUserThemePreferenceRepository } from '../infrastructure/repositories/PrismaUserThemePreferenceRepository';
import { ThemeEventListeners } from '../application/events/ThemeEventListeners';
import { prisma } from '../../../config/prisma';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ThemeInitialization');

/**
 * 注册 Theme 模块的初始化任务
 */
export function registerThemeInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 应用启动时初始化 Theme 服务和事件监听器
  const themeServiceInitTask: InitializationTask = {
    name: 'themeService',
    phase: InitializationPhase.APP_STARTUP,
    priority: 13, // 在 setting service 之后初始化
    initialize: async () => {
      logger.info('🎨 [Theme] Initializing theme service...');

      try {
        // 创建仓储实例
        const themeRepository = new PrismaUserThemePreferenceRepository(prisma);

        // 初始化 ThemeApplicationService 单例
        const themeService = ThemeApplicationService.createInstance(themeRepository);

        // 注册 Theme 事件监听器
        const themeEventListeners = new ThemeEventListeners(themeService);
        themeEventListeners.registerListeners();

        logger.info('✅ [Theme] Theme service and event listeners initialized successfully');
      } catch (error) {
        logger.error('❌ [Theme] Failed to initialize theme service:', error);
        throw error;
      }
    },
    cleanup: async () => {
      logger.info('🧹 [Theme] Cleaning up theme service...');
      // 清理逻辑（如果需要）
    },
  };

  manager.registerTask(themeServiceInitTask);

  logger.info('✓ Theme module initialization tasks registered');
}
