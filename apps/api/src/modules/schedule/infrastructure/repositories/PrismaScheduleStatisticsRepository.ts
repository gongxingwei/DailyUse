import { PrismaClient } from '@prisma/client';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server';
import { ScheduleStatistics } from '@dailyuse/domain-server';

/**
 * ScheduleStatistics 聚合根 Prisma 仓储实现
 * 负责统计数据的持久化
 *
 * 参考 Repository 模块的统计仓储实现模式
 */
export class PrismaScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 ScheduleStatistics 实体
   */
  private mapToEntity(data: any): ScheduleStatistics {
    const moduleStats = data.moduleStats || '{}';

    return ScheduleStatistics.fromPersistenceDTO({
      account_uuid: data.accountUuid,
      // 任务统计
      total_tasks: data.totalTasks,
      active_tasks: data.activeTasks,
      paused_tasks: data.pausedTasks,
      completed_tasks: data.completedTasks,
      failed_tasks: data.failedTasks,
      cancelled_tasks: data.cancelledTasks,
      // 执行统计
      total_executions: data.totalExecutions,
      successful_executions: data.successfulExecutions,
      failed_executions: data.failedExecutions,
      skipped_executions: data.skippedExecutions,
      timeout_executions: data.timeoutExecutions || 0,
      // 性能指标
      avg_execution_duration: data.avgExecutionDuration,
      min_execution_duration: data.minExecutionDuration,
      max_execution_duration: data.maxExecutionDuration,
      // 模块统计（JSON string）
      module_statistics: moduleStats,
      // 时间戳
      last_updated_at: data.lastUpdatedAt?.getTime() || Date.now(),
      created_at: data.createdAt?.getTime() || Date.now(),
    });
  }

  /**
   * 将领域实体转换为 Prisma 数据
   */
  private mapToPrisma(stats: ScheduleStatistics): any {
    const dto = stats.toPersistenceDTO();

    return {
      accountUuid: dto.account_uuid,
      // 任务统计
      totalTasks: dto.total_tasks,
      activeTasks: dto.active_tasks,
      pausedTasks: dto.paused_tasks,
      completedTasks: dto.completed_tasks,
      failedTasks: dto.failed_tasks,
      cancelledTasks: dto.cancelled_tasks,
      // 执行统计
      totalExecutions: dto.total_executions,
      successfulExecutions: dto.successful_executions,
      failedExecutions: dto.failed_executions,
      skippedExecutions: dto.skipped_executions,
      timeoutExecutions: dto.timeout_executions,
      // 性能指标
      avgExecutionDuration: dto.avg_execution_duration,
      minExecutionDuration: dto.min_execution_duration,
      maxExecutionDuration: dto.max_execution_duration,
      // 时间戳
      lastUpdatedAt: new Date(dto.last_updated_at),
      createdAt: new Date(dto.created_at),
      // 模块统计（JSON string）
      moduleStats: dto.module_statistics,
    };
  }

  // ===== 仓储方法 =====

  /**
   * 保存或更新统计数据（UPSERT）
   */
  async save(stats: ScheduleStatistics): Promise<void> {
    const data = this.mapToPrisma(stats);

    await this.prisma.scheduleStatistics.upsert({
      where: { accountUuid: data.accountUuid },
      create: data,
      update: data,
    });
  }

  /**
   * 根据账户UUID查找统计数据
   */
  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const data = await this.prisma.scheduleStatistics.findUnique({
      where: { accountUuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 获取或创建统计数据
   * 如果不存在则创建一个初始化的统计对象
   */
  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      // 创建初始化的统计数据
      stats = ScheduleStatistics.createEmpty(accountUuid);
      await this.save(stats);
    }

    return stats;
  }

  /**
   * 删除统计数据（接口要求的方法名）
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await this.prisma.scheduleStatistics.delete({
      where: { accountUuid },
    });
  }

  /**
   * 查询所有统计数据
   */
  async findAll(limit?: number, offset?: number): Promise<ScheduleStatistics[]> {
    const data = await this.prisma.scheduleStatistics.findMany({
      take: limit,
      skip: offset,
      orderBy: { lastUpdatedAt: 'desc' },
    });

    return data.map((d) => this.mapToEntity(d));
  }

  /**
   * 批量保存
   */
  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    for (const stats of statistics) {
      await this.save(stats);
    }
  }

  /**
   * 重置统计数据
   */
  async reset(accountUuid: string): Promise<void> {
    const stats = ScheduleStatistics.createEmpty(accountUuid);
    await this.save(stats);
  }

  /**
   * 事务支持
   */
  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new PrismaScheduleStatisticsRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}
