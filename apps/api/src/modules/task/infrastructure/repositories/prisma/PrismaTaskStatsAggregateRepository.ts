/**
 * Prisma Task Stats Repository Implementation
 * Prisma任务统计仓储实现
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskStatsRepository } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskStatsDTO = TaskContracts.TaskStatsDTO;
type TaskTimelineResponse = TaskContracts.TaskTimelineResponse;

export class PrismaTaskStatsRepository implements ITaskStatsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== ITaskStatsRepository 接口实现 =====

  async getAccountStats(accountUuid: string): Promise<TaskStatsDTO> {
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

  async getEfficiencyAnalysis(
    accountUuid: string,
    templateUuids?: string[],
  ): Promise<{
    avgDuration: number;
    onTimeRate: number;
    completionRate: number;
    overdueRate: number;
  }> {
    const whereClause: any = {
      accountUuid,
      executionStatus: 'completed',
    };

    if (templateUuids && templateUuids.length > 0) {
      whereClause.templateUuid = { in: templateUuids };
    }

    const completedTasks = await this.prisma.taskInstance.findMany({
      where: whereClause,
      select: {
        actualDuration: true,
        estimatedDuration: true,
        scheduledDate: true,
        actualEndTime: true,
      },
      take: 100, // 限制数量以提高性能
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (completedTasks.length === 0) {
      return {
        avgDuration: 0,
        onTimeRate: 0,
        completionRate: 100, // 假设没有任务时完成率为100%
        overdueRate: 0,
      };
    }

    // 计算平均持续时间
    const validDurations = completedTasks
      .map((task) => task.actualDuration)
      .filter((duration) => duration !== null) as number[];

    const avgDuration =
      validDurations.length > 0
        ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
        : 0;

    // 计算按时完成率
    let onTimeCount = 0;
    let overdueCount = 0;

    for (const task of completedTasks) {
      if (task.actualEndTime && task.scheduledDate) {
        const scheduledEnd = new Date(task.scheduledDate);
        const actualEnd = new Date(task.actualEndTime);

        if (actualEnd <= scheduledEnd) {
          onTimeCount++;
        } else {
          overdueCount++;
        }
      }
    }

    const totalAnalyzed = completedTasks.length;
    const onTimeRate = totalAnalyzed > 0 ? (onTimeCount / totalAnalyzed) * 100 : 0;
    const overdueRate = totalAnalyzed > 0 ? (overdueCount / totalAnalyzed) * 100 : 0;

    return {
      avgDuration: Math.round(avgDuration),
      onTimeRate: Math.round(onTimeRate * 100) / 100,
      completionRate: 100, // 这里只分析已完成的任务，所以完成率是100%
      overdueRate: Math.round(overdueRate * 100) / 100,
    };
  }

  // ===== 私有辅助方法 =====

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

    // 安全转换日期字段为ISO字符串
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

    // 安全转换日期字段为Date对象
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
    // 确保传入的是有效的Date对象
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
