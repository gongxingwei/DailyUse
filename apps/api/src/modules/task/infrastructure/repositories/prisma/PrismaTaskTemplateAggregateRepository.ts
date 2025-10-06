/**
 * Prisma Task Template Aggregate Repository Implementation
 * 使用领域实体的 fromPersistence / toPersistence 方法
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskTemplateAggregateRepository } from '@dailyuse/domain-server';
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-server';

export class PrismaTaskTemplateAggregateRepository implements ITaskTemplateAggregateRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 TaskTemplate 聚合根实体
   */
  private mapToEntity(template: any): TaskTemplate {
    // 使用实体的 fromPersistence 方法创建实体
    const templateEntity = TaskTemplate.fromPersistence(template);

    // 加载子实体（TaskInstance）
    if (template.instances) {
      template.instances.forEach((instanceData: any) => {
        const instanceEntity = TaskInstance.fromPersistence(instanceData);
        templateEntity.addInstance(instanceEntity);
      });
    }

    return templateEntity;
  }

  // ===== ITaskTemplateAggregateRepository 接口实现 =====

  async saveTemplate(accountUuid: string, template: TaskTemplate): Promise<TaskTemplate> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const templatePersistence = template.toPersistence(accountUuid);

    // 使用事务保存 TaskTemplate 及其所有子实体
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert TaskTemplate 主实体
      await tx.taskTemplate.upsert({
        where: { uuid: templatePersistence.uuid },
        create: {
          uuid: templatePersistence.uuid,
          accountUuid: templatePersistence.accountUuid,
          title: templatePersistence.title,
          description: templatePersistence.description,
          
          // 时间配置 - 扁平化
          timeType: templatePersistence.timeType,
          startTime: templatePersistence.startTime,
          endTime: templatePersistence.endTime,
          startDate: templatePersistence.startDate,
          endDate: templatePersistence.endDate,
          scheduleMode: templatePersistence.scheduleMode,
          intervalDays: templatePersistence.intervalDays,
          weekdays: templatePersistence.weekdays,
          monthDays: templatePersistence.monthDays,
          timezone: templatePersistence.timezone,
          
          // 提醒配置 - 扁平化
          reminderEnabled: templatePersistence.reminderEnabled,
          reminderMinutesBefore: templatePersistence.reminderMinutesBefore,
          reminderMethods: templatePersistence.reminderMethods,
          
          // 属性 - 扁平化
          importance: templatePersistence.importance,
          urgency: templatePersistence.urgency,
          location: templatePersistence.location,
          tags: templatePersistence.tags,
          
          // 目标关联
          goalLinks: templatePersistence.goalLinks,
          
          // 状态
          status: templatePersistence.status,
          
          // 统计信息
          totalInstances: templatePersistence.totalInstances,
          completedInstances: templatePersistence.completedInstances,
          lastInstanceDate: templatePersistence.lastInstanceDate,
          
          // 生命周期
          createdAt: templatePersistence.createdAt,
          updatedAt: templatePersistence.updatedAt,
        },
        update: {
          title: templatePersistence.title,
          description: templatePersistence.description,
          
          timeType: templatePersistence.timeType,
          startTime: templatePersistence.startTime,
          endTime: templatePersistence.endTime,
          startDate: templatePersistence.startDate,
          endDate: templatePersistence.endDate,
          scheduleMode: templatePersistence.scheduleMode,
          intervalDays: templatePersistence.intervalDays,
          weekdays: templatePersistence.weekdays,
          monthDays: templatePersistence.monthDays,
          timezone: templatePersistence.timezone,
          
          reminderEnabled: templatePersistence.reminderEnabled,
          reminderMinutesBefore: templatePersistence.reminderMinutesBefore,
          reminderMethods: templatePersistence.reminderMethods,
          
          importance: templatePersistence.importance,
          urgency: templatePersistence.urgency,
          location: templatePersistence.location,
          tags: templatePersistence.tags,
          
          goalLinks: templatePersistence.goalLinks,
          status: templatePersistence.status,
          
          totalInstances: templatePersistence.totalInstances,
          completedInstances: templatePersistence.completedInstances,
          lastInstanceDate: templatePersistence.lastInstanceDate,
          
          updatedAt: templatePersistence.updatedAt,
        },
      });

      // 2. Upsert TaskInstances（子实体）
      for (const instance of template.instances) {
        const instancePersistence = instance.toPersistence(accountUuid);
        await tx.taskInstance.upsert({
          where: { uuid: instancePersistence.uuid },
          create: instancePersistence,
          update: instancePersistence,
        });
      }
    });

    // 返回保存后的实体
    return template;
  }

  async getTemplateByUuid(accountUuid: string, uuid: string): Promise<TaskTemplate | null> {
    const template = await this.prisma.taskTemplate.findFirst({
      where: {
        uuid,
        accountUuid,
      },
      include: {
        instances: {
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });

    return template ? this.mapToEntity(template) : null;
  }

  async getAllTemplates(
    accountUuid: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ templates: TaskTemplate[]; total: number }> {
    const where: any = { accountUuid };
    if (options?.status) {
      where.status = options.status;
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where,
        include: {
          instances: {
            orderBy: { scheduledDate: 'desc' },
            take: 100, // 每个模板最多加载100个实例
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t) => this.mapToEntity(t)),
      total,
    };
  }

  async searchTemplates(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ templates: TaskTemplate[]; total: number }> {
    const where = {
      accountUuid,
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where,
        include: {
          instances: {
            orderBy: { scheduledDate: 'desc' },
            take: 100,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t) => this.mapToEntity(t)),
      total,
    };
  }

  async deleteTemplate(accountUuid: string, uuid: string): Promise<boolean> {
    // 使用事务删除模板及其所有子实体
    await this.prisma.$transaction(async (tx) => {
      // 1. 删除所有关联的实例
      await tx.taskInstance.deleteMany({
        where: {
          templateUuid: uuid,
          accountUuid,
        },
      });

      // 2. 删除模板本身
      await tx.taskTemplate.delete({
        where: { uuid },
      });
    });

    return true;
  }

  async countTemplates(accountUuid: string, status?: string): Promise<number> {
    const where: any = { accountUuid };
    if (status) {
      where.status = status;
    }

    return await this.prisma.taskTemplate.count({ where });
  }

  async templateExists(accountUuid: string, uuid: string): Promise<boolean> {
    const count = await this.prisma.taskTemplate.count({
      where: {
        uuid,
        accountUuid,
      },
    });

    return count > 0;
  }
}
