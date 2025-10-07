import { PrismaClient } from '@prisma/client';
import type { IScheduleTaskRepository } from '@dailyuse/domain-server';
import { ScheduleTask } from '@dailyuse/domain-core';

/**
 * ScheduleTask 仓储实现
 * 使用 Prisma 操作数据库
 * 返回 ScheduleTask 聚合根实体
 */
export class ScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ===== IScheduleTaskRepository 接口实现 =====

  async save(task: ScheduleTask): Promise<ScheduleTask> {
    const persistence = task.toPersistence();

    const saved = await this.prisma.scheduleTask.upsert({
      where: { uuid: task.uuid },
      create: persistence,
      update: persistence,
    });

    return ScheduleTask.fromPersistence(saved);
  }

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const task = await this.prisma.scheduleTask.findUnique({
      where: { uuid },
    });

    return task ? ScheduleTask.fromPersistence(task) : null;
  }

  async findBySource(sourceModule: string, sourceEntityId: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule,
        sourceEntityId,
      },
    });

    return tasks.map((task) => ScheduleTask.fromPersistence(task));
  }

  async findAllEnabled(): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: {
          in: ['active'],
        },
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });

    return tasks.map((task) => ScheduleTask.fromPersistence(task));
  }

  async findAll(): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks.map((task) => ScheduleTask.fromPersistence(task));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.delete({
      where: { uuid },
    });
  }

  async update(task: ScheduleTask): Promise<ScheduleTask> {
    const persistence = task.toPersistence();

    const updated = await this.prisma.scheduleTask.update({
      where: { uuid: task.uuid },
      data: persistence,
    });

    return ScheduleTask.fromPersistence(updated);
  }

  // ===== 查询方法 =====

  async findBySourceModule(sourceModule: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: { sourceModule },
    });

    return tasks.map((task) => ScheduleTask.fromPersistence(task));
  }

  /**
   * 查找到期需要执行的任务
   * 条件: enabled=true, status=active, nextRunAt <= now
   */
  async findDueTasks(): Promise<ScheduleTask[]> {
    const now = new Date();

    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: 'active',
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });

    return tasks.map((task) => ScheduleTask.fromPersistence(task));
  }

  /**
   * 批量更新任务状态
   */
  async batchUpdateStatus(
    uuids: string[],
    status: 'active' | 'paused' | 'completed' | 'cancelled',
  ): Promise<void> {
    const task = await this.prisma.scheduleTask.findUnique({
      where: { uuid: uuids[0] },
    });

    if (!task) {
      throw new Error(`ScheduleTask with UUID ${uuids[0]} not found`);
    }

    for (const uuid of uuids) {
      await this.prisma.scheduleTask.update({
        where: { uuid },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * 批量启用/禁用任务
   */
  async batchToggleEnabled(uuids: string[], enabled: boolean): Promise<void> {
    for (const uuid of uuids) {
      await this.prisma.scheduleTask.update({
        where: { uuid },
        data: {
          enabled,
          status: enabled ? 'active' : 'paused',
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * 统计特定来源模块的任务数量
   */
  async countBySourceModule(sourceModule: string): Promise<number> {
    const count = await this.prisma.scheduleTask.count({
      where: { sourceModule },
    });

    return count;
  }

  /**
   * 批量删除特定来源模块的任务
   */
  async deleteBySourceModule(sourceModule: string): Promise<number> {
    const result = await this.prisma.scheduleTask.deleteMany({
      where: { sourceModule },
    });

    return result.count;
  }
}
