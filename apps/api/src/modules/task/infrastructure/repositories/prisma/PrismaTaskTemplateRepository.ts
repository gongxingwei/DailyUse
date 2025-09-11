/**
 * Prisma Task Template Repository Implementation
 * Prisma任务模板仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { ITaskTemplateRepository } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskTemplateDTO = TaskContracts.TaskTemplateDTO;
type TaskTemplateListResponse = TaskContracts.TaskTemplateListResponse;

export class PrismaTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapTaskTemplateToDTO(template: any): TaskTemplateDTO {
    return {
      uuid: template.uuid,
      accountUuid: template.accountUuid,
      title: template.title,
      description: template.description,
      timeConfig: {
        time: {
          timeType: template.timeType as TaskContracts.TaskTimeType,
          startTime: template.startTime,
          endTime: template.endTime,
        },
        date: {
          startDate: template.startDate.toISOString(),
          endDate: template.endDate?.toISOString(),
        },
        schedule: {
          mode: template.scheduleMode as TaskContracts.TaskScheduleMode,
          intervalDays: template.intervalDays,
          weekdays: template.weekdays ? JSON.parse(template.weekdays) : [],
          monthDays: template.monthDays ? JSON.parse(template.monthDays) : [],
        },
        timezone: template.timezone,
      },
      reminderConfig: {
        enabled: template.reminderEnabled,
        minutesBefore: template.reminderMinutesBefore,
        methods: template.reminderMethods ? JSON.parse(template.reminderMethods) : [],
      },
      properties: {
        importance: template.importance as ImportanceLevel,
        urgency: template.urgency as UrgencyLevel,
        location: template.location,
        tags: template.tags ? JSON.parse(template.tags) : [],
      },
      lifecycle: {
        status: template.status as 'draft' | 'active' | 'paused' | 'completed' | 'archived',
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
      stats: {
        totalInstances: template.totalInstances,
        completedInstances: template.completedInstances,
        completionRate: template.completionRate,
        lastInstanceDate: template.lastInstanceDate?.toISOString(),
      },
      goalLinks: template.goalLinks ? JSON.parse(template.goalLinks) : [],
    };
  }

  // ===== ITaskTemplateRepository 接口实现 =====

  async findById(uuid: string): Promise<TaskTemplateDTO | null> {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { uuid },
    });

    return template ? this.mapTaskTemplateToDTO(template) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where: { accountUuid },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskTemplate.count({ where: { accountUuid } }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      templates: templates.map((template) => this.mapTaskTemplateToDTO(template)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findByStatus(
    accountUuid: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where: {
          accountUuid,
          status,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskTemplate.count({
        where: {
          accountUuid,
          status,
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      templates: templates.map((template) => this.mapTaskTemplateToDTO(template)),
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
  ): Promise<TaskTemplateListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where: {
          accountUuid,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskTemplate.count({
        where: {
          accountUuid,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      templates: templates.map((template) => this.mapTaskTemplateToDTO(template)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async save(taskTemplate: TaskTemplateDTO): Promise<void> {
    const data = {
      accountUuid: taskTemplate.accountUuid,
      title: taskTemplate.title,
      description: taskTemplate.description,
      // 时间配置展开
      timeType: taskTemplate.timeConfig.time.timeType,
      startTime: taskTemplate.timeConfig.time.startTime,
      endTime: taskTemplate.timeConfig.time.endTime,
      startDate: new Date(taskTemplate.timeConfig.date.startDate),
      endDate: taskTemplate.timeConfig.date.endDate
        ? new Date(taskTemplate.timeConfig.date.endDate)
        : null,
      scheduleMode: taskTemplate.timeConfig.schedule.mode,
      intervalDays: taskTemplate.timeConfig.schedule.intervalDays,
      weekdays: JSON.stringify(taskTemplate.timeConfig.schedule.weekdays || []),
      monthDays: JSON.stringify(taskTemplate.timeConfig.schedule.monthDays || []),
      timezone: taskTemplate.timeConfig.timezone,
      // 提醒配置展开
      reminderEnabled: taskTemplate.reminderConfig.enabled,
      reminderMinutesBefore: taskTemplate.reminderConfig.minutesBefore,
      reminderMethods: JSON.stringify(taskTemplate.reminderConfig.methods),
      // 属性展开
      importance: taskTemplate.properties.importance,
      urgency: taskTemplate.properties.urgency,
      location: taskTemplate.properties.location,
      tags: JSON.stringify(taskTemplate.properties.tags),
      // 状态
      status: taskTemplate.lifecycle.status,
      // 统计信息
      totalInstances: taskTemplate.stats.totalInstances,
      completedInstances: taskTemplate.stats.completedInstances,
      completionRate: taskTemplate.stats.completionRate,
      lastInstanceDate: taskTemplate.stats.lastInstanceDate
        ? new Date(taskTemplate.stats.lastInstanceDate)
        : null,
      // 目标关联
      goalLinks: JSON.stringify(taskTemplate.goalLinks || []),
    };

    await this.prisma.taskTemplate.upsert({
      where: { uuid: taskTemplate.uuid },
      update: data,
      create: {
        uuid: taskTemplate.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.delete({
      where: { uuid },
    });
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.taskTemplate.deleteMany({
      where: {
        uuid: { in: uuids },
      },
    });
  }

  async count(accountUuid: string, status?: string): Promise<number> {
    const where: any = { accountUuid };
    if (status) {
      where.status = status;
    }

    return await this.prisma.taskTemplate.count({ where });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.taskTemplate.count({
      where: { uuid },
    });

    return count > 0;
  }
}
