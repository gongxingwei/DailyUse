import type { TaskContracts } from '@dailyuse/contracts';
import {
  ImportanceLevel,
  UrgencyLevel,
  TaskContracts as TaskContractsEnums,
} from '@dailyuse/contracts';
import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  TaskTemplate,
  TaskInstance,
} from '@dailyuse/domain-server';
import { TaskDomainException } from '@dailyuse/domain-server';

/**
 * TaskTemplate 领域服务
 *
 * 职责：
 * - 处理 TaskTemplate 聚合根的核心业务逻辑
 * - 通过聚合根控制 TaskInstance 子实体
 * - 通过 ITaskTemplateRepository 和 ITaskInstanceRepository 接口操作数据
 * - 验证业务规则
 *
 * 设计原则（参考 GoalDomainService）：
 * - 依赖倒置：只依赖仓储接口
 * - 单一职责：只处理 TaskTemplate 聚合根相关的领域逻辑
 * - 聚合根控制：所有 TaskInstance 操作必须通过 TaskTemplate
 * - 与技术解耦：无任何基础设施细节
 * - 可移植：可安全移动到 @dailyuse/domain-server 包
 */
export class TaskTemplateDomainService {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  // ==================== TaskTemplate CRUD 操作 ====================

  /**
   * 创建任务模板聚合根
   * 业务规则：
   * 1. 标题必填
   * 2. 时间配置合理（结束日期 >= 开始日期）
   * 3. 提醒配置有效
   */
  async createTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    // 验证时间配置
    this.validateTimeConfig(request.timeConfig);

    // 动态导入实体类
    const { TaskTemplate } = await import('@dailyuse/domain-server');

    // 创建任务模板实体
    const templateEntity = TaskTemplate.create({
      accountUuid,
      title: request.title,
      description: request.description,
      timeConfig: {
        time: request.timeConfig.time,
        date: {
          startDate: new Date(request.timeConfig.date.startDate),
          endDate: request.timeConfig.date.endDate
            ? new Date(request.timeConfig.date.endDate)
            : undefined,
        },
        schedule: request.timeConfig.schedule,
        timezone: request.timeConfig.timezone,
      },
      reminderConfig: request.reminderConfig,
      properties: request.properties,
      goalLinks: request.goalLinks,
    });

    // 保存到仓储
    const templateDTO = templateEntity.toDTO();
    await this.templateRepository.save(templateDTO);

    // 返回响应
    return templateDTO;
  }

  /**
   * 获取任务模板详情
   */
  async getTemplateById(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse | null> {
    const templateDTO = await this.templateRepository.findById(templateUuid);
    if (!templateDTO || templateDTO.accountUuid !== accountUuid) {
      return null;
    }

    return templateDTO;
  }

  /**
   * 获取任务模板列表
   */
  async getTemplates(
    accountUuid: string,
    queryParams?: {
      status?: TaskContractsEnums.TaskTemplateStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskTemplateListResponse> {
    if (queryParams?.status) {
      return await this.templateRepository.findByStatus(
        accountUuid,
        queryParams.status as 'draft' | 'active' | 'paused' | 'completed' | 'archived',
        {
          limit: queryParams.limit,
          offset: queryParams.offset,
        },
      );
    }

    return await this.templateRepository.findByAccountUuid(accountUuid, {
      limit: queryParams?.limit,
      offset: queryParams?.offset,
    });
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    // 获取现有模板
    const existingTemplate = await this.templateRepository.findById(templateUuid);
    if (!existingTemplate || existingTemplate.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(templateUuid);
    }

    // 验证更新后的时间配置
    if (request.timeConfig) {
      this.validateTimeConfig(request.timeConfig);
    }

    // 合并更新数据
    const updatedTemplateDTO: TaskContracts.TaskTemplateDTO = {
      ...existingTemplate,
      ...(request.title !== undefined && { title: request.title }),
      ...(request.description !== undefined && { description: request.description }),
      ...(request.timeConfig !== undefined && { timeConfig: request.timeConfig }),
      ...(request.reminderConfig !== undefined && { reminderConfig: request.reminderConfig }),
      ...(request.properties !== undefined && {
        properties: { ...existingTemplate.properties, ...request.properties },
      }),
      ...(request.goalLinks !== undefined && { goalLinks: request.goalLinks }),
      lifecycle: {
        ...existingTemplate.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    // 保存更新后的模板
    await this.templateRepository.save(updatedTemplateDTO);

    return updatedTemplateDTO;
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(accountUuid: string, templateUuid: string): Promise<void> {
    const existingTemplate = await this.templateRepository.findById(templateUuid);
    if (!existingTemplate || existingTemplate.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(templateUuid);
    }

    await this.templateRepository.delete(templateUuid);
  }

  // ==================== TaskTemplate 状态管理 ====================

  /**
   * 激活任务模板
   */
  async activateTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.findById(templateUuid);
    if (!template || template.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(templateUuid);
    }

    const updatedTemplate: TaskContracts.TaskTemplateDTO = {
      ...template,
      lifecycle: {
        ...template.lifecycle,
        status: 'active' as const,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.templateRepository.save(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 停用任务模板
   */
  async pauseTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.findById(templateUuid);
    if (!template || template.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(templateUuid);
    }

    const updatedTemplate: TaskContracts.TaskTemplateDTO = {
      ...template,
      lifecycle: {
        ...template.lifecycle,
        status: 'paused' as const,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.templateRepository.save(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.findById(templateUuid);
    if (!template || template.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(templateUuid);
    }

    const updatedTemplate: TaskContracts.TaskTemplateDTO = {
      ...template,
      lifecycle: {
        ...template.lifecycle,
        status: 'archived' as const,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.templateRepository.save(updatedTemplate);
    return updatedTemplate;
  }

  // ==================== TaskInstance CRUD 操作 ====================

  /**
   * 创建任务实例
   */
  async createInstance(
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    // 验证模板存在
    const template = await this.templateRepository.findById(request.templateUuid);
    if (!template || template.accountUuid !== accountUuid) {
      throw TaskDomainException.templateNotFound(request.templateUuid);
    }

    // 验证调度时间
    const scheduledDate = new Date(request.timeConfig.scheduledDate);
    if (scheduledDate < new Date()) {
      throw TaskDomainException.pastDateNotAllowed(scheduledDate);
    }

    // 动态导入实体类
    const { TaskInstance } = await import('@dailyuse/domain-server');

    // 创建任务实例实体
    const instanceEntity = TaskInstance.create({
      templateUuid: request.templateUuid,
      accountUuid,
      title: request.title || template.title,
      description: request.description || template.description,
      timeConfig: {
        timeType: request.timeConfig.timeType,
        scheduledDate,
        startTime: request.timeConfig.startTime,
        endTime: request.timeConfig.endTime,
        estimatedDuration: request.timeConfig.estimatedDuration,
        timezone: request.timeConfig.timezone,
      },
      properties: {
        importance: request.properties?.importance ?? template.properties.importance,
        urgency: request.properties?.urgency ?? template.properties.urgency,
        location: request.properties?.location ?? template.properties.location,
        tags: request.properties?.tags ?? template.properties.tags,
      },
      goalLinks: request.goalLinks || template.goalLinks,
    });

    // 保存到仓储
    const instanceDTO = instanceEntity.toDTO();
    await this.instanceRepository.save(instanceDTO);

    return instanceDTO;
  }

  /**
   * 获取任务实例详情
   */
  async getInstanceById(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse | null> {
    const instanceDTO = await this.instanceRepository.findById(instanceUuid);
    if (!instanceDTO || instanceDTO.accountUuid !== accountUuid) {
      return null;
    }

    return instanceDTO;
  }

  /**
   * 获取任务实例列表
   */
  async getInstances(
    accountUuid: string,
    queryParams?: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    if (queryParams) {
      // 添加 accountUuid 到查询参数
      const query: TaskContracts.TaskQueryParamsDTO = {
        ...queryParams,
      };
      return await this.instanceRepository.query(query);
    }

    return await this.instanceRepository.findByAccountUuid(accountUuid, {});
  }

  /**
   * 更新任务实例
   */
  async updateInstance(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    // 获取现有实例
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    // 合并更新数据
    const updatedInstanceDTO: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      ...(request.title !== undefined && { title: request.title }),
      ...(request.description !== undefined && { description: request.description }),
      ...(request.timeConfig !== undefined && {
        timeConfig: { ...existingInstance.timeConfig, ...request.timeConfig },
      }),
      ...(request.properties !== undefined && {
        properties: { ...existingInstance.properties, ...request.properties },
      }),
      ...(request.goalLinks !== undefined && { goalLinks: request.goalLinks }),
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    // 保存更新后的实例
    await this.instanceRepository.save(updatedInstanceDTO);

    return updatedInstanceDTO;
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(accountUuid: string, instanceUuid: string): Promise<void> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    await this.instanceRepository.delete(instanceUuid);
  }

  // ==================== TaskInstance 状态管理 ====================

  /**
   * 完成任务
   */
  async completeTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    // 更新为已完成状态
    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      execution: {
        ...existingInstance.execution,
        status: 'completed' as const,
        actualStartTime: request.actualStartTime,
        actualEndTime: request.actualEndTime || new Date().toISOString(),
        actualDuration: request.actualDuration,
        progressPercentage: 100,
        notes: request.notes,
      },
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...existingInstance.lifecycle.events,
          {
            type: 'completed' as const,
            timestamp: new Date().toISOString(),
            note: request.notes,
          },
        ],
      },
    };

    await this.instanceRepository.save(updatedInstance);
    return updatedInstance;
  }

  /**
   * 撤销完成任务
   */
  async undoCompleteTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      execution: {
        ...existingInstance.execution,
        status: 'pending' as const,
        actualStartTime: undefined,
        actualEndTime: undefined,
        actualDuration: undefined,
        progressPercentage: 0,
      },
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.instanceRepository.save(updatedInstance);
    return updatedInstance;
  }

  /**
   * 重新调度任务
   */
  async rescheduleTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    // 验证新的调度日期
    const newScheduledDate = new Date(request.newScheduledDate);
    if (newScheduledDate < new Date()) {
      throw TaskDomainException.pastDateNotAllowed(newScheduledDate);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      timeConfig: {
        ...existingInstance.timeConfig,
        scheduledDate: request.newScheduledDate,
        startTime: request.newStartTime || existingInstance.timeConfig.startTime,
        endTime: request.newEndTime || existingInstance.timeConfig.endTime,
      },
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...existingInstance.lifecycle.events,
          {
            type: 'rescheduled' as const,
            timestamp: new Date().toISOString(),
            note: request.reason,
          },
        ],
      },
    };

    await this.instanceRepository.save(updatedInstance);
    return updatedInstance;
  }

  /**
   * 取消任务
   */
  async cancelTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      execution: {
        ...existingInstance.execution,
        status: 'cancelled' as const,
      },
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...existingInstance.lifecycle.events,
          {
            type: 'cancelled' as const,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };

    await this.instanceRepository.save(updatedInstance);
    return updatedInstance;
  }

  /**
   * 开始任务
   */
  async startTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      execution: {
        ...existingInstance.execution,
        status: 'inProgress' as const,
        actualStartTime: new Date().toISOString(),
      },
      lifecycle: {
        ...existingInstance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...existingInstance.lifecycle.events,
          {
            type: 'started' as const,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };

    await this.instanceRepository.save(updatedInstance);
    return updatedInstance;
  }

  // ==================== 提醒管理 ====================

  /**
   * 触发提醒
   */
  async triggerReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      reminderStatus: {
        ...existingInstance.reminderStatus,
        status: 'triggered' as const,
        triggeredAt: new Date().toISOString(),
      },
    };

    await this.instanceRepository.save(updatedInstance);
  }

  /**
   * 稍后提醒
   */
  async snoozeReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<void> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      reminderStatus: {
        ...existingInstance.reminderStatus,
        status: 'snoozed' as const,
        snoozeCount: existingInstance.reminderStatus.snoozeCount + 1,
        snoozeUntil: snoozeUntil.toISOString(),
      },
    };

    await this.instanceRepository.save(updatedInstance);
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    const existingInstance = await this.instanceRepository.findById(instanceUuid);
    if (!existingInstance || existingInstance.accountUuid !== accountUuid) {
      throw TaskDomainException.instanceNotFound(instanceUuid);
    }

    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...existingInstance,
      reminderStatus: {
        ...existingInstance.reminderStatus,
        status: 'dismissed' as const,
      },
    };

    await this.instanceRepository.save(updatedInstance);
  }

  // ==================== 统计和查询 ====================

  /**
   * 获取任务统计
   */
  async getTaskStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO> {
    // TODO: Implement stats aggregation or inject ITaskStatsRepository
    // For now, return a basic stats structure
    const templates = await this.templateRepository.findByAccountUuid(accountUuid, {});
    const instances = await this.instanceRepository.findByAccountUuid(accountUuid, {});

    return {
      overall: {
        total: instances.total,
        completed: instances.instances.filter((i) => i.execution.status === 'completed').length,
        incomplete: instances.instances.filter((i) => i.execution.status !== 'completed').length,
        completionRate: 0,
        overdue: instances.instances.filter((i) => i.execution.status === 'overdue').length,
        inProgress: instances.instances.filter((i) => i.execution.status === 'inProgress').length,
        pending: instances.instances.filter((i) => i.execution.status === 'pending').length,
      },
      byTemplate: [],
      byTimePeriod: {
        today: { total: 0, completed: 0, completionRate: 0 },
        thisWeek: { total: 0, completed: 0, completionRate: 0 },
        thisMonth: { total: 0, completed: 0, completionRate: 0 },
      },
      trends: {
        dailyCompletion: [],
        weeklyCompletion: [],
      },
    };
  }

  /**
   * 搜索任务实例
   */
  async searchTasks(
    accountUuid: string,
    queryParams: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.getInstances(accountUuid, queryParams);
  }

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return await this.getInstances(accountUuid, {
      ...queryParams,
      status: [TaskContractsEnums.TaskInstanceStatus.PENDING],
      dateRange: {
        start: now.toISOString(),
        end: nextWeek.toISOString(),
      },
      sortBy: 'scheduledDate',
      sortOrder: 'asc',
    });
  }

  /**
   * 获取过期任务
   */
  async getOverdueTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.getInstances(accountUuid, {
      ...queryParams,
      status: [TaskContractsEnums.TaskInstanceStatus.OVERDUE],
      sortBy: 'scheduledDate',
      sortOrder: 'desc',
    });
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.getInstances(accountUuid, {
      ...queryParams,
      dateRange: {
        start: today.toISOString(),
        end: tomorrow.toISOString(),
      },
      sortBy: 'scheduledDate',
      sortOrder: 'asc',
    });
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证时间配置
   */
  private validateTimeConfig(timeConfig: TaskContracts.CreateTaskTemplateRequest['timeConfig']) {
    const startDate = new Date(timeConfig.date.startDate);
    const endDate = timeConfig.date.endDate ? new Date(timeConfig.date.endDate) : null;

    if (endDate && endDate < startDate) {
      throw TaskDomainException.businessRuleViolation('End date must be after start date', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }

    if (timeConfig.time.timeType === TaskContractsEnums.TaskTimeType.TIME_RANGE) {
      if (!timeConfig.time.startTime || !timeConfig.time.endTime) {
        throw TaskDomainException.businessRuleViolation(
          'Start time and end time are required for TIME_RANGE',
          { timeType: timeConfig.time.timeType },
        );
      }
    }
  }
}
