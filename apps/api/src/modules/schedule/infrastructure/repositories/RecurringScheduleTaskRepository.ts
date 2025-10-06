import { PrismaClient } from '@prisma/client';
import type { IRecurringScheduleTaskRepository } from '@dailyuse/domain-server';
import { RecurringScheduleTask } from '@dailyuse/domain-core';

/**
 * Prisma Recurring Schedule Task Repository Implementation
 * 循环调度任务的 Prisma 仓储实现
 * 返回 RecurringScheduleTask 聚合根实体
 */
export class RecurringScheduleTaskRepository implements IRecurringScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== IRecurringScheduleTaskRepository 接口实现 =====

  async save(task: RecurringScheduleTask): Promise<RecurringScheduleTask> {
    const persistence = task.toPersistence();

    const saved = await this.prisma.recurringScheduleTask.upsert({
      where: { uuid: task.uuid },
      create: persistence,
      update: persistence,
    });

    return RecurringScheduleTask.fromPersistence(saved);
  }

  async findByUuid(uuid: string): Promise<RecurringScheduleTask | null> {
    const task = await this.prisma.recurringScheduleTask.findUnique({
      where: { uuid },
    });

    return task ? RecurringScheduleTask.fromPersistence(task) : null;
  }

  async findBySource(
    sourceModule: string,
    sourceEntityId: string,
  ): Promise<RecurringScheduleTask[]> {
    const tasks = await this.prisma.recurringScheduleTask.findMany({
      where: {
        sourceModule,
        sourceEntityId,
      },
    });

    return tasks.map((task) => RecurringScheduleTask.fromPersistence(task));
  }

  async findAllEnabled(): Promise<RecurringScheduleTask[]> {
    const tasks = await this.prisma.recurringScheduleTask.findMany({
      where: {
        enabled: true,
        status: 'ACTIVE',
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });

    return tasks.map((task) => RecurringScheduleTask.fromPersistence(task));
  }

  async findAll(): Promise<RecurringScheduleTask[]> {
    const tasks = await this.prisma.recurringScheduleTask.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks.map((task) => RecurringScheduleTask.fromPersistence(task));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.recurringScheduleTask.delete({
      where: { uuid },
    });
  }

  async update(task: RecurringScheduleTask): Promise<RecurringScheduleTask> {
    const persistence = task.toPersistence();

    const updated = await this.prisma.recurringScheduleTask.update({
      where: { uuid: task.uuid },
      data: persistence,
    });

    return RecurringScheduleTask.fromPersistence(updated);
  }

  /**
   * 批量查询指定源模块的所有任务
   */
  async findBySourceModule(sourceModule: string): Promise<RecurringScheduleTask[]> {
    const tasks = await this.prisma.recurringScheduleTask.findMany({
      where: { sourceModule },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => RecurringScheduleTask.fromPersistence(task));
  }

  /**
   * 查询需要执行的任务（已启用 && 状态为ACTIVE && nextRunAt <= 当前时间）
   */
  async findDueTasks(): Promise<RecurringScheduleTask[]> {
    const now = new Date();

    const tasks = await this.prisma.recurringScheduleTask.findMany({
      where: {
        enabled: true,
        status: 'ACTIVE',
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });

    return tasks.map((task) => RecurringScheduleTask.fromPersistence(task));
  }

  /**
   * 记录任务执行结果
   */
  async recordExecution(
    uuid: string,
    result: {
      executedAt: Date;
      status: 'SUCCESS' | 'FAILED';
      error?: string;
    },
  ): Promise<void> {
    const task = await this.prisma.recurringScheduleTask.findUnique({
      where: { uuid },
    });

    if (!task) {
      throw new Error(`RecurringScheduleTask with UUID ${uuid} not found`);
    }

    // 解析现有执行历史
    const executionHistory = task.executionHistory
      ? JSON.parse(task.executionHistory as string)
      : [];

    // 添加新的执行记录
    executionHistory.push({
      executedAt: result.executedAt.toISOString(),
      status: result.status,
      error: result.error,
    });

    // 保留最近50条记录
    const trimmedHistory = executionHistory.slice(-50);

    // 更新任务
    await this.prisma.recurringScheduleTask.update({
      where: { uuid },
      data: {
        lastRunAt: result.executedAt,
        executionCount: { increment: 1 },
        executionHistory: JSON.stringify(trimmedHistory),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 检查任务是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.recurringScheduleTask.count({
      where: { uuid },
    });

    return count > 0;
  }

  /**
   * 批量删除指定源模块的任务
   */
  async deleteBySourceModule(sourceModule: string): Promise<number> {
    const result = await this.prisma.recurringScheduleTask.deleteMany({
      where: { sourceModule },
    });

    return result.count;
  }
}
