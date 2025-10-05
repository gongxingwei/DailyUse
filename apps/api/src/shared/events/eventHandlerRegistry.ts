/**
 * Event Handler Registry
 * @description 事件处理器注册中心 - 在应用启动时注册所有事件处理器
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { getEventBus } from '@dailyuse/domain-core';
import { createLogger } from '@dailyuse/utils';
import { ReminderInstanceCreatedHandler } from '../../modules/schedule/application/eventHandlers/ReminderInstanceCreatedHandler';
import { TaskTriggeredHandler } from '../../modules/notification/application/eventHandlers/TaskTriggeredHandler';
import { ScheduleContainer } from '../../modules/schedule/infrastructure/di/ScheduleContainer';
import { SSEController } from '../../modules/schedule/interface/http/SSEController';
import type { PrismaClient } from '@prisma/client';

const logger = createLogger('EventHandlerRegistry');

/**
 * 初始化并注册所有事件处理器
 *
 * 事件流：
 * 1. Reminder.createInstance() → ReminderInstanceCreatedEvent
 *    → ReminderInstanceCreatedHandler (Schedule 模块创建任务)
 *
 * 2. Schedule.executeTask() → TaskTriggeredEvent
 *    → TaskTriggeredHandler (Notification 模块发送 SSE)
 */
export function registerEventHandlers(prisma: PrismaClient, sseController: SSEController): void {
  const eventBus = getEventBus();

  logger.info('🎯 开始注册事件处理器...');

  try {
    // 1. 注册 ReminderInstanceCreatedHandler
    const scheduleContainer = ScheduleContainer.getInstance(prisma);
    const scheduleService = scheduleContainer.scheduleApplicationService;
    const reminderInstanceCreatedHandler = new ReminderInstanceCreatedHandler(scheduleService);
    eventBus.subscribe(reminderInstanceCreatedHandler);
    logger.info('✅ 已注册: ReminderInstanceCreatedHandler');

    // 2. 注册 TaskTriggeredHandler
    const taskTriggeredHandler = new TaskTriggeredHandler(sseController);
    eventBus.subscribe(taskTriggeredHandler);
    logger.info('✅ 已注册: TaskTriggeredHandler');

    logger.info('🎉 所有事件处理器注册完成');
  } catch (error) {
    logger.error('❌ 事件处理器注册失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
