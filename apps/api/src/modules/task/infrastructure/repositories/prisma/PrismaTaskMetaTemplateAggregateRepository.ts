/**
 * Prisma Task Meta Template Aggregate Repository Implementation
 * 使用领域实体的 fromPersistence / toPersistence 方法
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskMetaTemplateAggregateRepository } from '@dailyuse/domain-server';
import { TaskMetaTemplate } from '@dailyuse/domain-server';

export class PrismaTaskMetaTemplateAggregateRepository
  implements ITaskMetaTemplateAggregateRepository
{
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 TaskMetaTemplate 实体
   */
  private mapToEntity(metaTemplate: any): TaskMetaTemplate {
    // 使用实体的 fromPersistence 方法创建实体
    return TaskMetaTemplate.fromPersistence(metaTemplate);
  }

  // ===== ITaskMetaTemplateAggregateRepository 接口实现 =====

  async saveMetaTemplate(
    accountUuid: string,
    metaTemplate: TaskMetaTemplate,
  ): Promise<TaskMetaTemplate> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const persistence = metaTemplate.toPersistence(accountUuid);

    await this.prisma.taskMetaTemplate.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        name: persistence.name,
        description: persistence.description,

        // 外观 - 扁平化
        icon: persistence.icon,
        color: persistence.color,
        category: persistence.category,

        // 默认时间配置 - 扁平化
        defaultTimeType: persistence.defaultTimeType,
        defaultScheduleMode: persistence.defaultScheduleMode,
        defaultTimezone: persistence.defaultTimezone,
        defaultStartTime: persistence.defaultStartTime,
        defaultEndTime: persistence.defaultEndTime,

        // 默认提醒配置 - 扁平化
        defaultReminderEnabled: persistence.defaultReminderEnabled,
        defaultReminderMinutesBefore: persistence.defaultReminderMinutesBefore,
        defaultReminderMethods: persistence.defaultReminderMethods,

        // 默认属性 - 扁平化
        defaultImportance: persistence.defaultImportance,
        defaultUrgency: persistence.defaultUrgency,
        defaultTags: persistence.defaultTags,
        defaultLocation: persistence.defaultLocation,

        // 使用统计 - 扁平化
        usageCount: persistence.usageCount,
        lastUsedAt: persistence.lastUsedAt,
        isFavorite: persistence.isFavorite,

        // 生命周期
        isActive: persistence.isActive,
        createdAt: persistence.createdAt,
        updatedAt: persistence.updatedAt,
      },
      update: {
        name: persistence.name,
        description: persistence.description,

        icon: persistence.icon,
        color: persistence.color,
        category: persistence.category,

        defaultTimeType: persistence.defaultTimeType,
        defaultScheduleMode: persistence.defaultScheduleMode,
        defaultTimezone: persistence.defaultTimezone,
        defaultStartTime: persistence.defaultStartTime,
        defaultEndTime: persistence.defaultEndTime,

        defaultReminderEnabled: persistence.defaultReminderEnabled,
        defaultReminderMinutesBefore: persistence.defaultReminderMinutesBefore,
        defaultReminderMethods: persistence.defaultReminderMethods,

        defaultImportance: persistence.defaultImportance,
        defaultUrgency: persistence.defaultUrgency,
        defaultTags: persistence.defaultTags,
        defaultLocation: persistence.defaultLocation,

        usageCount: persistence.usageCount,
        lastUsedAt: persistence.lastUsedAt,
        isFavorite: persistence.isFavorite,

        isActive: persistence.isActive,
        updatedAt: persistence.updatedAt,
      },
    });

    return metaTemplate;
  }

  async getMetaTemplateByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<TaskMetaTemplate | null> {
    const metaTemplate = await this.prisma.taskMetaTemplate.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return metaTemplate ? this.mapToEntity(metaTemplate) : null;
  }

  async getAllMetaTemplates(
    accountUuid: string,
    options?: {
      isActive?: boolean;
      isFavorite?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'usageCount';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ metaTemplates: TaskMetaTemplate[]; total: number }> {
    const where: any = { accountUuid };
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.isFavorite !== undefined) {
      where.isFavorite = options.isFavorite;
    }
    if (options?.category) {
      where.category = options.category;
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({ where }),
    ]);

    return {
      metaTemplates: metaTemplates.map((mt) => this.mapToEntity(mt)),
      total,
    };
  }

  async searchMetaTemplates(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ metaTemplates: TaskMetaTemplate[]; total: number }> {
    const where = {
      accountUuid,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({ where }),
    ]);

    return {
      metaTemplates: metaTemplates.map((mt) => this.mapToEntity(mt)),
      total,
    };
  }

  async deleteMetaTemplate(accountUuid: string, uuid: string): Promise<boolean> {
    await this.prisma.taskMetaTemplate.delete({
      where: { uuid },
    });

    return true;
  }

  async countMetaTemplates(
    accountUuid: string,
    isActive?: boolean,
  ): Promise<number> {
    const where: any = { accountUuid };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.prisma.taskMetaTemplate.count({ where });
  }

  async metaTemplateExists(accountUuid: string, uuid: string): Promise<boolean> {
    const count = await this.prisma.taskMetaTemplate.count({
      where: {
        uuid,
        accountUuid,
      },
    });

    return count > 0;
  }
}
