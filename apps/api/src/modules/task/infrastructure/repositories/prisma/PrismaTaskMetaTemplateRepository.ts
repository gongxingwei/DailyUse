/**
 * Prisma Task Meta Template Repository Implementation
 * Prisma任务元模板仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskMetaTemplateRepository } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskMetaTemplateDTO = TaskContracts.TaskMetaTemplateDTO;
type TaskMetaTemplateListResponse = TaskContracts.TaskMetaTemplateListResponse;

export class PrismaTaskMetaTemplateRepository implements ITaskMetaTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapTaskMetaTemplateToDTO(metaTemplate: any): TaskMetaTemplateDTO {
    return {
      uuid: metaTemplate.uuid,
      accountUuid: metaTemplate.accountUuid,
      name: metaTemplate.name,
      description: metaTemplate.description,
      appearance: {
        icon: metaTemplate.icon,
        color: metaTemplate.color,
        category: metaTemplate.category,
      },
      defaultTimeConfig: {
        timeType: metaTemplate.defaultTimeType as TaskContracts.TaskTimeType,
        scheduleMode: metaTemplate.defaultScheduleMode as TaskContracts.TaskScheduleMode,
        timezone: metaTemplate.defaultTimezone,
        commonTimeSettings: {
          startTime: metaTemplate.defaultStartTime,
          endTime: metaTemplate.defaultEndTime,
        },
      },
      defaultReminderConfig: {
        enabled: metaTemplate.defaultReminderEnabled,
        minutesBefore: metaTemplate.defaultReminderMinutesBefore,
        methods: metaTemplate.defaultReminderMethods
          ? JSON.parse(metaTemplate.defaultReminderMethods)
          : [],
      },
      defaultProperties: {
        importance: metaTemplate.defaultImportance as ImportanceLevel,
        urgency: metaTemplate.defaultUrgency as UrgencyLevel,
        tags: metaTemplate.defaultTags ? JSON.parse(metaTemplate.defaultTags) : [],
        location: metaTemplate.defaultLocation,
      },
      usage: {
        usageCount: metaTemplate.usageCount,
        lastUsedAt: metaTemplate.lastUsedAt?.toISOString(),
        isFavorite: metaTemplate.isFavorite,
      },
      lifecycle: {
        createdAt: metaTemplate.createdAt.toISOString(),
        updatedAt: metaTemplate.updatedAt.toISOString(),
        isActive: metaTemplate.isActive,
      },
    };
  }

  // ===== ITaskMetaTemplateRepository 接口实现 =====

  async findById(uuid: string): Promise<TaskMetaTemplateDTO | null> {
    const metaTemplate = await this.prisma.taskMetaTemplate.findUnique({
      where: { uuid },
    });

    return metaTemplate ? this.mapTaskMetaTemplateToDTO(metaTemplate) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'usageCount';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskMetaTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    const where: any = { accountUuid };
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      metaTemplates: metaTemplates.map((metaTemplate) =>
        this.mapTaskMetaTemplateToDTO(metaTemplate),
      ),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findByCategory(
    accountUuid: string,
    category: string,
    options?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskMetaTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const where: any = {
      accountUuid,
      category,
    };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      metaTemplates: metaTemplates.map((metaTemplate) =>
        this.mapTaskMetaTemplateToDTO(metaTemplate),
      ),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findFavorites(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskMetaTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where: {
          accountUuid,
          isFavorite: true,
          isActive: true,
        },
        orderBy: { usageCount: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({
        where: {
          accountUuid,
          isFavorite: true,
          isActive: true,
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      metaTemplates: metaTemplates.map((metaTemplate) =>
        this.mapTaskMetaTemplateToDTO(metaTemplate),
      ),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findPopular(
    accountUuid: string,
    options?: {
      minUsageCount?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskMetaTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const minUsageCount = options?.minUsageCount || 1;

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where: {
          accountUuid,
          usageCount: { gte: minUsageCount },
          isActive: true,
        },
        orderBy: { usageCount: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({
        where: {
          accountUuid,
          usageCount: { gte: minUsageCount },
          isActive: true,
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      metaTemplates: metaTemplates.map((metaTemplate) =>
        this.mapTaskMetaTemplateToDTO(metaTemplate),
      ),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async search(
    accountUuid: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskMetaTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [metaTemplates, total] = await Promise.all([
      this.prisma.taskMetaTemplate.findMany({
        where: {
          accountUuid,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { usageCount: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskMetaTemplate.count({
        where: {
          accountUuid,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      metaTemplates: metaTemplates.map((metaTemplate) =>
        this.mapTaskMetaTemplateToDTO(metaTemplate),
      ),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async save(taskMetaTemplate: TaskMetaTemplateDTO): Promise<void> {
    const data = {
      accountUuid: taskMetaTemplate.accountUuid,
      name: taskMetaTemplate.name,
      description: taskMetaTemplate.description,
      // 外观设置展开
      icon: taskMetaTemplate.appearance.icon,
      color: taskMetaTemplate.appearance.color,
      category: taskMetaTemplate.appearance.category,
      // 默认时间配置展开
      defaultTimeType: taskMetaTemplate.defaultTimeConfig.timeType,
      defaultScheduleMode: taskMetaTemplate.defaultTimeConfig.scheduleMode,
      defaultTimezone: taskMetaTemplate.defaultTimeConfig.timezone,
      defaultStartTime: taskMetaTemplate.defaultTimeConfig.commonTimeSettings?.startTime,
      defaultEndTime: taskMetaTemplate.defaultTimeConfig.commonTimeSettings?.endTime,
      // 默认提醒配置展开
      defaultReminderEnabled: taskMetaTemplate.defaultReminderConfig.enabled,
      defaultReminderMinutesBefore: taskMetaTemplate.defaultReminderConfig.minutesBefore,
      defaultReminderMethods: JSON.stringify(taskMetaTemplate.defaultReminderConfig.methods),
      // 默认属性展开
      defaultImportance: taskMetaTemplate.defaultProperties.importance,
      defaultUrgency: taskMetaTemplate.defaultProperties.urgency,
      defaultTags: JSON.stringify(taskMetaTemplate.defaultProperties.tags),
      defaultLocation: taskMetaTemplate.defaultProperties.location,
      // 使用统计展开
      usageCount: taskMetaTemplate.usage.usageCount,
      lastUsedAt: taskMetaTemplate.usage.lastUsedAt
        ? new Date(taskMetaTemplate.usage.lastUsedAt)
        : null,
      isFavorite: taskMetaTemplate.usage.isFavorite,
      // 生命周期展开
      isActive: taskMetaTemplate.lifecycle.isActive,
    };

    await this.prisma.taskMetaTemplate.upsert({
      where: { uuid: taskMetaTemplate.uuid },
      update: data,
      create: {
        uuid: taskMetaTemplate.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskMetaTemplate.delete({
      where: { uuid },
    });
  }

  async count(accountUuid: string, isActive?: boolean): Promise<number> {
    const where: any = { accountUuid };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.prisma.taskMetaTemplate.count({ where });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.taskMetaTemplate.count({
      where: { uuid },
    });

    return count > 0;
  }
}
