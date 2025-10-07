import type { INotificationRepository } from '../repositories/INotificationRepository';
import type { INotificationPreferenceRepository } from '../repositories/INotificationPreferenceRepository';
import { Notification } from '../aggregates/Notification';
import { NotificationContent } from '../value-objects/NotificationContent';
import { DeliveryChannels } from '../value-objects/DeliveryChannels';
import { ScheduleTime } from '../value-objects/ScheduleTime';
import { NotificationMetadata } from '../value-objects/NotificationMetadata';
import { NotificationAction } from '../value-objects/NotificationAction';
import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';

// EventEmitter 类型（可选依赖，用于发送领域事件）
type EventEmitter = {
  emit(event: string, payload: any): boolean;
};

/**
 * Notification 领域服务
 *
 * 职责：
 * - 处理通知创建业务逻辑
 * - 协调通知发送流程
 * - 验证业务规则
 * - 发送领域事件
 */
export class NotificationDomainService {
  public eventEmitter?: EventEmitter;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  /**
   * 创建并发送通知
   */
  async createAndSendNotification(params: {
    uuid: string;
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    icon?: string;
    image?: string;
    actions?: NotificationAction[];
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: NotificationMetadata;
    templateUuid?: string;
  }): Promise<Notification> {
    // 1. 获取用户偏好设置
    const preference = await this.preferenceRepository.getOrCreateDefault(params.accountUuid);

    // 2. 验证通知类型是否被用户启用
    if (!preference.shouldReceiveType(params.type)) {
      throw new Error(`User has disabled notifications of type ${params.type}`);
    }

    // 3. 根据用户偏好过滤渠道
    const allowedChannels = params.channels.filter((channel) =>
      preference.isTypeAllowedOnChannel(channel, params.type),
    );

    if (allowedChannels.length === 0) {
      throw new Error(`No allowed channels for notification type ${params.type}`);
    }

    // 4. 创建值对象
    const notificationContent = NotificationContent.create({
      title: params.title,
      content: params.content,
      icon: params.icon,
      image: params.image,
    });

    const deliveryChannels = DeliveryChannels.create({
      channels: allowedChannels,
      priority: params.priority,
    });

    const scheduleTime = ScheduleTime.create({
      scheduledAt: params.scheduledAt,
      expiresAt: params.expiresAt,
    });

    // 5. 创建通知聚合
    const notification = Notification.create({
      uuid: params.uuid,
      accountUuid: params.accountUuid,
      content: notificationContent,
      type: params.type,
      deliveryChannels,
      scheduleTime,
      metadata: params.metadata,
      templateUuid: params.templateUuid,
      actions: params.actions,
    });

    // 6. 持久化
    const savedNotification = await this.notificationRepository.save(notification);

    // 7. 发送领域事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('NotificationCreated', {
        eventType: 'NotificationCreated',
        aggregateId: savedNotification.uuid,
        occurredOn: new Date(),
        payload: {
          notificationId: savedNotification.uuid,
          accountUuid: savedNotification.accountUuid,
          type: savedNotification.type,
          priority: savedNotification.deliveryChannels.priority,
          channels: savedNotification.deliveryChannels.channels,
          scheduledAt: savedNotification.scheduleTime.scheduledAt,
        },
      });
    }

    return savedNotification;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationUuid: string, readAt: Date = new Date()): Promise<Notification> {
    const notification = await this.notificationRepository.findByUuid(notificationUuid);
    if (!notification) {
      throw new Error(`Notification ${notificationUuid} not found`);
    }

    notification.markAsRead(readAt);
    const updated = await this.notificationRepository.save(notification);

    // 发送已读事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('NotificationRead', {
        eventType: 'NotificationRead',
        aggregateId: updated.uuid,
        occurredOn: new Date(),
        payload: {
          notificationId: updated.uuid,
          accountUuid: updated.accountUuid,
          readAt,
        },
      });
    }

    return updated;
  }

  /**
   * 标记通知为已忽略
   */
  async markAsDismissed(
    notificationUuid: string,
    dismissedAt: Date = new Date(),
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findByUuid(notificationUuid);
    if (!notification) {
      throw new Error(`Notification ${notificationUuid} not found`);
    }

    notification.markAsDismissed(dismissedAt);
    const updated = await this.notificationRepository.save(notification);

    // 发送忽略事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('NotificationDismissed', {
        eventType: 'NotificationDismissed',
        aggregateId: updated.uuid,
        occurredOn: new Date(),
        payload: {
          notificationId: updated.uuid,
          accountUuid: updated.accountUuid,
          dismissedAt,
        },
      });
    }

    return updated;
  }

  /**
   * 批量标记已读
   */
  async batchMarkAsRead(notificationUuids: string[], readAt: Date = new Date()): Promise<void> {
    await this.notificationRepository.batchUpdateStatus(notificationUuids, 'read' as any, readAt);
  }

  /**
   * 批量标记已忽略
   */
  async batchMarkAsDismissed(
    notificationUuids: string[],
    dismissedAt: Date = new Date(),
  ): Promise<void> {
    await this.notificationRepository.batchUpdateStatus(
      notificationUuids,
      'dismissed' as any,
      dismissedAt,
    );
  }

  /**
   * 处理过期通知
   */
  async processExpiredNotifications(): Promise<number> {
    const expiredNotifications = await this.notificationRepository.findExpiredNotifications();

    for (const notification of expiredNotifications) {
      notification.markAsExpired();
      await this.notificationRepository.save(notification);

      if (this.eventEmitter) {
        this.eventEmitter.emit('NotificationExpired', {
          eventType: 'NotificationExpired',
          aggregateId: notification.uuid,
          occurredOn: new Date(),
          payload: {
            notificationId: notification.uuid,
            accountUuid: notification.accountUuid,
            expiresAt: notification.scheduleTime.expiresAt,
          },
        });
      }
    }

    return expiredNotifications.length;
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(accountUuid: string): Promise<number> {
    return this.notificationRepository.countUnread(accountUuid);
  }
}
