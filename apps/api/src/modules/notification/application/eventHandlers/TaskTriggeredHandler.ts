/**
 * Task Triggered Event Handler
 * @description 监听 Schedule 任务触发事件，发送通知到前端
 * @author DailyUse Team
 * @date 2025-01-09
 */

import type { EventHandler } from '@dailyuse/domain-core';
import { TaskTriggeredEvent } from '../../../schedule/domain/events/ScheduleEvents';
import { createLogger } from '@dailyuse/utils';
import { SSEController } from '../../../schedule/interface/http/SSEController';

const logger = createLogger('TaskTriggeredHandler');

/**
 * 任务触发事件处理器
 *
 * 职责：
 * 1. 监听 Schedule 模块发布的 TaskTriggeredEvent
 * 2. 提取提醒数据
 * 3. 发送 SSE 通知到前端
 *
 * 事件流：
 * Schedule.executeTask() → TaskTriggeredEvent → TaskTriggeredHandler → SSE Notification
 */
export class TaskTriggeredHandler implements EventHandler {
  private sseController: SSEController;

  constructor(sseController: SSEController) {
    this.sseController = sseController;
  }

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

      // 构造通知消息
      const notificationPayload = {
        type: 'reminder',
        data: {
          sourceType: event.sourceType,
          sourceId: event.sourceId,
          taskId: event.aggregateId,
          message: payload?.data?.message || '您有一个提醒',
          scheduledTime: payload?.data?.scheduledTime,
          metadata: payload?.data,
        },
        timestamp: event.occurredOn.toISOString(),
      };

      // 🚀 发送 SSE 通知到前端（通过 SSEController 的 sendToUser 方法）
      (this.sseController as any).sendToUser(event.accountUuid, 'reminder', notificationPayload);

      logger.info('提醒通知已发送', {
        accountUuid: event.accountUuid,
        eventType: 'reminder',
        message: notificationPayload.data.message,
      });
    } catch (error) {
      logger.error('处理任务触发事件失败', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.eventId,
        taskId: event.aggregateId,
      });
      // 不抛出异常，避免影响其他事件处理器
    }
  }
}
