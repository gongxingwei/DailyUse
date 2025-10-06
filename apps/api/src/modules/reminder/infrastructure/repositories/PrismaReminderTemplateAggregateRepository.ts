import { PrismaClient } from '@prisma/client';
import type { IReminderTemplateAggregateRepository } from '@dailyuse/domain-server';
import { ReminderTemplate, ReminderInstance } from '@dailyuse/domain-server';

/**
 * ReminderTemplate 聚合根 Prisma 仓储实现
 * 负责 ReminderTemplate 及其所有子实体（ReminderInstance）的持久化
 */
export class PrismaReminderTemplateAggregateRepository
  implements IReminderTemplateAggregateRepository
{
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 ReminderTemplate 聚合根实体
   */
  private mapToEntity(data: any): ReminderTemplate {
    const templateEntity = ReminderTemplate.fromPersistence(data);

    // 加载子实体（ReminderInstance）
    if (data.instances) {
      data.instances.forEach((instanceData: any) => {
        const instanceEntity = ReminderInstance.fromPersistence(instanceData);
        // ReminderTemplate 通过内部方法添加实例
        (templateEntity as any).instances.push(instanceEntity);
      });
    }

    return templateEntity;
  }

  // ===== ReminderTemplate 聚合根 CRUD =====

  async saveTemplate(accountUuid: string, template: ReminderTemplate): Promise<ReminderTemplate> {
    const persistence = template.toPersistence(accountUuid);

    // 解析 timeConfig JSON
    const timeConfig = JSON.parse(persistence.timeConfig);
    const notificationSettings = persistence.notificationSettings
      ? JSON.parse(persistence.notificationSettings)
      : {};
    const snoozeConfig = persistence.snoozeConfig ? JSON.parse(persistence.snoozeConfig) : {};
    const lifecycle = JSON.parse(persistence.lifecycle);
    const analytics = JSON.parse(persistence.analytics);

    // 使用事务保存 Template 及其所有 Instance
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert ReminderTemplate 主实体
      await tx.reminderTemplate.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid,
          groupUuid: persistence.groupUuid,
          name: persistence.name,
          description: persistence.description,
          message: persistence.message,
          enabled: Boolean(persistence.enabled),
          selfEnabled: Boolean(persistence.selfEnabled),
          importanceLevel: persistence.importanceLevel,
          priority: persistence.priority,
          category: persistence.category,
          tags: JSON.stringify(persistence.tags),
          // 扁平化 timeConfig
          timeConfigType: timeConfig.type || 'daily',
          timeConfigTimes: JSON.stringify(timeConfig.times || []),
          timeConfigWeekdays: JSON.stringify(timeConfig.weekdays || []),
          timeConfigMonthDays: JSON.stringify(timeConfig.monthDays || []),
          timeConfigDuration: timeConfig.duration,
          timeConfigSchedule: JSON.stringify(timeConfig.schedule || {}),
          // 扁平化 notificationSettings
          notificationSound: notificationSettings.sound !== false,
          notificationVibration: notificationSettings.vibration !== false,
          notificationPopup: notificationSettings.popup !== false,
          notificationSoundFile: notificationSettings.soundFile,
          notificationCustomIcon: notificationSettings.customIcon,
          // 扁平化 snoozeConfig
          snoozeEnabled: snoozeConfig.enabled !== false,
          snoozeDefaultMinutes: snoozeConfig.defaultMinutes || 10,
          snoozeMaxCount: snoozeConfig.maxCount || 5,
          snoozePresetOptions: JSON.stringify(snoozeConfig.presetOptions || []),
          // 扁平化 lifecycle
          lastTriggered: lifecycle.lastTriggered ? new Date(lifecycle.lastTriggered) : null,
          triggerCount: lifecycle.triggerCount || 0,
          // 扁平化 analytics
          totalTriggers: analytics.totalTriggers || 0,
          acknowledgedCount: analytics.acknowledgedCount || 0,
          dismissedCount: analytics.dismissedCount || 0,
          snoozeCountTotal: analytics.snoozeCount || 0,
          avgResponseTime: analytics.avgResponseTime,
          version: persistence.version,
        },
        update: {
          groupUuid: persistence.groupUuid,
          name: persistence.name,
          description: persistence.description,
          message: persistence.message,
          enabled: Boolean(persistence.enabled),
          selfEnabled: Boolean(persistence.selfEnabled),
          importanceLevel: persistence.importanceLevel,
          priority: persistence.priority,
          category: persistence.category,
          tags: JSON.stringify(persistence.tags),
          timeConfigType: timeConfig.type || 'daily',
          timeConfigTimes: JSON.stringify(timeConfig.times || []),
          timeConfigWeekdays: JSON.stringify(timeConfig.weekdays || []),
          timeConfigMonthDays: JSON.stringify(timeConfig.monthDays || []),
          timeConfigDuration: timeConfig.duration,
          timeConfigSchedule: JSON.stringify(timeConfig.schedule || {}),
          notificationSound: notificationSettings.sound !== false,
          notificationVibration: notificationSettings.vibration !== false,
          notificationPopup: notificationSettings.popup !== false,
          notificationSoundFile: notificationSettings.soundFile,
          notificationCustomIcon: notificationSettings.customIcon,
          snoozeEnabled: snoozeConfig.enabled !== false,
          snoozeDefaultMinutes: snoozeConfig.defaultMinutes || 10,
          snoozeMaxCount: snoozeConfig.maxCount || 5,
          snoozePresetOptions: JSON.stringify(snoozeConfig.presetOptions || []),
          lastTriggered: lifecycle.lastTriggered ? new Date(lifecycle.lastTriggered) : null,
          triggerCount: lifecycle.triggerCount || 0,
          totalTriggers: analytics.totalTriggers || 0,
          acknowledgedCount: analytics.acknowledgedCount || 0,
          dismissedCount: analytics.dismissedCount || 0,
          snoozeCountTotal: analytics.snoozeCount || 0,
          avgResponseTime: analytics.avgResponseTime,
          version: persistence.version,
        },
      });

      // 2. Upsert ReminderInstances
      for (const instance of template.instances) {
        const instancePersistence = (instance as ReminderInstance).toPersistence(accountUuid);
        await tx.reminderInstance.upsert({
          where: { uuid: instancePersistence.uuid },
          create: instancePersistence,
          update: instancePersistence,
        });
      }
    });

    return template;
  }

  async getTemplateByUuid(accountUuid: string, uuid: string): Promise<ReminderTemplate | null> {
    const data = await this.prisma.reminderTemplate.findFirst({
      where: { uuid, accountUuid },
      include: {
        instances: true,
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async getAllTemplates(
    accountUuid: string,
    params?: {
      groupUuid?: string;
      isActive?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'usageCount' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ templates: ReminderTemplate[]; total: number }> {
    const where: any = { accountUuid };
    if (params?.groupUuid) where.groupUuid = params.groupUuid;
    if (params?.isActive !== undefined) where.enabled = params.isActive;
    if (params?.category) where.category = params.category;

    const [data, total] = await Promise.all([
      this.prisma.reminderTemplate.findMany({
        where,
        include: {
          instances: true,
        },
        skip: params?.offset || 0,
        take: params?.limit || 50,
        orderBy: {
          [params?.sortBy === 'usageCount' ? 'triggerCount' : params?.sortBy || 'createdAt']:
            params?.sortOrder || 'desc',
        },
      }),
      this.prisma.reminderTemplate.count({ where }),
    ]);

    return {
      templates: data.map((item) => this.mapToEntity(item)),
      total,
    };
  }

  async deleteTemplate(accountUuid: string, uuid: string): Promise<boolean> {
    try {
      // 级联删除：先删除所有实例，再删除模板
      await this.prisma.$transaction(async (tx) => {
        await tx.reminderInstance.deleteMany({
          where: { templateUuid: uuid },
        });
        await tx.reminderTemplate.delete({
          where: { uuid, accountUuid },
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async countTemplates(accountUuid: string, isActive?: boolean): Promise<number> {
    const where: any = { accountUuid };
    if (isActive !== undefined) where.enabled = isActive;

    return this.prisma.reminderTemplate.count({ where });
  }

  async templateExists(accountUuid: string, uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplate.count({
      where: { uuid, accountUuid },
    });
    return count > 0;
  }
}
