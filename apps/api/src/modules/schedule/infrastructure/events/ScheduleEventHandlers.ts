/**
 * Schedule 模块事件处理器注册
 * 注册所有 Schedule 模块相关的事件处理器
 */

import { getEventBus } from '@dailyuse/domain-core';
import { ReminderTemplateStatusChangedHandler } from '../../application/eventHandlers/ReminderTemplateStatusChangedHandler';
import { ScheduleContainer } from '../di/ScheduleContainer';
import { createLogger } from '@dailyuse/utils';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('ScheduleEventHandlers');

// 创建一个全局 PrismaClient 实例（临时方案）
let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

/**
 * 注册 Schedule 模块的所有事件处理器
 */
export function initializeScheduleEventHandlers(): void {
  logger.info('🗓️ [Schedule] 初始化 Schedule 模块事件处理器...');

  try {
    const eventBus = getEventBus();
    const prisma = getPrismaClient();
    const container = ScheduleContainer.getInstance(prisma);

    // 获取 RecurringScheduleTaskDomainService
    const recurringScheduleTaskDomainService = container.recurringScheduleTaskDomainService;

    // 注册 ReminderTemplate 状态变更事件处理器
    const statusChangedHandler = new ReminderTemplateStatusChangedHandler(
      recurringScheduleTaskDomainService,
    );
    eventBus.subscribe(statusChangedHandler);

    logger.info('✅ [Schedule] ReminderTemplateStatusChangedHandler 已注册');
    logger.info('✅ [Schedule] Schedule 模块事件处理器初始化完成');
  } catch (error) {
    logger.error('❌ [Schedule] 初始化 Schedule 模块事件处理器失败:', error);
    throw error;
  }
}
