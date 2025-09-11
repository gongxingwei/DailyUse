/**
 * Prisma Task Instance Repository Implementation
 * Prisma任务实例仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type TaskInstanceListResponse = TaskContracts.TaskInstanceListResponse;
type TaskQueryParamsDTO = TaskContracts.TaskQueryParamsDTO;

export class PrismaTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapTaskInstanceToDTO(instance: any): TaskInstanceDTO {
    return {
      uuid: instance.uuid,
      templateUuid: instance.templateUuid,
      accountUuid: instance.accountUuid,
      title: instance.title,
      description: instance.description,
      timeConfig: {
        timeType: instance.timeType as TaskContracts.TaskTimeType,
        scheduledDate: instance.scheduledDate.toISOString(),
        startTime: instance.startTime,
        endTime: instance.endTime,
        estimatedDuration: instance.estimatedDuration,
        timezone: instance.timezone,
      },
      reminderStatus: {
        enabled: instance.reminderEnabled,
        status: instance.reminderStatus as 'pending' | 'triggered' | 'dismissed' | 'snoozed',
        scheduledTime: instance.reminderScheduledTime?.toISOString(),
        triggeredAt: instance.reminderTriggeredAt?.toISOString(),
        snoozeCount: instance.reminderSnoozeCount,
        snoozeUntil: instance.reminderSnoozeUntil?.toISOString(),
      },
      execution: {
        status: instance.executionStatus as
          | 'pending'
          | 'inProgress'
          | 'completed'
          | 'cancelled'
          | 'overdue',
        actualStartTime: instance.actualStartTime?.toISOString(),
        actualEndTime: instance.actualEndTime?.toISOString(),
        actualDuration: instance.actualDuration,
        progressPercentage: instance.progressPercentage,
        notes: instance.executionNotes,
      },
      properties: {
        importance: instance.importance as ImportanceLevel,
        urgency: instance.urgency as UrgencyLevel,
        location: instance.location,
        tags: instance.tags ? JSON.parse(instance.tags) : [],
      },
      lifecycle: {
        createdAt: instance.createdAt.toISOString(),
        updatedAt: instance.updatedAt.toISOString(),
        events: instance.lifecycleEvents ? JSON.parse(instance.lifecycleEvents) : [],
      },
      goalLinks: instance.goalLinks ? JSON.parse(instance.goalLinks) : [],
    };
  }

  // ===== ITaskInstanceRepository 接口实现 =====

  async findById(uuid: string): Promise<TaskInstanceDTO | null> {
    const instance = await this.prisma.taskInstance.findUnique({
      where: { uuid },
    });

    return instance ? this.mapTaskInstanceToDTO(instance) : null;
  }

  async findByTemplateUuid(
    templateUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'scheduledDate';
    const sortOrder = options?.sortOrder || 'desc';

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: { templateUuid },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({ where: { templateUuid } }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt' | 'importance' | 'urgency';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'scheduledDate';
    const sortOrder = options?.sortOrder || 'desc';

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: { accountUuid },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({ where: { accountUuid } }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async query(queryParams: TaskQueryParamsDTO): Promise<TaskInstanceListResponse> {
    const limit = queryParams.limit || 50;
    const offset = queryParams.offset || 0;
    const sortBy = queryParams.sortBy || 'scheduledDate';
    const sortOrder = queryParams.sortOrder || 'desc';

    const where: any = {};

    if (queryParams.templateUuid) {
      where.templateUuid = queryParams.templateUuid;
    }

    if (queryParams.status && queryParams.status.length > 0) {
      where.executionStatus = { in: queryParams.status };
    }

    if (queryParams.importance && queryParams.importance.length > 0) {
      where.importance = { in: queryParams.importance };
    }

    if (queryParams.urgency && queryParams.urgency.length > 0) {
      where.urgency = { in: queryParams.urgency };
    }

    if (queryParams.tags && queryParams.tags.length > 0) {
      // 简化实现：检查tags字段包含任一标签
      where.tags = {
        contains: queryParams.tags[0],
      };
    }

    if (queryParams.dateRange) {
      where.scheduledDate = {
        gte: new Date(queryParams.dateRange.start),
        lte: new Date(queryParams.dateRange.end),
      };
    }

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findByDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const where: any = {
      accountUuid,
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.status && options.status.length > 0) {
      where.executionStatus = { in: options.status };
    }

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findByStatus(
    accountUuid: string,
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: {
          accountUuid,
          executionStatus: status,
        },
        orderBy: { scheduledDate: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          executionStatus: status,
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findOverdue(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const now = new Date();

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: {
          accountUuid,
          scheduledDate: { lt: now },
          executionStatus: { in: ['pending', 'inProgress'] },
        },
        orderBy: { scheduledDate: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({
        where: {
          accountUuid,
          scheduledDate: { lt: now },
          executionStatus: { in: ['pending', 'inProgress'] },
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async findToday(
    accountUuid: string,
    timezone: string,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
    },
  ): Promise<TaskInstanceListResponse> {
    // 简化实现：使用UTC时间
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const where: any = {
      accountUuid,
      scheduledDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    };

    if (options?.status && options.status.length > 0) {
      where.executionStatus = { in: options.status };
    }

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
      }),
      this.prisma.taskInstance.count({ where }),
    ]);

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page: 1,
      limit: total,
      hasMore: false,
    };
  }

  async findThisWeek(
    accountUuid: string,
    timezone: string,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
    },
  ): Promise<TaskInstanceListResponse> {
    // 简化实现：使用UTC时间
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay(),
    );
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + (7 - today.getDay()),
    );

    const where: any = {
      accountUuid,
      scheduledDate: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    };

    if (options?.status && options.status.length > 0) {
      where.executionStatus = { in: options.status };
    }

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
      }),
      this.prisma.taskInstance.count({ where }),
    ]);

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page: 1,
      limit: total,
      hasMore: false,
    };
  }

  async findPendingReminders(
    beforeTime: Date,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskInstanceListResponse> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [instances, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: {
          reminderEnabled: true,
          reminderStatus: 'pending',
          reminderScheduledTime: { lte: beforeTime },
        },
        orderBy: { reminderScheduledTime: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.taskInstance.count({
        where: {
          reminderEnabled: true,
          reminderStatus: 'pending',
          reminderScheduledTime: { lte: beforeTime },
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < total;

    return {
      instances: instances.map((instance) => this.mapTaskInstanceToDTO(instance)),
      total,
      page,
      limit,
      hasMore,
    };
  }

  async save(taskInstance: TaskInstanceDTO): Promise<void> {
    const data = {
      templateUuid: taskInstance.templateUuid,
      accountUuid: taskInstance.accountUuid,
      title: taskInstance.title,
      description: taskInstance.description,
      // 时间配置展开
      timeType: taskInstance.timeConfig.timeType,
      scheduledDate: new Date(taskInstance.timeConfig.scheduledDate),
      startTime: taskInstance.timeConfig.startTime,
      endTime: taskInstance.timeConfig.endTime,
      estimatedDuration: taskInstance.timeConfig.estimatedDuration,
      timezone: taskInstance.timeConfig.timezone,
      // 提醒状态展开
      reminderEnabled: taskInstance.reminderStatus.enabled,
      reminderStatus: taskInstance.reminderStatus.status,
      reminderScheduledTime: taskInstance.reminderStatus.scheduledTime
        ? new Date(taskInstance.reminderStatus.scheduledTime)
        : null,
      reminderTriggeredAt: taskInstance.reminderStatus.triggeredAt
        ? new Date(taskInstance.reminderStatus.triggeredAt)
        : null,
      reminderSnoozeCount: taskInstance.reminderStatus.snoozeCount,
      reminderSnoozeUntil: taskInstance.reminderStatus.snoozeUntil
        ? new Date(taskInstance.reminderStatus.snoozeUntil)
        : null,
      // 执行状态展开
      executionStatus: taskInstance.execution.status,
      actualStartTime: taskInstance.execution.actualStartTime
        ? new Date(taskInstance.execution.actualStartTime)
        : null,
      actualEndTime: taskInstance.execution.actualEndTime
        ? new Date(taskInstance.execution.actualEndTime)
        : null,
      actualDuration: taskInstance.execution.actualDuration,
      progressPercentage: taskInstance.execution.progressPercentage,
      executionNotes: taskInstance.execution.notes,
      // 属性展开
      importance: taskInstance.properties.importance,
      urgency: taskInstance.properties.urgency,
      location: taskInstance.properties.location,
      tags: JSON.stringify(taskInstance.properties.tags),
      // 生命周期事件
      lifecycleEvents: JSON.stringify(taskInstance.lifecycle.events),
      // 目标关联
      goalLinks: JSON.stringify(taskInstance.goalLinks || []),
    };

    await this.prisma.taskInstance.upsert({
      where: { uuid: taskInstance.uuid },
      update: data,
      create: {
        uuid: taskInstance.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskInstance.delete({
      where: { uuid },
    });
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: {
        uuid: { in: uuids },
      },
    });
  }

  async count(accountUuid: string, status?: string): Promise<number> {
    const where: any = { accountUuid };
    if (status) {
      where.executionStatus = status;
    }

    return await this.prisma.taskInstance.count({ where });
  }

  async countByTemplate(templateUuid: string): Promise<number> {
    return await this.prisma.taskInstance.count({
      where: { templateUuid },
    });
  }

  async countCompletedByTemplate(templateUuid: string): Promise<number> {
    return await this.prisma.taskInstance.count({
      where: {
        templateUuid,
        executionStatus: 'completed',
      },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.taskInstance.count({
      where: { uuid },
    });

    return count > 0;
  }
}
