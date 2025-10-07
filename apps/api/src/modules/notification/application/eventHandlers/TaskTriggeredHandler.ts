/**
 * Task Triggered Event Handler
 * @description 监听 Schedule 任务触发事件，创建通知并发送到前端
 * @author DailyUse Team
 * @date 2025-01-09 (重构使用 DDD)
 */

import type { EventHandler } from '@dailyuse/domain-core';
import { TaskTriggeredEvent } from '../../../schedule/domain/events/ScheduleEvents';
import { createLogger } from '@dailyuse/utils';
import { SSEController } from '../../../schedule/interface/http/SSEController';
import { NotificationDomainService } from '../../domain/services/NotificationDomainService';
import { NotificationMetadata } from '../../domain/value-objects/NotificationMetadata';
import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('TaskTriggeredHandler');

/**
 * 任务触发事件处理器
 *
 * 职责：
 * 1. 监听 Schedule 模块发布的 TaskTriggeredEvent
 * 2. 使用 NotificationDomainService 创建持久化通知
 * 3. 通过 SSE 实时推送通知到前端
 *
 * 事件流：
 * Schedule.executeTask() → TaskTriggeredEvent → TaskTriggeredHandler
 *   → NotificationDomainService (创建通知)
 *   → SSE (实时推送)
 *
 * DDD 重构要点：
 * - 通知持久化到数据库（之前只是实时推送）
 * - 支持通知历史查询
 * - 遵循用户通知偏好设置
 */
export class TaskTriggeredHandler implements EventHandler {
  constructor(
    private readonly sseController: SSEController,
    private readonly notificationDomainService: NotificationDomainService,
  ) {}

  subscribedTo(): string {
    return TaskTriggeredEvent.EVENT_TYPE;
  }

  async handle(event: TaskTriggeredEvent): Promise<void> {
    try {
      logger.info('收到任务触发事件', {
        taskId: event.aggregateId,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        accountUuid: event.accountUuid,
      });

      // 提取提醒数据
      const payload = event.payload;
      const message = payload?.data?.message || '您有一个提醒';

      // 构造元数据
      const metadata = NotificationMetadata.create({
        sourceType: event.sourceType || 'schedule',
        sourceId: event.sourceId || event.aggregateId,
        additionalData: {
          taskId: event.aggregateId,
          scheduledTime: payload?.data?.scheduledTime,
          originalPayload: payload?.data,
        },
      });

      // 1. 使用 NotificationDomainService 创建持久化通知
      const notification = await this.notificationDomainService.createAndSendNotification({
        uuid: uuidv4(),
        accountUuid: event.accountUuid,
        title: '任务提醒',
        content: message,
        type: NotificationType.REMINDER,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP, NotificationChannel.SSE],
        icon: '⏰',
        metadata,
      });

      logger.info('通知已创建', {
        notificationId: notification.uuid,
        accountUuid: event.accountUuid,
        type: notification.type,
      });

      // 2. 🚀 通过 SSE 实时推送（保持原有功能）
      const ssePayload = {
        type: 'reminder',
        notificationId: notification.uuid,
        data: {
          sourceType: event.sourceType,
          sourceId: event.sourceId,
          taskId: event.aggregateId,
          message,
          scheduledTime: payload?.data?.scheduledTime,
          metadata: payload?.data,
        },
        timestamp: event.occurredOn.toISOString(),
      };

      (this.sseController as any).sendToUser(event.accountUuid, 'reminder', ssePayload);

      logger.info('提醒通知已发送', {
        accountUuid: event.accountUuid,
        notificationId: notification.uuid,
        channels: notification.deliveryChannels.channels,
        message,
      });
    } catch (error) {
      logger.error('处理任务触发事件失败', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.eventId,
        taskId: event.aggregateId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // 不抛出异常，避免影响其他事件处理器
    }
  }
}
