/**
 * Task Template Application Service
 * 任务模板应用服务
 */

import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { PrismaTaskTemplateRepository } from '../../infrastructure/repositories/prisma/PrismaTaskTemplateRepository';
import { TaskInstanceApplicationService } from './TaskInstanceApplicationService';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 类型别名
type TaskTemplateDTO = TaskContracts.TaskTemplateDTO;
type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;
type TaskTemplateListResponse = TaskContracts.TaskTemplateListResponse;

export class TaskTemplateApplicationService {
  private readonly repository: PrismaTaskTemplateRepository;
  private readonly instanceService: TaskInstanceApplicationService;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new PrismaTaskTemplateRepository(prisma);
    this.instanceService = new TaskInstanceApplicationService(prisma);
  }

  // ===== 基本 CRUD 操作 =====

  async getById(uuid: string): Promise<TaskTemplateDTO | null> {
    return await this.repository.findById(uuid);
  }

  async getAllByAccount(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskTemplateListResponse> {
    return await this.repository.findByAccountUuid(accountUuid, options);
  }

  async create(accountUuid: string, request: CreateTaskTemplateRequest): Promise<string> {
    const uuid = randomUUID();

    // 构建完整的 TaskTemplateDTO
    const taskTemplate: TaskTemplateDTO = {
      uuid,
      accountUuid,
      title: request.title,
      description: request.description || '',
      timeConfig: {
        time: {
          timeType: request.timeConfig.time.timeType,
          startTime: request.timeConfig.time.startTime,
          endTime: request.timeConfig.time.endTime,
        },
        date: {
          startDate: request.timeConfig.date.startDate,
          endDate: request.timeConfig.date.endDate,
        },
        schedule: {
          mode: request.timeConfig.schedule.mode,
          intervalDays: request.timeConfig.schedule.intervalDays,
          weekdays: request.timeConfig.schedule.weekdays,
          monthDays: request.timeConfig.schedule.monthDays,
        },
        timezone: request.timeConfig.timezone || 'UTC',
      },
      reminderConfig: {
        enabled: request.reminderConfig.enabled,
        minutesBefore: request.reminderConfig.minutesBefore,
        methods: request.reminderConfig.methods || [],
      },
      properties: {
        importance: request.properties.importance || ImportanceLevel.Moderate,
        urgency: request.properties.urgency || UrgencyLevel.Medium,
        location: request.properties.location,
        tags: request.properties.tags || [],
      },
      lifecycle: {
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      stats: {
        totalInstances: 0,
        completedInstances: 0,
        completionRate: 0,
        lastInstanceDate: undefined,
      },
      goalLinks: request.goalLinks || [],
    };

    await this.repository.save(taskTemplate);
    return uuid;
  }

  async update(uuid: string, request: UpdateTaskTemplateRequest): Promise<void> {
    const existing = await this.repository.findById(uuid);
    if (!existing) {
      throw new Error(`Task template with uuid ${uuid} not found`);
    }

    // 合并更新数据
    const updatedTemplate: TaskTemplateDTO = {
      ...existing,
      title: request.title || existing.title,
      description: request.description !== undefined ? request.description : existing.description,
      timeConfig: {
        time: {
          ...existing.timeConfig.time,
          ...request.timeConfig?.time,
        },
        date: {
          ...existing.timeConfig.date,
          ...request.timeConfig?.date,
        },
        schedule: {
          ...existing.timeConfig.schedule,
          ...request.timeConfig?.schedule,
        },
        timezone: request.timeConfig?.timezone || existing.timeConfig.timezone,
      },
      reminderConfig: {
        ...existing.reminderConfig,
        ...request.reminderConfig,
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

    await this.repository.save(updatedTemplate);
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete(uuid);
  }

  // ===== 查询操作 =====

  async getByStatus(
    accountUuid: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
    options?: { limit?: number; offset?: number },
  ): Promise<TaskTemplateListResponse> {
    return await this.repository.findByStatus(accountUuid, status, options);
  }

  async search(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<TaskTemplateListResponse> {
    // 简化版搜索实现，先获取所有模板然后在内存中过滤
    const allTemplates = await this.repository.findByAccountUuid(accountUuid, { limit: 1000 });
    const filtered = allTemplates.templates.filter(
      (template) =>
        template.title.toLowerCase().includes(query.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(query.toLowerCase())),
    );

    const startIndex = options?.offset || 0;
    const endIndex = startIndex + (options?.limit || filtered.length);

    return {
      templates: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page: Math.floor((options?.offset || 0) / (options?.limit || 10)) + 1,
      limit: options?.limit || 10,
      hasMore: endIndex < filtered.length,
    };
  }

  // ===== 统计操作 =====

  async getCount(accountUuid: string): Promise<number> {
    return await this.repository.count(accountUuid);
  }

  async getCountByStatus(accountUuid: string): Promise<Record<string, number>> {
    const statuses = ['draft', 'active', 'paused', 'completed', 'archived'];
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status] = await this.repository.count(accountUuid, status);
    }

    return counts;
  }

  async getStatistics(accountUuid: string): Promise<any> {
    const total = await this.repository.count(accountUuid);
    const statusCounts = await this.getCountByStatus(accountUuid);

    return {
      total,
      byStatus: statusCounts,
      activePercentage: total > 0 ? Math.round((statusCounts.active / total) * 100) : 0,
    };
  }

  // ===== 批量操作 =====

  async batchDelete(uuids: string[]): Promise<void> {
    await this.repository.deleteBatch(uuids);
  }

  async batchUpdateStatus(
    uuids: string[],
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
  ): Promise<void> {
    for (const uuid of uuids) {
      const template = await this.repository.findById(uuid);
      if (template) {
        template.lifecycle.status = status;
        template.lifecycle.updatedAt = new Date().toISOString();
        await this.repository.save(template);
      }
    }
  }

  // ===== 状态管理 =====

  async activate(uuid: string): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (!template) {
      throw new Error(`Task template with uuid ${uuid} not found`);
    }

    // 1. 更新模板状态为激活
    template.lifecycle.status = 'active';
    template.lifecycle.updatedAt = new Date().toISOString();
    await this.repository.save(template);

    // 2. 根据调度配置生成任务实例
    await this.generateInstancesFromTemplate(template);
  }

  async pause(uuid: string): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (template) {
      template.lifecycle.status = 'paused';
      template.lifecycle.updatedAt = new Date().toISOString();
      await this.repository.save(template);
    }
  }

  async archive(uuid: string): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (template) {
      template.lifecycle.status = 'archived';
      template.lifecycle.updatedAt = new Date().toISOString();
      await this.repository.save(template);
    }
  }

  // ===== 业务逻辑方法 =====

  async exists(uuid: string): Promise<boolean> {
    return await this.repository.exists(uuid);
  }

  async duplicate(uuid: string, newTitle?: string): Promise<string> {
    const template = await this.repository.findById(uuid);
    if (!template) {
      throw new Error(`Task template with uuid ${uuid} not found`);
    }

    const newUuid = randomUUID();
    const duplicatedTemplate: TaskTemplateDTO = {
      ...template,
      uuid: newUuid,
      title: newTitle || `${template.title} (Copy)`,
      stats: {
        totalInstances: 0,
        completedInstances: 0,
        completionRate: 0,
        lastInstanceDate: undefined,
      },
      lifecycle: {
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.repository.save(duplicatedTemplate);
    return newUuid;
  }

  async updateStatistics(uuid: string, stats: Partial<TaskTemplateDTO['stats']>): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (template) {
      template.stats = {
        ...template.stats,
        ...stats,
      };
      template.lifecycle.updatedAt = new Date().toISOString();
      await this.repository.save(template);
    }
  }

  // ===== 实例生成方法 =====

  /**
   * 根据模板生成任务实例
   * 基于模板的调度配置生成未来一段时间内的任务实例
   */
  private async generateInstancesFromTemplate(template: TaskTemplateDTO): Promise<void> {
    const now = new Date();
    const startDate = new Date(template.timeConfig.date.startDate);
    const endDate = template.timeConfig.date.endDate
      ? new Date(template.timeConfig.date.endDate)
      : null;

    // 如果模板的开始时间还没到，从开始时间开始
    const generateStartDate = startDate > now ? startDate : now;

    // 生成未来30天的实例（可以根据需要调整）
    const generateEndDate = new Date(generateStartDate);
    generateEndDate.setDate(generateEndDate.getDate() + 30);

    // 如果模板有结束时间且早于生成结束时间，使用模板的结束时间
    const finalEndDate = endDate && endDate < generateEndDate ? endDate : generateEndDate;

    const instances = this.calculateScheduledDates(template, generateStartDate, finalEndDate);

    // 为每个计算出的日期创建任务实例
    for (const scheduledDate of instances) {
      await this.createInstanceFromTemplate(template, scheduledDate);
    }

    // 更新模板统计信息
    await this.updateStatistics(template.uuid, {
      totalInstances: template.stats.totalInstances + instances.length,
      lastInstanceDate:
        instances.length > 0 ? instances[instances.length - 1].toISOString() : undefined,
    });
  }

  /**
   * 根据调度配置计算需要生成实例的日期
   */
  private calculateScheduledDates(
    template: TaskTemplateDTO,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    const dates: Date[] = [];
    const { schedule } = template.timeConfig;

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      switch (schedule.mode) {
        case 'once':
          // 单次任务，只在开始日期生成一次
          if (currentDate.toDateString() === startDate.toDateString()) {
            dates.push(new Date(currentDate));
          }
          currentDate = new Date(endDate); // 结束循环
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case 'daily':
          // 每日任务
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case 'weekly':
          // 每周任务
          if (schedule.weekdays && schedule.weekdays.length > 0) {
            const dayOfWeek = currentDate.getDay();
            if (schedule.weekdays.includes(dayOfWeek)) {
              dates.push(new Date(currentDate));
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case 'monthly':
          // 每月任务
          if (schedule.monthDays && schedule.monthDays.length > 0) {
            const dayOfMonth = currentDate.getDate();
            if (schedule.monthDays.includes(dayOfMonth)) {
              dates.push(new Date(currentDate));
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case 'intervalDays':
          // 间隔天数
          if (schedule.intervalDays && schedule.intervalDays > 0) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + schedule.intervalDays);
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          break;

        default:
          // 默认按日处理
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
          break;
      }
    }

    return dates;
  }

  /**
   * 从模板创建单个任务实例
   */
  private async createInstanceFromTemplate(
    template: TaskTemplateDTO,
    scheduledDate: Date,
  ): Promise<string> {
    const createRequest: TaskContracts.CreateTaskInstanceRequest = {
      templateUuid: template.uuid,
      title: template.title,
      description: template.description,
      timeConfig: {
        timeType: template.timeConfig.time.timeType,
        scheduledDate: scheduledDate.toISOString(),
        startTime: template.timeConfig.time.startTime,
        endTime: template.timeConfig.time.endTime,
        estimatedDuration: undefined, // 可以后续添加
        timezone: template.timeConfig.timezone,
      },
      properties: {
        importance: template.properties.importance,
        urgency: template.properties.urgency,
        location: template.properties.location,
        tags: [...template.properties.tags],
      },
      goalLinks: template.goalLinks ? [...template.goalLinks] : undefined,
    };

    return await this.instanceService.create(template.accountUuid, createRequest);
  }
}
