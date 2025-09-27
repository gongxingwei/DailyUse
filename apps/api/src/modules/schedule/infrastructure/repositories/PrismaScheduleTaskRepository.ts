import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { IScheduleTaskRepository } from '@dailyuse/domain-server';
import type { ScheduleContracts } from '@dailyuse/contracts';

type CreateScheduleTaskRequestDto = ScheduleContracts.CreateScheduleTaskRequestDto;
type UpdateScheduleTaskRequestDto = ScheduleContracts.UpdateScheduleTaskRequestDto;
type ScheduleTaskResponseDto = ScheduleContracts.ScheduleTaskResponseDto;
type ScheduleTaskListResponseDto = ScheduleContracts.ScheduleTaskListResponseDto;
type IScheduleTaskQuery = ScheduleContracts.IScheduleTaskQuery;
type IScheduleTaskStatistics = ScheduleContracts.IScheduleTaskStatistics;
type ScheduleExecutionResultResponseDto = ScheduleContracts.ScheduleExecutionResultResponseDto;
type ScheduleTaskLogResponseDto = ScheduleContracts.ScheduleTaskLogResponseDto;
type UpcomingTasksResponseDto = ScheduleContracts.UpcomingTasksResponseDto;
type ScheduleStatus = ScheduleContracts.ScheduleStatus;
type ScheduleTaskType = ScheduleContracts.ScheduleTaskType;
type SchedulePriority = ScheduleContracts.SchedulePriority;

/**
 * Prisma Schedule Task Repository Implementation
 * 调度任务的 Prisma 仓储实现
 */
export class PrismaScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapScheduleTaskToDTO(task: any): ScheduleTaskResponseDto {
    return {
      uuid: task.uuid,
      name: task.title, // 数据库字段是 title
      description: task.description,
      taskType: task.taskType as ScheduleTaskType,
      payload: task.payload, // Prisma 自动解析 JSON
      scheduledTime: task.scheduledTime,
      recurrence: task.recurrence, // Prisma 自动解析 JSON
      priority: task.priority as SchedulePriority,
      status: task.status as ScheduleStatus,
      alertConfig: task.alertConfig, // Prisma 自动解析 JSON
      createdBy: task.accountUuid, // 数据库字段是 accountUuid
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      nextExecutionTime: task.nextScheduledAt, // 数据库字段是 nextScheduledAt
      executionCount: task.executionCount,
      maxRetries: 3, // 默认值，数据库中没有这个字段
      currentRetries: task.failureCount || 0, // 使用 failureCount 字段
      timeoutSeconds: 300, // 默认值，数据库中没有这个字段
      tags: task.tags || [], // Prisma 自动处理数组
      enabled: task.enabled,
    };
  }

  private mapScheduleExecutionToLogDTO(execution: any): ScheduleTaskLogResponseDto {
    return {
      id: execution.uuid,
      taskUuid: execution.taskUuid,
      executedAt: execution.executedAt,
      status: execution.status as ScheduleStatus,
      result: execution.result ? JSON.parse(execution.result) : undefined,
      error: execution.error,
      duration: execution.duration,
      retryCount: execution.retryCount,
    };
  }

  // ===== IScheduleTaskRepository 接口实现 =====

  async create(
    request: CreateScheduleTaskRequestDto,
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.scheduleTask.create({
      data: {
        uuid,
        accountUuid: createdBy, // 将 createdBy 作为 accountUuid
        title: request.title || request.name, // 数据库字段是 title
        description: request.description,
        taskType: request.taskType,
        payload: request.payload, // Prisma 自动处理 JSON
        scheduledTime: request.scheduledTime,
        recurrence: request.recurrence, // Prisma 自动处理 JSON
        priority: request.priority,
        status: 'pending', // 数据库默认值是小写
        alertConfig: request.alertConfig, // Prisma 自动处理 JSON
        tags: request.tags || [], // Prisma 自动处理数组
        enabled: request.enabled !== false, // 默认启用
        nextScheduledAt: request.scheduledTime, // 数据库字段是 nextScheduledAt
      },
    });

    return this.mapScheduleTaskToDTO(created);
  }

  async findByUuid(uuid: string): Promise<ScheduleTaskResponseDto | null> {
    const task = await this.prisma.scheduleTask.findUnique({
      where: { uuid },
    });

    return task ? this.mapScheduleTaskToDTO(task) : null;
  }

  async findMany(query: IScheduleTaskQuery): Promise<ScheduleTaskListResponseDto> {
    const where: any = {};

    // 构建查询条件
    if (query.taskType && query.taskType.length > 0) {
      where.taskType = { in: query.taskType };
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    if (query.priority && query.priority.length > 0) {
      where.priority = { in: query.priority };
    }

    if (query.createdBy) {
      where.accountUuid = query.createdBy;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    if (query.timeRange) {
      where.scheduledTime = {
        gte: query.timeRange.start,
        lte: query.timeRange.end,
      };
    }

    if (query.tags && query.tags.length > 0) {
      // 在 JSON 数组中搜索标签
      where.tags = {
        contains: JSON.stringify(query.tags).slice(1, -1), // 移除方括号进行部分匹配
      };
    }

    // 排序
    const orderBy: any = {};
    if (query.sorting) {
      orderBy[query.sorting.field] = query.sorting.order;
    } else {
      orderBy.scheduledTime = 'asc'; // 默认按调度时间升序
    }

    // 分页
    const offset = query.pagination?.offset || 0;
    const limit = query.pagination?.limit || 50;

    const [tasks, total] = await Promise.all([
      this.prisma.scheduleTask.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.scheduleTask.count({ where }),
    ]);

    return {
      tasks: tasks.map((task) => this.mapScheduleTaskToDTO(task)),
      total,
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    };
  }

  async update(
    uuid: string,
    request: UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    const updateData: any = { updatedAt: new Date() };

    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.scheduledTime !== undefined) updateData.scheduledTime = request.scheduledTime;
    if (request.priority !== undefined) updateData.priority = request.priority;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.maxRetries !== undefined) updateData.maxRetries = request.maxRetries;
    if (request.timeoutSeconds !== undefined) updateData.timeoutSeconds = request.timeoutSeconds;
    if (request.enabled !== undefined) updateData.enabled = request.enabled;

    if (request.recurrence !== undefined) {
      updateData.recurrence = request.recurrence ? JSON.stringify(request.recurrence) : null;
    }

    if (request.alertConfig !== undefined) {
      updateData.alertConfig = JSON.stringify(request.alertConfig);
    }

    if (request.tags !== undefined) {
      updateData.tags = JSON.stringify(request.tags);
    }

    const updated = await this.prisma.scheduleTask.update({
      where: { uuid },
      data: updateData,
    });

    return this.mapScheduleTaskToDTO(updated);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.delete({
      where: { uuid },
    });
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.scheduleTask.deleteMany({
      where: {
        uuid: { in: uuids },
      },
    });
  }

  async enable(uuid: string): Promise<ScheduleTaskResponseDto> {
    return this.update(uuid, { enabled: true });
  }

  async disable(uuid: string): Promise<ScheduleTaskResponseDto> {
    return this.update(uuid, { enabled: false });
  }

  async pause(uuid: string): Promise<ScheduleTaskResponseDto> {
    return this.update(uuid, { status: 'PAUSED' as ScheduleStatus });
  }

  async resume(uuid: string): Promise<ScheduleTaskResponseDto> {
    return this.update(uuid, { status: 'PENDING' as ScheduleStatus });
  }

  async updateStatus(uuid: string, status: ScheduleStatus): Promise<ScheduleTaskResponseDto> {
    return this.update(uuid, { status });
  }

  async findUpcomingTasks(
    withinMinutes: number,
    limit?: number,
  ): Promise<UpcomingTasksResponseDto> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: { in: ['PENDING'] },
        scheduledTime: {
          gte: now,
          lte: futureTime,
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
      take: limit || 100,
    });

    return {
      tasks: tasks.map((task) => ({
        uuid: task.uuid,
        name: task.title,
        taskType: task.taskType as ScheduleTaskType,
        scheduledTime: task.scheduledTime,
        priority: task.priority as SchedulePriority,
        alertConfig: JSON.parse(task.alertConfig),
        minutesUntil: Math.floor((task.scheduledTime.getTime() - now.getTime()) / (1000 * 60)),
      })),
      withinHours: withinMinutes / 60,
      queryTime: now,
    };
  }

  async findExecutableTasks(limit?: number): Promise<ScheduleTaskResponseDto[]> {
    const now = new Date();

    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: 'PENDING',
        scheduledTime: {
          lte: now,
        },
      },
      orderBy: [
        { priority: 'desc' }, // 高优先级优先
        { scheduledTime: 'asc' }, // 早调度的优先
      ],
      take: limit || 50,
    });

    return tasks.map((task) => this.mapScheduleTaskToDTO(task));
  }

  async findTimeoutTasks(): Promise<ScheduleTaskResponseDto[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        status: 'RUNNING',
        // 这里可以添加超时逻辑，比如根据 updatedAt + timeoutSeconds 判断
      },
    });

    const now = new Date();
    const timeoutTasks = tasks.filter((task) => {
      const timeoutTime = new Date(task.updatedAt.getTime() + 30 * 1000); // 默认超时30秒
      return now > timeoutTime;
    });

    return timeoutTasks.map((task) => this.mapScheduleTaskToDTO(task));
  }

  async findRetryTasks(): Promise<ScheduleTaskResponseDto[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        status: 'FAILED',
        enabled: true,
      },
    });

    const retryTasks = tasks.filter((task) => task.failureCount < 3); // 最大重试3次

    return retryTasks.map((task) => this.mapScheduleTaskToDTO(task));
  }

  async findByUser(
    userId: string,
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto> {
    const fullQuery: IScheduleTaskQuery = {
      ...query,
      createdBy: userId,
    };

    return this.findMany(fullQuery);
  }

  async findByTaskType(
    taskType: ScheduleTaskType,
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto> {
    const fullQuery: IScheduleTaskQuery = {
      ...query,
      taskType: [taskType],
    };

    return this.findMany(fullQuery);
  }

  async findByStatus(
    status: ScheduleStatus[],
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto> {
    const fullQuery: IScheduleTaskQuery = {
      ...query,
      status,
    };

    return this.findMany(fullQuery);
  }

  async findByTags(
    tags: string[],
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto> {
    const fullQuery: IScheduleTaskQuery = {
      ...query,
      tags,
    };

    return this.findMany(fullQuery);
  }

  async incrementExecutionCount(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.update({
      where: { uuid },
      data: {
        executionCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async incrementRetryCount(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.update({
      where: { uuid },
      data: {
        currentRetries: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async updateNextExecutionTime(uuid: string, nextTime: Date | null): Promise<void> {
    await this.prisma.scheduleTask.update({
      where: { uuid },
      data: {
        nextExecutionTime: nextTime,
        updatedAt: new Date(),
      },
    });
  }

  async recordExecutionResult(result: ScheduleExecutionResultResponseDto): Promise<void> {
    const executionUuid = randomUUID();

    // 获取任务信息以获取 accountUuid
    const task = await this.prisma.scheduleTask.findUnique({
      where: { uuid: result.taskUuid },
      select: { accountUuid: true },
    });

    if (!task) {
      throw new Error(`Task with UUID ${result.taskUuid} not found`);
    }

    await this.prisma.scheduleExecution.create({
      data: {
        uuid: executionUuid,
        taskUuid: result.taskUuid,
        accountUuid: task.accountUuid,
        executedAt: result.executedAt,
        status: result.status,
        result: result.result ? JSON.stringify(result.result) : null,
        error: result.error,
        duration: result.duration,
        nextExecutionTime: result.nextExecutionTime,
      },
    });

    // 更新任务的下次执行时间
    if (result.nextExecutionTime) {
      await this.updateNextExecutionTime(result.taskUuid, result.nextExecutionTime);
    }
  }

  async findExecutionHistory(
    taskUuid: string,
    pagination?: { offset: number; limit: number },
  ): Promise<{
    logs: ScheduleTaskLogResponseDto[];
    total: number;
  }> {
    const offset = pagination?.offset || 0;
    const limit = pagination?.limit || 50;

    const [executions, total] = await Promise.all([
      this.prisma.scheduleExecution.findMany({
        where: { taskUuid },
        orderBy: { executedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.scheduleExecution.count({
        where: { taskUuid },
      }),
    ]);

    return {
      logs: executions.map((execution) => this.mapScheduleExecutionToLogDTO(execution)),
      total,
    };
  }

  async getStatistics(userId?: string): Promise<IScheduleTaskStatistics> {
    const where = userId ? { accountUuid: userId } : {};

    const [
      totalTasks,
      activeTasks,
      completedTasks,
      failedTasks,
      statusStats,
      typeStats,
      priorityStats,
    ] = await Promise.all([
      this.prisma.scheduleTask.count({ where }),
      this.prisma.scheduleTask.count({
        where: { ...where, status: { in: ['PENDING', 'RUNNING'] } },
      }),
      this.prisma.scheduleTask.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.scheduleTask.count({ where: { ...where, status: 'FAILED' } }),
      this.getStatusStatistics(where),
      this.getTypeStatistics(where),
      this.getPriorityStatistics(where),
    ]);

    // 计算平均执行时间（需要从执行历史中计算）
    const avgExecution = await this.prisma.scheduleExecution.aggregate({
      where: userId ? { task: { accountUuid: userId } } : {},
      _avg: {
        duration: true,
      },
    });

    const averageExecutionTime = avgExecution._avg.duration || 0;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      failedTasks,
      byStatus: statusStats,
      byType: typeStats,
      byPriority: priorityStats,
      averageExecutionTime,
      successRate,
    };
  }

  private async getStatusStatistics(where: any): Promise<Record<ScheduleStatus, number>> {
    const stats = await this.prisma.scheduleTask.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const result = {} as Record<ScheduleStatus, number>;
    stats.forEach((stat) => {
      result[stat.status as ScheduleStatus] = stat._count;
    });

    return result;
  }

  private async getTypeStatistics(where: any): Promise<Record<ScheduleTaskType, number>> {
    const stats = await this.prisma.scheduleTask.groupBy({
      by: ['taskType'],
      where,
      _count: true,
    });

    const result = {} as Record<ScheduleTaskType, number>;
    stats.forEach((stat) => {
      result[stat.taskType as ScheduleTaskType] = stat._count;
    });

    return result;
  }

  private async getPriorityStatistics(where: any): Promise<Record<SchedulePriority, number>> {
    const stats = await this.prisma.scheduleTask.groupBy({
      by: ['priority'],
      where,
      _count: true,
    });

    const result = {} as Record<SchedulePriority, number>;
    stats.forEach((stat) => {
      result[stat.priority as SchedulePriority] = stat._count;
    });

    return result;
  }

  async cleanupExpiredTasks(beforeDate: Date): Promise<number> {
    const result = await this.prisma.scheduleTask.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        updatedAt: { lt: beforeDate },
      },
    });

    return result.count;
  }

  async cleanupExecutionLogs(beforeDate: Date, keepCount?: number): Promise<number> {
    // 如果指定了保留数量，需要更复杂的逻辑
    const result = await this.prisma.scheduleExecution.deleteMany({
      where: {
        executedAt: { lt: beforeDate },
      },
    });

    return result.count;
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.scheduleTask.count({
      where: { uuid },
    });

    return count > 0;
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.scheduleTask.count({
      where: { accountUuid: userId },
    });
  }

  async countActiveTasks(): Promise<number> {
    return this.prisma.scheduleTask.count({
      where: {
        enabled: true,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });
  }

  async exportTasks(query: IScheduleTaskQuery): Promise<ScheduleTaskResponseDto[]> {
    const result = await this.findMany(query);
    return result.tasks;
  }

  async importTasks(
    tasks: CreateScheduleTaskRequestDto[],
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto[]> {
    const results: ScheduleTaskResponseDto[] = [];

    for (const taskData of tasks) {
      const created = await this.create(taskData, createdBy);
      results.push(created);
    }

    return results;
  }

  // 这个方法在原接口中没有定义，但在 domain service 中需要
  async execute(uuid: string, force?: boolean): Promise<any> {
    // 这里应该实际执行调度任务
    // 为了简化，我们只更新状态为 RUNNING
    await this.updateStatus(uuid, 'RUNNING');

    // 实际的执行逻辑应该在应用服务中处理
    return { executed: true, taskUuid: uuid };
  }
}
