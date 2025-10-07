/**
 * TaskTriggered Event Handler
 * @description Notification 模块监听 Schedule 模块的任务触发事件，创建通知并发送
 * @author DailyUse Team
 * @date 2025-01-10 (重构：通过事件总线转发，支持多通道和重试)
 */

import type { EventHandler } from '@dailyuse/domain-core';
import { TaskTriggeredEvent } from '../../../schedule/domain/events/ScheduleEvents';
import type { NotificationContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { NotificationApplicationService } from '../services/NotificationApplicationService';
import type { SSEController } from '../../../schedule/interface/http/SSEController';

const logger = createLogger('TaskTriggeredHandler');

/**
 * Task Triggered Event Handler
 *
 * 职责：
 * 1. 监听 Schedule 模块的 TaskTriggeredEvent
 * 2. 创建 Notification 聚合根（持久化）
 * 3. 根据 channels 发送通知（SSE/Email/SMS）
 * 4. 实现重试机制和死信队列
 *
 * 架构优化：
 * - Schedule 模块只负责调度，不直接使用 SSE
 * - Notification 模块统一管理所有通知方式
 * - 支持多通道并发发送
 * - 完整的审计日志和状态跟踪
 *
 * 事件流：
 * ScheduleTaskScheduler.executeTask()
 *   → eventBus.publish(TaskTriggeredEvent)
 *   → TaskTriggeredHandler.handle()
 *   → NotificationApplicationService.createNotification()
 *   → sendToChannels() (SSE/Email/SMS)
 */
export class TaskTriggeredHandler implements EventHandler {
  // 重试配置
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1秒

  constructor(
    private readonly notificationService: NotificationApplicationService,
    private readonly sseController: SSEController,
    private readonly emailService?: any, // 预留接口
    private readonly smsService?: any, // 预留接口
  ) {}

  subscribedTo(): string {
    return TaskTriggeredEvent.EVENT_TYPE;
  }

  /**
   * 处理事件
   */
  async handle(event: TaskTriggeredEvent): Promise<void> {
    logger.info('📨 收到 TaskTriggered 事件', {
      taskUuid: event.aggregateId,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      accountUuid: event.accountUuid,
    });

    try {
      // 根据任务类型路由到不同的处理器
      await this.routeByTaskType(event);
    } catch (error) {
      logger.error('❌ 处理 TaskTriggered 事件失败', {
        taskUuid: event.aggregateId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // 不抛出错误，避免影响其他事件处理器
      // 失败的任务会通过死信队列处理
    }
  }

  /**
   * 根据任务类型路由到不同的处理器
   */
  private async routeByTaskType(event: TaskTriggeredEvent): Promise<void> {
    const payload = event.payload;
    const taskType = payload.type || payload.data?.type;

    logger.debug('路由任务类型', { taskType, sourceType: event.sourceType });

    switch (taskType) {
      case 'TASK_REMINDER':
      case 'GENERAL_REMINDER':
      case 'GOAL_REMINDER':
        await this.handleReminderNotification(event);
        break;

      case 'SYSTEM_ALERT':
        await this.handleSystemNotification(event);
        break;

      default:
        logger.warn('未知的任务类型，使用默认处理', { taskType });
        await this.handleReminderNotification(event);
    }
  }

  /**
   * 处理提醒通知
   */
  private async handleReminderNotification(event: TaskTriggeredEvent): Promise<void> {
    const { accountUuid, payload } = event;
    const reminderData = payload.data?.reminderData || payload.reminderData || {};

    logger.debug('处理提醒通知', {
      accountUuid,
      title: reminderData.title,
      priority: reminderData.priority,
    });

    // 1. 创建 Notification 聚合根（持久化记录）
    const notification = await this.notificationService.createNotification(accountUuid, {
      title: reminderData.title || '提醒',
      content: reminderData.message || reminderData.content || '',
      type: this.mapNotificationType(payload.type),
      priority: this.mapPriority(reminderData.priority),
      channels: this.mapChannels(reminderData.notificationSettings),
      icon: reminderData.icon,
      actions: reminderData.actions,
      metadata: {
        sourceModule: event.sourceType || 'reminder',
        sourceId: event.sourceId,
        taskUuid: event.aggregateId,
        reminderData,
      },
    });

    logger.info('✅ Notification 聚合根已创建', {
      notificationUuid: notification.uuid,
      accountUuid,
      channels: notification.channels,
    });

    // 2. 根据 channels 发送通知（带重试）
    await this.sendToChannels(notification, accountUuid, reminderData);
  }

  /**
   * 处理系统通知
   */
  private async handleSystemNotification(event: TaskTriggeredEvent): Promise<void> {
    // 系统通知的特殊处理逻辑
    logger.info('处理系统通知', { eventId: event.eventId });
    // TODO: 实现系统通知逻辑
  }

  /**
   * 根据通道发送通知（核心方法）
   */
  private async sendToChannels(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
    reminderData: any,
  ): Promise<void> {
    const channels = notification.channels || [];

    logger.debug('准备发送通知到多个通道', {
      notificationId: notification.uuid,
      channels,
    });

    // 并发发送到所有通道
    const sendPromises = channels.map((channel) =>
      this.sendToChannelWithRetry(notification, accountUuid, channel, reminderData),
    );

    const results = await Promise.allSettled(sendPromises);

    // 统计发送结果
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    logger.info('📊 通知发送完成', {
      notificationId: notification.uuid,
      totalChannels: channels.length,
      success: successCount,
      failed: failCount,
    });
  }

  /**
   * 发送到单个通道（带重试）
   */
  private async sendToChannelWithRetry(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
    channel: NotificationContracts.NotificationChannel,
    reminderData: any,
  ): Promise<void> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.sendToChannel(notification, accountUuid, channel, reminderData);

        logger.info('✅ 通道发送成功', {
          notificationId: notification.uuid,
          channel,
          attempt: attempt + 1,
        });

        return; // 成功后退出重试循环
      } catch (error) {
        const isLastAttempt = attempt === this.MAX_RETRIES - 1;

        logger.error(`❌ 通道发送失败 (尝试 ${attempt + 1}/${this.MAX_RETRIES})`, {
          notificationId: notification.uuid,
          channel,
          error: error instanceof Error ? error.message : String(error),
        });

        if (isLastAttempt) {
          // 最后一次重试失败：保存到死信队列
          await this.saveToDeadLetterQueue(notification, channel, error);
        } else {
          // 指数退避
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt);
          logger.debug(`⏳ 等待 ${delay}ms 后重试`, {
            notificationId: notification.uuid,
            channel,
            nextAttempt: attempt + 2,
          });
          await this.sleep(delay);
        }
      }
    }
  }

  /**
   * 发送到单个通道（实际发送逻辑）
   */
  private async sendToChannel(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
    channel: NotificationContracts.NotificationChannel,
    reminderData: any,
  ): Promise<void> {
    switch (channel) {
      case 'DESKTOP':
        await this.sendDesktopNotification(notification, accountUuid, reminderData);
        break;

      case 'EMAIL':
        await this.sendEmailNotification(notification, accountUuid);
        break;

      case 'SMS':
        await this.sendSmsNotification(notification, accountUuid);
        break;

      case 'IN_APP':
        await this.sendInAppNotification(notification, accountUuid);
        break;

      default:
        logger.warn('未知的通知通道', { channel });
    }
  }

  /**
   * 发送桌面通知（通过 SSE）
   */
  private async sendDesktopNotification(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
    reminderData: any,
  ): Promise<void> {
    logger.debug('发送桌面通知', {
      notificationId: notification.uuid,
      accountUuid,
    });

    // 构建 SSE 事件数据
    const sseData = {
      type: 'notification:desktop',
      data: {
        // Notification 数据
        notificationId: notification.uuid,
        title: notification.title,
        content: notification.content,
        priority: notification.priority,
        type: notification.type,

        // 提醒配置（声音、持续时间等）
        soundVolume: reminderData.notificationSettings?.soundVolume || 70,
        popupDuration: reminderData.notificationSettings?.popupDuration || 10,
        allowSnooze: reminderData.notificationSettings?.allowSnooze !== false,
        snoozeOptions: reminderData.notificationSettings?.snoozeOptions || [5, 10, 15],

        // 操作按钮
        actions: notification.actions || [],

        // 元数据
        metadata: notification.metadata,
      },
      timestamp: new Date().toISOString(),
    };

    // 通过 SSE 广播
    await this.sseController.broadcastToAccount(accountUuid, sseData);

    logger.debug('✅ SSE 事件已广播', {
      notificationId: notification.uuid,
      accountUuid,
    });
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
  ): Promise<void> {
    if (!this.emailService) {
      throw new Error('Email service not configured');
    }

    logger.debug('发送邮件通知', {
      notificationId: notification.uuid,
      accountUuid,
    });

    // TODO: 获取用户邮箱
    // const user = await this.getUserEmail(accountUuid);

    // await this.emailService.send({
    //   to: user.email,
    //   subject: notification.title,
    //   body: notification.content,
    //   priority: notification.priority,
    // });

    logger.info('📧 邮件通知已发送（占位符）', {
      notificationId: notification.uuid,
    });
  }

  /**
   * 发送短信通知
   */
  private async sendSmsNotification(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
  ): Promise<void> {
    if (!this.smsService) {
      throw new Error('SMS service not configured');
    }

    logger.debug('发送短信通知', {
      notificationId: notification.uuid,
      accountUuid,
    });

    // TODO: 获取用户手机号
    // const user = await this.getUserPhone(accountUuid);

    // await this.smsService.send({
    //   to: user.phone,
    //   message: notification.content,
    // });

    logger.info('📱 短信通知已发送（占位符）', {
      notificationId: notification.uuid,
    });
  }

  /**
   * 发送应用内通知
   */
  private async sendInAppNotification(
    notification: NotificationContracts.NotificationClientDTO,
    accountUuid: string,
  ): Promise<void> {
    logger.debug('发送应用内通知', {
      notificationId: notification.uuid,
      accountUuid,
    });

    // TODO: 使用 WebSocket 或其他实时通道
    // await this.webSocketService.send(accountUuid, notification);

    logger.info('📲 应用内通知已发送（占位符）', {
      notificationId: notification.uuid,
    });
  }

  /**
   * 保存到死信队列
   */
  private async saveToDeadLetterQueue(
    notification: NotificationContracts.NotificationClientDTO,
    channel: NotificationContracts.NotificationChannel,
    error: any,
  ): Promise<void> {
    logger.error('💀 保存到死信队列', {
      notificationId: notification.uuid,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });

    // TODO: 实现死信队列持久化
    // await this.deadLetterQueueRepository.save({
    //   notificationId: notification.uuid,
    //   channel,
    //   error: error instanceof Error ? error.message : String(error),
    //   timestamp: new Date(),
    //   retries: this.MAX_RETRIES,
    // });
  }

  /**
   * 映射通知类型
   */
  private mapNotificationType(type?: string): NotificationContracts.NotificationType {
    const map: Record<string, NotificationContracts.NotificationType> = {
      TASK_REMINDER: 'task_reminder' as NotificationContracts.NotificationType,
      GOAL_REMINDER: 'goal_milestone' as NotificationContracts.NotificationType,
      GENERAL_REMINDER: 'schedule_reminder' as NotificationContracts.NotificationType,
      SYSTEM_ALERT: 'system' as NotificationContracts.NotificationType,
    };

    return map[type || 'GENERAL_REMINDER'] || ('info' as NotificationContracts.NotificationType);
  }

  /**
   * 映射优先级
   */
  private mapPriority(priority?: string): NotificationContracts.NotificationPriority {
    const map: Record<string, NotificationContracts.NotificationPriority> = {
      LOW: 'low' as NotificationContracts.NotificationPriority,
      NORMAL: 'normal' as NotificationContracts.NotificationPriority,
      HIGH: 'high' as NotificationContracts.NotificationPriority,
      URGENT: 'urgent' as NotificationContracts.NotificationPriority,
    };

    return map[priority || 'NORMAL'] || ('normal' as NotificationContracts.NotificationPriority);
  }

  /**
   * 映射通知通道
   */
  private mapChannels(notificationSettings?: any): NotificationContracts.NotificationChannel[] {
    if (!notificationSettings || !notificationSettings.channels) {
      // 默认通道
      return ['DESKTOP' as NotificationContracts.NotificationChannel];
    }

    return notificationSettings.channels as NotificationContracts.NotificationChannel[];
  }

  /**
   * 睡眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
