/**
 * Task Instance Application Service
 * 任务实例应用服务
 */

import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { PrismaTaskInstanceRepository } from '../../infrastructure/repositories/prisma/PrismaTaskInstanceRepository';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 使用类型别名来简化类型引用
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;
type TaskInstanceListResponse = TaskContracts.TaskInstanceListResponse;

export class TaskInstanceApplicationService {
  private readonly repository: PrismaTaskInstanceRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new PrismaTaskInstanceRepository(prisma);
  }

  // ===== 基本 CRUD 操作 =====

  async getById(uuid: string): Promise<TaskInstanceDTO | null> {
    return await this.repository.findById(uuid);
  }

  async getAllByAccount(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'scheduledDate' | 'importance' | 'urgency';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskInstanceListResponse> {
    return await this.repository.findByAccountUuid(accountUuid, options);
  }

  async getByTemplate(templateUuid: string): Promise<TaskInstanceListResponse> {
    return await this.repository.findByTemplateUuid(templateUuid);
  }

  async create(accountUuid: string, request: CreateTaskInstanceRequest): Promise<string> {
    const uuid = randomUUID();

    // 构建完整的 TaskInstanceDTO
    const taskInstance: TaskInstanceDTO = {
      uuid,
      templateUuid: request.templateUuid,
      accountUuid,
      title: request.title || 'Untitled Task',
      description: request.description || '',
      timeConfig: {
        timeType: request.timeConfig.timeType,
        scheduledDate: request.timeConfig.scheduledDate,
        startTime: request.timeConfig.startTime,
        endTime: request.timeConfig.endTime,
        estimatedDuration: request.timeConfig.estimatedDuration,
        timezone: request.timeConfig.timezone,
      },
      reminderStatus: {
        enabled: false,
        status: 'pending',
        snoozeCount: 0,
      },
      execution: {
        status: 'pending',
        progressPercentage: 0,
      },
      properties: {
        importance: request.properties?.importance || ImportanceLevel.Moderate,
        urgency: request.properties?.urgency || UrgencyLevel.Medium,
        location: request.properties?.location,
        tags: request.properties?.tags || [],
      },
      lifecycle: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        events: [
          {
            type: 'created',
            timestamp: new Date().toISOString(),
          },
        ],
      },
      goalLinks: request.goalLinks || [],
    };

    await this.repository.save(taskInstance);
    return uuid;
  }

  async update(uuid: string, request: UpdateTaskInstanceRequest): Promise<void> {
    const existing = await this.repository.findById(uuid);
    if (!existing) {
      throw new Error(`Task instance with uuid ${uuid} not found`);
    }

    // 合并更新数据
    const updatedInstance: TaskInstanceDTO = {
      ...existing,
      title: request.title || existing.title,
      description: request.description !== undefined ? request.description : existing.description,
      timeConfig: {
        ...existing.timeConfig,
        ...request.timeConfig,
        timeType: request.timeConfig?.timeType || existing.timeConfig.timeType,
        scheduledDate: request.timeConfig?.scheduledDate || existing.timeConfig.scheduledDate,
        timezone: request.timeConfig?.timezone || existing.timeConfig.timezone,
      },
      properties: {
        ...existing.properties,
        importance: request.properties?.importance || existing.properties.importance,
        urgency: request.properties?.urgency || existing.properties.urgency,
        location:
          request.properties?.location !== undefined
            ? request.properties.location
            : existing.properties.location,
        tags: request.properties?.tags || existing.properties.tags,
      },
      goalLinks: request.goalLinks || existing.goalLinks,
      lifecycle: {
        ...existing.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.repository.save(updatedInstance);
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete(uuid);
  }

  // ===== 查询操作 =====

  async getByStatus(
    accountUuid: string,
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
    options?: { limit?: number; offset?: number },
  ): Promise<TaskInstanceListResponse> {
    return await this.repository.findByStatus(accountUuid, status, options);
  }

  async getByDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
    options?: { limit?: number; offset?: number },
  ): Promise<TaskInstanceListResponse> {
    return await this.repository.findByDateRange(accountUuid, startDate, endDate, options);
  }

  async getToday(
    accountUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<TaskInstanceListResponse> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await this.repository.findByDateRange(accountUuid, startOfDay, endOfDay, options);
  }

  async getOverdue(
    accountUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<TaskInstanceListResponse> {
    return await this.repository.findByStatus(accountUuid, 'overdue', options);
  }

  // ===== 统计操作 =====

  async getCountByStatus(accountUuid: string): Promise<Record<string, number>> {
    const statuses = ['pending', 'inProgress', 'completed', 'cancelled', 'overdue'];
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status] = await this.repository.count(accountUuid, status);
    }

    return counts;
  }

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.repository.count(accountUuid);
  }

  async getTemplateInstanceCount(templateUuid: string): Promise<number> {
    return await this.repository.countByTemplate(templateUuid);
  }

  // ===== 批量操作 =====

  async batchDelete(uuids: string[]): Promise<void> {
    await this.repository.deleteBatch(uuids);
  }

  async batchUpdateStatus(
    uuids: string[],
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
  ): Promise<void> {
    for (const uuid of uuids) {
      const instance = await this.repository.findById(uuid);
      if (instance) {
        instance.execution.status = status;
        instance.lifecycle.updatedAt = new Date().toISOString();

        // 添加状态变更事件
        const eventType =
          status === 'inProgress'
            ? 'started'
            : status === 'completed'
              ? 'completed'
              : status === 'cancelled'
                ? 'cancelled'
                : 'created';

        instance.lifecycle.events.push({
          type: eventType as any,
          timestamp: new Date().toISOString(),
        });

        await this.repository.save(instance);
      }
    }
  }

  // ===== 状态管理 =====

  async start(uuid: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.execution.status = 'inProgress';
      instance.execution.actualStartTime = new Date().toISOString();
      instance.lifecycle.updatedAt = new Date().toISOString();
      instance.lifecycle.events.push({
        type: 'started',
        timestamp: new Date().toISOString(),
      });
      await this.repository.save(instance);
    }
  }

  async complete(uuid: string, notes?: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.execution.status = 'completed';
      instance.execution.actualEndTime = new Date().toISOString();
      instance.execution.progressPercentage = 100;
      instance.lifecycle.updatedAt = new Date().toISOString();

      if (notes) {
        instance.execution.notes = notes;
      }

      // 计算实际持续时间
      if (instance.execution.actualStartTime) {
        const startTime = new Date(instance.execution.actualStartTime);
        const endTime = new Date(instance.execution.actualEndTime!);
        instance.execution.actualDuration = Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        );
      }

      instance.lifecycle.events.push({
        type: 'completed',
        timestamp: new Date().toISOString(),
        note: notes,
      });

      await this.repository.save(instance);
    }
  }

  async cancel(uuid: string, reason?: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.execution.status = 'cancelled';
      instance.lifecycle.updatedAt = new Date().toISOString();

      if (reason) {
        instance.execution.notes = reason;
      }

      instance.lifecycle.events.push({
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        note: reason,
      });

      await this.repository.save(instance);
    }
  }

  async markOverdue(uuid: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.execution.status = 'overdue';
      instance.lifecycle.updatedAt = new Date().toISOString();
      instance.lifecycle.events.push({
        type: 'created', // 没有overdue事件类型，使用created
        timestamp: new Date().toISOString(),
        note: 'Marked as overdue',
      });
      await this.repository.save(instance);
    }
  }

  async updateProgress(uuid: string, progressPercentage: number): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance && progressPercentage >= 0 && progressPercentage <= 100) {
      instance.execution.progressPercentage = progressPercentage;
      instance.lifecycle.updatedAt = new Date().toISOString();
      await this.repository.save(instance);
    }
  }

  // ===== 业务逻辑方法 =====

  async exists(uuid: string): Promise<boolean> {
    return await this.repository.exists(uuid);
  }

  async addNotes(uuid: string, notes: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.execution.notes = notes;
      instance.lifecycle.updatedAt = new Date().toISOString();
      await this.repository.save(instance);
    }
  }

  async reschedule(uuid: string, newScheduledDate: string, reason?: string): Promise<void> {
    const instance = await this.repository.findById(uuid);
    if (instance) {
      instance.timeConfig.scheduledDate = newScheduledDate;
      instance.lifecycle.updatedAt = new Date().toISOString();
      instance.lifecycle.events.push({
        type: 'rescheduled',
        timestamp: new Date().toISOString(),
        note: reason,
      });
      await this.repository.save(instance);
    }
  }
}
