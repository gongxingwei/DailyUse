import { PrismaClient } from '@prisma/client';
import type { IScheduleTaskRepository } from '@dailyuse/domain-server';
import { ScheduleTask, ScheduleExecution } from '@dailyuse/domain-server';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts';

/**
 * ScheduleTask 查询选项（临时定义）
 */
interface IScheduleTaskQueryOptions {
  accountUuid?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
  status?: ScheduleTaskStatus;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ScheduleTask 聚合根 Prisma 仓储实现
 * 负责 ScheduleTask 及其执行记录的完整持久化
 *
 * 参考 Repository 模块的实现模式
 *
 * ⚠️ 注意：当前适配现有的简化 schema，未来需要迁移到完整的 DDD schema
 */
export class PrismaScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 ScheduleTask 聚合根实体
   */
  private mapToEntity(data: any): ScheduleTask {
    // ========== 组装 ScheduleConfig 值对象 ==========
    const schedule = {
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      startDate: data.startDate ? data.startDate.getTime() : undefined,
      endDate: data.endDate ? data.endDate.getTime() : undefined,
      maxExecutions: data.maxExecutions,
    };

    // ========== 组装 ExecutionInfo 值对象 ==========
    const execution = {
      nextRunAt: data.nextRunAt ? data.nextRunAt.getTime() : undefined,
      lastRunAt: data.lastRunAt ? data.lastRunAt.getTime() : undefined,
      executionCount: data.executionCount,
      lastExecutionStatus: data.lastExecutionStatus,
      lastExecutionDuration: data.lastExecutionDuration,
      consecutiveFailures: data.consecutiveFailures,
    };

    // ========== 组装 RetryPolicy 值对象 ==========
    const retryPolicy = {
      maxRetries: data.maxRetries,
      initialDelayMs: data.initialDelayMs,
      maxDelayMs: data.maxDelayMs,
      backoffMultiplier: data.backoffMultiplier,
      retryableStatuses: JSON.parse(data.retryableStatuses || '[]'),
    };

    // ========== 组装 TaskMetadata 值对象 ==========
    const metadata = {
      payload: data.payload,
      tags: JSON.parse(data.tags || '[]'),
      priority: data.priority,
      timeout: data.timeout,
    };

    // 使用领域实体的 fromPersistenceDTO 方法创建实体
    const task = ScheduleTask.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      name: data.name,
      description: data.description,
      source_module: data.sourceModule,
      source_entity_id: data.sourceEntityId,
      status: data.status,
      enabled: data.enabled,
      // 值对象（已组装）
      schedule,
      execution,
      retry_policy: retryPolicy,
      metadata,
      // 时间戳
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });

    // 加载执行记录子实体
    if (data.executions) {
      data.executions.forEach((exec: any) => {
        const execution = ScheduleExecution.fromPersistenceDTO({
          uuid: exec.uuid,
          task_uuid: exec.taskUuid,
          execution_time: exec.executionTime?.getTime() || Date.now(),
          status: exec.status,
          duration: exec.duration,
          result: exec.result || null,
          error: exec.error,
          retry_count: exec.retryCount || 0,
          created_at: exec.createdAt?.getTime() || Date.now(),
        });
        task.addExecution(execution);
      });
    }

    return task;
  }

  /**
   * 将 ScheduleTask 实体映射为 Prisma 数据
   */
  private mapToPrisma(task: ScheduleTask): any {
    const dto = task.toPersistenceDTO();

    // 展开 schedule 值对象
    const schedule = dto.schedule || {};
    // 展开 execution 值对象
    const execution = dto.execution || {};
    // 展开 retry_policy 值对象
    const retryPolicy = dto.retry_policy || {};
    // 展开 metadata 值对象
    const metadata = dto.metadata || {};

    return {
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.source_module,
      sourceEntityId: dto.source_entity_id,
      status: dto.status,
      enabled: dto.enabled,
      // ScheduleConfig 展开字段
      cronExpression: schedule.cronExpression || null,
      timezone: schedule.timezone || 'UTC',
      startDate: schedule.startDate ? new Date(schedule.startDate) : null,
      endDate: schedule.endDate ? new Date(schedule.endDate) : null,
      maxExecutions: schedule.maxExecutions || null,
      // ExecutionInfo 展开字段
      nextRunAt: execution.nextRunAt ? new Date(execution.nextRunAt) : null,
      lastRunAt: execution.lastRunAt ? new Date(execution.lastRunAt) : null,
      executionCount: execution.executionCount || 0,
      lastExecutionStatus: execution.lastExecutionStatus || null,
      lastExecutionDuration: execution.lastExecutionDuration || null,
      consecutiveFailures: execution.consecutiveFailures || 0,
      // RetryPolicy 展开字段
      maxRetries: retryPolicy.maxRetries || 3,
      initialDelayMs: retryPolicy.initialDelayMs || 1000,
      maxDelayMs: retryPolicy.maxDelayMs || 60000,
      backoffMultiplier: retryPolicy.backoffMultiplier || 2.0,
      retryableStatuses: JSON.stringify(retryPolicy.retryableStatuses || []),
      // TaskMetadata 展开字段
      payload: metadata.payload || null,
      tags: JSON.stringify(metadata.tags || []),
      priority: metadata.priority || 'normal',
      timeout: metadata.timeout || 30000,
      // 时间戳
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }

  // ===== 基本 CRUD =====

  async save(task: ScheduleTask): Promise<void> {
    const data = this.mapToPrisma(task);

    await this.prisma.scheduleTask.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: data,
    });

    // 保存执行记录（如果有）
    const executions = task.executions;
    if (executions && executions.length > 0) {
      for (const execution of executions) {
        const execDto = execution.toPersistenceDTO();
        await this.prisma.scheduleExecution.upsert({
          where: { uuid: execDto.uuid },
          create: {
            uuid: execDto.uuid,
            taskUuid: execDto.task_uuid,
            executionTime: new Date(execDto.execution_time),
            status: execDto.status,
            duration: execDto.duration,
            result: execDto.result || null,
            error: execDto.error,
            retryCount: execDto.retry_count || 0,
          },
          update: {
            status: execDto.status,
            duration: execDto.duration,
            result: execDto.result || null,
            error: execDto.error,
            retryCount: execDto.retry_count || 0,
          },
        });
      }
    }
  }

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const data = await this.prisma.scheduleTask.findUnique({
      where: { uuid },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 最近 10 条执行记录
        },
      },
    });

    return data ? this.mapToEntity(data) : null;
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.delete({
      where: { uuid },
    });
  }

  // ===== 查询方法 =====

  async findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: { accountUuid },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async findBySourceModule(module: SourceModule, accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    accountUuid?: string,
  ): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        sourceEntityId: entityId,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async findByStatus(status: ScheduleTaskStatus, accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        status: status,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async findEnabled(accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    // ✅ 优化完成！现在 nextRunAt 是独立字段，可以直接用 SQL 查询
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.ACTIVE,
        nextRunAt: {
          lte: beforeTime, // ⭐ 直接 SQL 查询！
        },
      },
      orderBy: {
        nextRunAt: 'asc', // 按执行时间排序
      },
      take: limit,
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    const where: any = {};

    if (options.accountUuid) where.accountUuid = options.accountUuid;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    const tasks = await this.prisma.scheduleTask.findMany({
      where,
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      take: options.limit,
      skip: options.offset,
    });

    return tasks.map((task) => this.mapToEntity(task));
  }

  async count(options: IScheduleTaskQueryOptions): Promise<number> {
    const where: any = {};

    if (options.accountUuid) where.accountUuid = options.accountUuid;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    return this.prisma.scheduleTask.count({ where });
  }

  // ===== 批量操作 =====

  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.scheduleTask.deleteMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
    });
  }

  // ===== 事务支持 =====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new PrismaScheduleTaskRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}
