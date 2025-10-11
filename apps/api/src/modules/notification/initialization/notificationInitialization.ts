/**
 * Notification 模块初始化任务注册
 * 负责在应用启动时初始化通知服务
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { NotificationApplicationService } from '../application/services/NotificationApplicationService';
import { NotificationTemplateController } from '../interface/http/controllers/NotificationTemplateController';
import { NotificationController } from '../interface/http/controllers/NotificationController';
import { NotificationPreferenceController } from '../interface/http/controllers/NotificationPreferenceController';
import { NotificationRepository } from '../infrastructure/repositories/NotificationRepository';
import { NotificationTemplateRepository } from '../infrastructure/repositories/NotificationTemplateRepository';
import { NotificationPreferenceRepository } from '../infrastructure/repositories/NotificationPreferenceRepository';
import { prisma } from '../../../config/prisma';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationInitialization');

/**
 * 注册 Notification 模块的初始化任务
 */
export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 应用启动时初始化 Notification 服务
  const notificationServiceInitTask: InitializationTask = {
    name: 'notificationService',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    initialize: async () => {
      logger.info('🔔 [Notification] Initializing notification service...');

      try {
        // 创建仓储实例
        const notificationRepository = new NotificationRepository(prisma);
        const templateRepository = new NotificationTemplateRepository(prisma);
        const preferenceRepository = new NotificationPreferenceRepository(prisma);

        // 初始化 NotificationApplicationService 单例
        NotificationApplicationService.createInstance(
          notificationRepository,
          templateRepository,
          preferenceRepository,
        );

        // 初始化控制器单例
        NotificationController.createInstance();
        NotificationTemplateController.createInstance();
        NotificationPreferenceController.createInstance();

        logger.info(
          '✅ [Notification] Notification service and controllers initialized successfully',
        );
      } catch (error) {
        logger.error('❌ [Notification] Failed to initialize notification service:', error);
        throw error;
      }
    },
    cleanup: async () => {
      logger.info('🧹 [Notification] Cleaning up notification service...');
      // 清理逻辑（如果需要）
    },
  };

  manager.registerTask(notificationServiceInitTask);

  logger.info('✓ Notification module initialization tasks registered');
}
