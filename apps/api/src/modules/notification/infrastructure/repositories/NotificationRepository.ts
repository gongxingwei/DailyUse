import type {
  INotificationRepository,
  NotificationQueryOptions,
} from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { PrismaClient } from '@prisma/client';
import { NotificationStatus } from '@dailyuse/contracts';

/**
 * Notification Repository 实现
 */
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<Notification> {
    const prismaData = NotificationMapper.toPrisma(notification);
    const deliveryReceipts = notification.deliveryReceipts;

    // 使用事务保存通知和发送回执
    const result = await this.prisma.$transaction(async (tx) => {
      // Upsert 通知
      const savedNotification = await tx.notification.upsert({
        where: { uuid: notification.uuid },
        update: prismaData,
        create: prismaData,
        include: {
          deliveryReceipts: true,
        },
      });

      // 保存发送回执
      for (const receipt of deliveryReceipts) {
        const receiptData = NotificationMapper.deliveryReceiptToPrisma(receipt);
        await tx.deliveryReceipt.upsert({
          where: { uuid: receipt.uuid },
          update: receiptData,
          create: receiptData,
        });
      }

      // 重新查询包含回执的通知
      return tx.notification.findUnique({
        where: { uuid: notification.uuid },
        include: {
          deliveryReceipts: true,
        },
      });
    });

    return NotificationMapper.toDomain(result!);
  }

  async findByUuid(uuid: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { uuid },
      include: {
        deliveryReceipts: true,
      },
    });

    return notification ? NotificationMapper.toDomain(notification) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: NotificationQueryOptions,
  ): Promise<Notification[]> {
    const where: any = { accountUuid };

    if (options?.status) {
      where.status = { in: options.status };
    }

    if (options?.type) {
      where.type = { in: options.type };
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      include: {
        deliveryReceipts: true,
      },
      orderBy: {
        [options?.sortBy || 'createdAt']: options?.sortOrder || 'desc',
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return notifications.map((n) => NotificationMapper.toDomain(n));
  }

  async query(options: NotificationQueryOptions): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const where: any = {};

    if (options.accountUuid) {
      where.accountUuid = options.accountUuid;
    }

    if (options.status) {
      where.status = { in: options.status };
    }

    if (options.type) {
      where.type = { in: options.type };
    }

    if (options.scheduledBefore) {
      where.scheduledAt = { ...where.scheduledAt, lte: options.scheduledBefore };
    }

    if (options.scheduledAfter) {
      where.scheduledAt = { ...where.scheduledAt, gte: options.scheduledAfter };
    }

    if (options.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: options.createdBefore };
    }

    if (options.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: options.createdAfter };
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          deliveryReceipts: true,
        },
        orderBy: {
          [options.sortBy || 'createdAt']: options.sortOrder || 'desc',
        },
        take: options.limit,
        skip: options.offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n) => NotificationMapper.toDomain(n)),
      total,
    };
  }

  async findPendingNotifications(before?: Date): Promise<Notification[]> {
    const where: any = {
      status: 'pending',
    };

    if (before) {
      where.scheduledAt = { lte: before };
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      include: {
        deliveryReceipts: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return notifications.map((n) => NotificationMapper.toDomain(n));
  }

  async findExpiredNotifications(): Promise<Notification[]> {
    const now = new Date();

    const notifications = await this.prisma.notification.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          lte: now,
        },
      },
      include: {
        deliveryReceipts: true,
      },
    });

    return notifications.map((n) => NotificationMapper.toDomain(n));
  }

  async countUnread(accountUuid: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        accountUuid,
        status: { in: ['sent', 'pending'] },
        readAt: null,
      },
    });
  }

  async batchUpdateStatus(
    uuids: string[],
    status: NotificationStatus,
    timestamp?: Date,
  ): Promise<void> {
    const updateData: any = { status };

    if (status === NotificationStatus.READ) {
      updateData.readAt = timestamp || new Date();
    } else if (status === NotificationStatus.DISMISSED) {
      updateData.dismissedAt = timestamp || new Date();
    } else if (status === NotificationStatus.SENT) {
      updateData.sentAt = timestamp || new Date();
    }

    await this.prisma.notification.updateMany({
      where: {
        uuid: { in: uuids },
      },
      data: updateData,
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { uuid },
    });
  }

  async batchDelete(uuids: string[]): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        uuid: { in: uuids },
      },
    });
  }

  async archiveOldNotifications(accountUuid: string, olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.notification.deleteMany({
      where: {
        accountUuid,
        status: { in: ['read', 'dismissed'] },
        createdAt: {
          lte: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
