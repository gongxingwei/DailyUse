import type { INotificationPreferenceRepository } from '../../domain/repositories/INotificationPreferenceRepository';
import { NotificationPreference } from '../../domain/aggregates/NotificationPreference';
import { PrismaClient } from '@prisma/client';
import { NotificationType, NotificationChannel } from '@dailyuse/contracts';
import { v4 as uuidv4 } from 'uuid';

/**
 * NotificationPreference Repository 实现
 */
export class NotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<NotificationPreference> {
    const plainObj = preference.toPlainObject();

    const prismaData = {
      uuid: plainObj.uuid,
      accountUuid: plainObj.accountUuid,
      enabledTypes: JSON.stringify(plainObj.enabledTypes),
      channelPreferences: JSON.stringify(plainObj.channelPreferences),
      maxNotifications: plainObj.maxNotifications,
      autoArchiveDays: plainObj.autoArchiveDays,
      createdAt: plainObj.createdAt,
      updatedAt: plainObj.updatedAt,
    };

    const saved = await this.prisma.notificationPreference.upsert({
      where: { uuid: preference.uuid },
      update: prismaData,
      create: prismaData,
    });

    return this.toDomain(saved);
  }

  async findByUuid(uuid: string): Promise<NotificationPreference | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { uuid },
    });

    return preference ? this.toDomain(preference) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { accountUuid },
    });

    return preference ? this.toDomain(preference) : null;
  }

  async getOrCreateDefault(accountUuid: string): Promise<NotificationPreference> {
    let preference = await this.findByAccountUuid(accountUuid);

    if (!preference) {
      preference = NotificationPreference.createDefault({
        uuid: uuidv4(),
        accountUuid,
      });

      await this.save(preference);
    }

    return preference;
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({
      where: { accountUuid },
    });

    return count > 0;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notificationPreference.delete({
      where: { uuid },
    });
  }

  /**
   * Prisma → Domain
   */
  private toDomain(prismaPreference: any): NotificationPreference {
    const enabledTypes = JSON.parse(prismaPreference.enabledTypes || '[]');
    const channelPreferences = JSON.parse(prismaPreference.channelPreferences || '{}');

    // 将普通对象转换为 Map
    const channelPrefsMap = new Map(Object.entries(channelPreferences));

    return NotificationPreference.fromPersistence({
      uuid: prismaPreference.uuid,
      accountUuid: prismaPreference.accountUuid,
      enabledTypes,
      channelPreferences: channelPrefsMap,
      maxNotifications: prismaPreference.maxNotifications,
      autoArchiveDays: prismaPreference.autoArchiveDays,
      createdAt: prismaPreference.createdAt,
      updatedAt: prismaPreference.updatedAt,
    });
  }
}
