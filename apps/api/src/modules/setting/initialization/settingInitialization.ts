/**
 * Setting 模块初始化任务注册
 * 负责在应用启动时初始化用户偏好服务和事件发布器
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { UserPreferencesApplicationService } from '../application/services/UserPreferencesApplicationService';
import { PrismaUserPreferencesRepository } from '../infrastructure/repositories/PrismaUserPreferencesRepository';
import { EventPublisher } from '../infrastructure/events/EventPublisher';
import { prisma } from '../../../config/prisma';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingInitialization');

/**
 * 注册 Setting 模块的初始化任务
 */
export function registerSettingInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 应用启动时初始化 UserPreferences 服务和事件发布器
  const settingServiceInitTask: InitializationTask = {
    name: 'settingService',
    phase: InitializationPhase.APP_STARTUP,
    priority: 12,
    initialize: async () => {
      logger.info('⚙️ [Setting] Initializing setting service...');

      try {
        // 创建仓储实例
        const userPreferencesRepository = new PrismaUserPreferencesRepository(prisma);

        // 初始化 UserPreferencesApplicationService 单例
        const userPreferencesService =
          UserPreferencesApplicationService.createInstance(userPreferencesRepository);

        // 创建并设置事件发布器
        const eventPublisher = new EventPublisher();
        userPreferencesService.setEventPublisher(eventPublisher);

        logger.info('✅ [Setting] Setting service and event publisher initialized successfully');
      } catch (error) {
        logger.error('❌ [Setting] Failed to initialize setting service:', error);
        throw error;
      }
    },
    cleanup: async () => {
      logger.info('🧹 [Setting] Cleaning up setting service...');
      // 清理逻辑（如果需要）
    },
  };

  manager.registerTask(settingServiceInitTask);

  logger.info('✓ Setting module initialization tasks registered');
}
