import { Notification } from '../../domain/aggregates/Notification';
import { NotificationPreference } from '../../domain/aggregates/NotificationPreference';
import { DeliveryReceipt } from '../../domain/entities/DeliveryReceipt';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';
import { DeliveryChannels } from '../../domain/value-objects/DeliveryChannels';
import { ScheduleTime } from '../../domain/value-objects/ScheduleTime';
import { NotificationMetadata } from '../../domain/value-objects/NotificationMetadata';
import { NotificationAction } from '../../domain/value-objects/NotificationAction';
import type { NotificationContracts } from '@dailyuse/contracts';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  DeliveryStatus,
} from '@dailyuse/contracts';

/**
 * Notification Mapper
 *
 * 职责：Domain Model ↔ Prisma Model 转换
 */
export class NotificationMapper {
  /**
   * Prisma → Domain
   */
  static toDomain(prismaNotification: any): Notification {
    // 解析 JSON 字段
    const channels = JSON.parse(prismaNotification.channels || '[]');
    const actions = prismaNotification.actions
      ? JSON.parse(prismaNotification.actions).map((a: any) => NotificationAction.create(a))
      : undefined;
    const metadataObj = prismaNotification.metadata
      ? JSON.parse(prismaNotification.metadata)
      : undefined;

    // 创建值对象
    const content = NotificationContent.create({
      title: prismaNotification.title,
      content: prismaNotification.content,
      icon: prismaNotification.icon,
      image: prismaNotification.image,
    });

    const deliveryChannels = DeliveryChannels.create({
      channels,
      priority: prismaNotification.priority as NotificationPriority,
    });

    const scheduleTime = ScheduleTime.create({
      scheduledAt: prismaNotification.scheduledAt || undefined,
      expiresAt: prismaNotification.expiresAt || undefined,
    });

    const metadata = metadataObj ? NotificationMetadata.create(metadataObj) : undefined;

    // 创建聚合根
    const notification = Notification.fromPersistence({
      uuid: prismaNotification.uuid,
      accountUuid: prismaNotification.accountUuid,
      content,
      type: prismaNotification.type as NotificationType,
      deliveryChannels,
      scheduleTime,
      metadata,
      templateUuid: prismaNotification.templateUuid || undefined,
      actions,
      status: prismaNotification.status as NotificationStatus,
      sentAt: prismaNotification.sentAt || undefined,
      readAt: prismaNotification.readAt || undefined,
      dismissedAt: prismaNotification.dismissedAt || undefined,
      version: prismaNotification.version,
      createdAt: prismaNotification.createdAt,
      updatedAt: prismaNotification.updatedAt,
      deliveryReceipts: prismaNotification.deliveryReceipts?.map((r: any) =>
        this.deliveryReceiptToDomain(r),
      ),
    });

    return notification;
  }

  /**
   * Domain → Prisma
   */
  static toPrisma(notification: Notification): any {
    const plainObj = notification.toPlainObject();

    return {
      uuid: plainObj.uuid,
      accountUuid: plainObj.accountUuid,
      templateUuid: plainObj.templateUuid,
      title: plainObj.content.title,
      content: plainObj.content.content,
      icon: plainObj.content.icon,
      image: plainObj.content.image,
      type: plainObj.type,
      priority: plainObj.deliveryChannels.priority,
      status: plainObj.status,
      channels: JSON.stringify(plainObj.deliveryChannels.channels),
      actions: plainObj.actions ? JSON.stringify(plainObj.actions) : undefined,
      scheduledAt: plainObj.scheduleTime.scheduledAt,
      sentAt: plainObj.sentAt,
      readAt: plainObj.readAt,
      dismissedAt: plainObj.dismissedAt,
      expiresAt: plainObj.scheduleTime.expiresAt,
      metadata: plainObj.metadata ? JSON.stringify(plainObj.metadata) : undefined,
      version: plainObj.version,
      createdAt: plainObj.createdAt,
      updatedAt: plainObj.updatedAt,
    };
  }

  /**
   * DeliveryReceipt: Prisma → Domain
   */
  static deliveryReceiptToDomain(prismaReceipt: any): DeliveryReceipt {
    const metadata = prismaReceipt.metadata ? JSON.parse(prismaReceipt.metadata) : undefined;

    return DeliveryReceipt.fromPersistence({
      uuid: prismaReceipt.uuid,
      notificationUuid: prismaReceipt.notificationUuid,
      channel: prismaReceipt.channel as NotificationChannel,
      status: prismaReceipt.status as DeliveryStatus,
      sentAt: prismaReceipt.sentAt || undefined,
      deliveredAt: prismaReceipt.deliveredAt || undefined,
      failureReason: prismaReceipt.failureReason || undefined,
      retryCount: prismaReceipt.retryCount,
      metadata,
    });
  }

  /**
   * DeliveryReceipt: Domain → Prisma
   */
  static deliveryReceiptToPrisma(receipt: DeliveryReceipt): any {
    const plainObj = receipt.toPlainObject();

    return {
      uuid: plainObj.uuid,
      notificationUuid: plainObj.notificationUuid,
      channel: plainObj.channel,
      status: plainObj.status,
      sentAt: plainObj.sentAt,
      deliveredAt: plainObj.deliveredAt,
      failureReason: plainObj.failureReason,
      retryCount: plainObj.retryCount,
      metadata: plainObj.metadata ? JSON.stringify(plainObj.metadata) : undefined,
    };
  }

  /**
   * Notification → ClientDTO (带计算属性)
   */
  static toClientDTO(notification: Notification): NotificationContracts.NotificationClientDTO {
    const plainObj = notification.toPlainObject();
    const deliveredCount = notification.getDeliveredChannelCount();
    const totalCount = notification.deliveryChannels.channelCount;

    return {
      uuid: plainObj.uuid,
      accountUuid: plainObj.accountUuid,
      templateUuid: plainObj.templateUuid,
      title: plainObj.content.title,
      content: plainObj.content.content,
      type: plainObj.type,
      priority: plainObj.deliveryChannels.priority,
      status: plainObj.status,
      channels: plainObj.deliveryChannels.channels,
      icon: plainObj.content.icon,
      image: plainObj.content.image,
      actions: plainObj.actions,
      scheduledAt: plainObj.scheduleTime.scheduledAt?.getTime(),
      sentAt: plainObj.sentAt?.getTime(),
      readAt: plainObj.readAt?.getTime(),
      dismissedAt: plainObj.dismissedAt?.getTime(),
      expiresAt: plainObj.scheduleTime.expiresAt?.getTime(),
      metadata: plainObj.metadata,
      lifecycle: {
        createdAt: plainObj.createdAt.getTime(),
        updatedAt: plainObj.updatedAt.getTime(),
      },
      version: plainObj.version,
      deliveryReceipts: plainObj.deliveryReceipts.map((r) => ({
        uuid: r.uuid,
        notificationUuid: r.notificationUuid,
        channel: r.channel,
        status: r.status,
        sentAt: r.sentAt?.getTime(),
        deliveredAt: r.deliveredAt?.getTime(),
        failureReason: r.failureReason,
        retryCount: r.retryCount,
        metadata: r.metadata,
      })),
      // 计算属性
      isRead: notification.status === NotificationStatus.READ,
      isDismissed: notification.status === NotificationStatus.DISMISSED,
      isExpired: notification.scheduleTime.isExpired(),
      isPending: notification.status === NotificationStatus.PENDING,
      isSent: notification.status === NotificationStatus.SENT,
      isFailed: notification.status === NotificationStatus.FAILED,
      remainingTime: notification.scheduleTime.getRemainingTime(),
      timeSinceSent: notification.sentAt ? Date.now() - notification.sentAt.getTime() : undefined,
      deliveryStatus: {
        totalChannels: totalCount,
        sentChannels: deliveredCount,
        deliveredChannels: deliveredCount,
        failedChannels: 0, // TODO: 计算失败渠道数
        successRate: notification.getDeliverySuccessRate(),
      },
    };
  }

  /**
   * NotificationPreference → DTO
   */
  static preferenceToDTO(
    preference: NotificationPreference,
  ): NotificationContracts.NotificationPreferenceDTO {
    const plainObj = preference.toPlainObject();

    return {
      uuid: plainObj.uuid,
      accountUuid: plainObj.accountUuid,
      enabledTypes: plainObj.enabledTypes,
      channelPreferences: plainObj.channelPreferences,
      maxNotifications: plainObj.maxNotifications,
      autoArchiveDays: plainObj.autoArchiveDays,
      lifecycle: {
        createdAt: plainObj.createdAt.getTime(),
        updatedAt: plainObj.updatedAt.getTime(),
      },
    };
  }
}
