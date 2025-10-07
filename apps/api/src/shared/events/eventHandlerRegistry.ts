/**
 * Event Handler Registry
 * @description 事件处理器注册中心 - 在应用启动时注册所有事件处理器
 * @author DailyUse Team
 * @date 2025-01-10 (重构：支持 Reminder → Schedule → Notification 完整流程)
 */

import { getEventBus } from '@dailyuse/domain-core';
import { createLogger } from '@dailyuse/utils';
import { ReminderTemplateCreatedHandler } from '../../modules/schedule/application/eventHandlers/ReminderTemplateCreatedHandler';
import { TaskTriggeredHandler } from '../../modules/notification/application/eventHandlers/TaskTriggeredHandler';
import { ScheduleContainer } from '../../modules/schedule/infrastructure/di/ScheduleContainer';
import { NotificationApplicationService } from '../../modules/notification/application/services/NotificationApplicationService';
import { NotificationRepository } from '../../modules/notification/infrastructure/repositories/NotificationRepository';
import { NotificationTemplateRepository } from '../../modules/notification/infrastructure/repositories/NotificationTemplateRepository';
import { NotificationPreferenceRepository } from '../../modules/notification/infrastructure/repositories/NotificationPreferenceRepository';
import { SSEController } from '../../modules/schedule/interface/http/SSEController';
import type { PrismaClient } from '@prisma/client';

const logger = createLogger('EventHandlerRegistry');

/**
 * 初始化并注册所有事件处理器
 *
 * 事件流（完整流程）：
 *
 * 1. Reminder.createTemplate() → ReminderTemplateCreatedEvent
 *    → ReminderTemplateCreatedHandler (Schedule 模块自动创建调度任务)
 *
 * 2. Schedule.executeTask() → TaskTriggeredEvent
 *    → TaskTriggeredHandler (Notification 模块创建通知并发送)
 *      ├─ 创建 Notification 聚合根（持久化）
 *      ├─ Desktop: 通过 SSE 推送
 *      ├─ Email: 调用邮件服务（预留）
 *      └─ SMS: 调用短信服务（预留）
 */
export function registerEventHandlers(prisma: PrismaClient, sseController: SSEController): void {
  const eventBus = getEventBus();

  logger.info('🎯 开始注册事件处理器...');

  try {
    // ===== 1. Schedule 模块监听 ReminderTemplateCreated =====
    const scheduleContainer = ScheduleContainer.getInstance(prisma);
    const reminderTemplateCreatedHandler = new ReminderTemplateCreatedHandler(
      scheduleContainer.scheduleDomainService,
    );
    eventBus.subscribe(reminderTemplateCreatedHandler);
    logger.info('✅ 已注册: ReminderTemplateCreatedHandler (Reminder → Schedule)');

    // ===== 2. Notification 模块监听 TaskTriggered =====
    // 创建 NotificationApplicationService 实例
    const notificationRepository = new NotificationRepository(prisma);
    const templateRepository = new NotificationTemplateRepository(prisma);
    const preferenceRepository = new NotificationPreferenceRepository(prisma);

    const notificationService = new NotificationApplicationService(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    );

    const taskTriggeredHandler = new TaskTriggeredHandler(
      notificationService,
      sseController,
      // emailService,  // 预留：邮件服务
      // smsService,    // 预留：短信服务
    );
    eventBus.subscribe(taskTriggeredHandler);
    logger.info('✅ 已注册: TaskTriggeredHandler (Schedule → Notification)');

    logger.info('🎉 所有事件处理器注册完成');
    logger.info('📊 事件流: Reminder → Schedule → Notification');
  } catch (error) {
    logger.error('❌ 事件处理器注册失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
