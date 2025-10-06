/**
 * Prisma Task Template Aggregate Repository Implementation
 * 使用领域实体的 fromPersistence / toPersistence 方法
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskTemplateAggregateRepository } from '@dailyuse/domain-server';
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

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

  // ===== 统计查询方法（原 TaskStats 聚合根功能，现已合并到 TaskTemplate）=====

  async getAccountStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO> {
    // 获取总体统计信息
    const [totalTasks, completedTasks, pendingTasks, inProgressTasks] = await Promise.all([
      this.prisma.taskInstance.count({ where: { accountUuid } }),
      this.prisma.taskInstance.count({
        where: { accountUuid, executionStatus: 'completed' },
      }),
      this.prisma.taskInstance.count({
        where: { accountUuid, executionStatus: 'pending' },
      }),
      this.prisma.taskInstance.count({
        where: { accountUuid, executionStatus: 'inProgress' },
      }),
    ]);

    // 计算过期任务
    const now = new Date();
    const overdueTasks = await this.prisma.taskInstance.count({
      where: {
        accountUuid,
        scheduledDate: { lt: now },
        executionStatus: { in: ['pending', 'inProgress'] },
      },
    });

    const incomplete = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 获取模板统计
    const templateStats = await this.getTemplateStatsForAccount(accountUuid);

    // 获取时间周期统计
    const byTimePeriod = await this.getDateRangeStats(accountUuid, new Date(), new Date());

    // 获取趋势数据
    const trends = await this.getCompletionTrends(accountUuid, 30);

    return {
      overall: {
        total: totalTasks,
        completed: completedTasks,
        incomplete,
        completionRate: Math.round(completionRate * 100) / 100,
        overdue: overdueTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
      },
      byTemplate: templateStats,
      byTimePeriod,
      trends,
    };
  }

  async getTemplateStats(
    templateUuid: string,
  ): Promise<TaskContracts.TaskStatsDTO['byTemplate'][0]> {
    // 获取模板相关统计
    const [template, totalInstances, completedInstances] = await Promise.all([
      this.prisma.taskTemplate.findUnique({
        where: { uuid: templateUuid },
        select: { title: true },
      }),
      this.prisma.taskInstance.count({
        where: { templateUuid },
      }),
      this.prisma.taskInstance.count({
        where: { templateUuid, executionStatus: 'completed' },
      }),
    ]);

    const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

    // 计算平均持续时间
    const avgDurationResult = await this.prisma.taskInstance.aggregate({
      where: {
        templateUuid,
        executionStatus: 'completed',
        actualDuration: { not: null },
      },
      _avg: {
        actualDuration: true,
      },
    });

    return {
      templateUuid,
      templateTitle: template?.title || 'Unknown Template',
      total: totalInstances,
      completed: completedInstances,
      completionRate: Math.round(completionRate * 100) / 100,
      avgDuration: Math.round(avgDurationResult._avg.actualDuration || 0),
    };
  }

  async getDateRangeStats(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TaskContracts.TaskStatsDTO['byTimePeriod']> {
    const now = new Date();

    // 今日统计
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [todayTotal, todayCompleted] = await Promise.all([
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfToday, lt: endOfToday },
        },
      }),
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfToday, lt: endOfToday },
          executionStatus: 'completed',
        },
      }),
    ]);

    // 本周统计
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [weekTotal, weekCompleted] = await Promise.all([
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfWeek },
        },
      }),
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfWeek },
          executionStatus: 'completed',
        },
      }),
    ]);

    // 本月统计
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthTotal, monthCompleted] = await Promise.all([
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfMonth },
        },
      }),
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { gte: startOfMonth },
          executionStatus: 'completed',
        },
      }),
    ]);

    return {
      today: {
        total: todayTotal,
        completed: todayCompleted,
        completionRate:
          todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 10000) / 100 : 0,
      },
      thisWeek: {
        total: weekTotal,
        completed: weekCompleted,
        completionRate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 10000) / 100 : 0,
      },
      thisMonth: {
        total: monthTotal,
        completed: monthCompleted,
        completionRate:
          monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 10000) / 100 : 0,
      },
    };
  }

  async getCompletionTrends(
    accountUuid: string,
    days: number,
  ): Promise<TaskContracts.TaskStatsDTO['trends']> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        scheduledDate: { gte: startDate },
      },
      select: {
        scheduledDate: true,
        executionStatus: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // 按日分组
    const dailyCompletion = this.groupTasksByDay(tasks);

    // 按周分组
    const weeklyCompletion = this.groupTasksByWeek(tasks);

    return {
      dailyCompletion,
      weeklyCompletion,
    };
  }

  // ===== 私有辅助方法（统计用） =====

  private async getTemplateStatsForAccount(
    accountUuid: string,
  ): Promise<TaskContracts.TaskStatsDTO['byTemplate']> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid },
      select: { uuid: true, title: true },
    });

    const templateStats = await Promise.all(
      templates.map((template) => this.getTemplateStats(template.uuid)),
    );

    return templateStats;
  }

  private groupTasksByDay(
    tasks: Array<{ scheduledDate: Date; executionStatus: string }>,
  ): Array<{ date: string; completed: number; total: number }> {
    const groups = new Map<string, { completed: number; total: number }>();

    const safeToISOString = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') return new Date(date).toISOString();
      return new Date().toISOString();
    };

    for (const task of tasks) {
      const dateKey = safeToISOString(task.scheduledDate).split('T')[0];

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { completed: 0, total: 0 });
      }

      const group = groups.get(dateKey)!;
      group.total++;

      if (task.executionStatus === 'completed') {
        group.completed++;
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        ...stats,
      }));
  }

  private groupTasksByWeek(
    tasks: Array<{ scheduledDate: Date; executionStatus: string }>,
  ): Array<{ week: string; completed: number; total: number }> {
    const groups = new Map<string, { completed: number; total: number }>();

    const safeToDate = (date: any): Date => {
      if (!date) return new Date();
      if (date instanceof Date) return date;
      if (typeof date === 'string') return new Date(date);
      return new Date();
    };

    for (const task of tasks) {
      const weekKey = this.getWeekKey(safeToDate(task.scheduledDate));

      if (!groups.has(weekKey)) {
        groups.set(weekKey, { completed: 0, total: 0 });
      }

      const group = groups.get(weekKey)!;
      group.total++;

      if (task.executionStatus === 'completed') {
        group.completed++;
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, stats]) => ({
        week,
        ...stats,
      }));
  }

  private getWeekKey(date: Date): string {
    const safeDate = date instanceof Date ? date : new Date(date);
    const year = safeDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor(
      (safeDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
}
