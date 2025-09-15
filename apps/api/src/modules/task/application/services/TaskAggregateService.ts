import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import {
  TaskTemplate,
  TaskInstance,
  TaskMetaTemplate,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
  type ITaskMetaTemplateRepository,
} from '@dailyuse/domain-server';

/**
 * Task聚合根服务 - 专注于聚合根控制模式
 * 通过TaskTemplate聚合根管理TaskInstance实体的完整生命周期
 */
export class TaskAggregateService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
    private taskMetaTemplateRepository: ITaskMetaTemplateRepository,
  ) {}

  // ===== 聚合根模板管理 =====

  /**
   * 创建任务模板聚合根
   */
  async createTaskTemplateAggregate(
    accountUuid: string,
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    // 创建聚合根（不包含实例）
    const taskTemplate = TaskTemplate.create({
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

    // 保存聚合根到仓储
    await this.taskTemplateRepository.save(taskTemplate.toDTO());

    return taskTemplate.toDTO();
  }

  /**
   * 加载完整的任务模板聚合根（包含所有实例）
   */
  async loadTaskTemplateAggregate(templateUuid: string): Promise<{
    template: TaskContracts.TaskTemplateDTO;
    instances: TaskContracts.TaskInstanceDTO[];
  } | null> {
    // 加载模板基础数据
    const templateDTO = await this.taskTemplateRepository.findById(templateUuid);
    if (!templateDTO) {
      return null;
    }

    // 加载模板的所有实例
    const instancesResult = await this.taskInstanceRepository.findByTemplateUuid(templateUuid);
    const instancesDTO = instancesResult.instances || [];

    return {
      template: templateDTO,
      instances: instancesDTO,
    };
  }

  // ===== 聚合根实例管理 =====

  /**
   * 通过聚合根创建任务实例
   */
  async createTaskInstanceViaAggregate(
    templateUuid: string,
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 创建任务实例
    const taskInstance = TaskInstance.create({
      templateUuid,
      accountUuid,
      title: request.title || '新任务实例',
      description: request.description,
      timeConfig: {
        timeType: request.timeConfig.timeType,
        scheduledDate: new Date(request.timeConfig.scheduledDate),
        startTime: request.timeConfig.startTime,
        endTime: request.timeConfig.endTime,
        estimatedDuration: request.timeConfig.estimatedDuration,
        timezone: request.timeConfig.timezone,
      },
      properties: {
        importance: request.properties?.importance || ImportanceLevel.Moderate,
        urgency: request.properties?.urgency || UrgencyLevel.Medium,
        location: request.properties?.location,
        tags: request.properties?.tags || [],
      },
      goalLinks: request.goalLinks,
    });

    // 保存实例
    await this.taskInstanceRepository.save(taskInstance.toDTO());

    // 更新模板统计（聚合根控制）
    await this.updateTemplateStats(templateUuid);

    return taskInstance.toDTO();
  }

  /**
   * 通过聚合根完成任务实例
   */
  async completeTaskInstanceViaAggregate(
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<void> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 获取实例
    const instance = await this.taskInstanceRepository.findById(instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    // 验证实例属于该模板
    if (instance.templateUuid !== templateUuid) {
      throw new Error(`任务实例 ${instanceUuid} 不属于模板 ${templateUuid}`);
    }

    // 更新实例状态
    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...instance,
      execution: {
        ...instance.execution,
        status: 'completed',
        actualDuration: request.actualDuration,
        progressPercentage: request.progressPercentage || 100,
        notes: request.notes,
        actualStartTime: request.actualStartTime,
        actualEndTime: request.actualEndTime || new Date().toISOString(),
      },
      lifecycle: {
        ...instance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...instance.lifecycle.events,
          {
            type: 'completed',
            timestamp: new Date().toISOString(),
            note: request.notes,
          },
        ],
      },
    };

    // 保存更新的实例
    await this.taskInstanceRepository.save(updatedInstance);

    // 更新模板统计（聚合根控制）
    await this.updateTemplateStats(templateUuid);
  }

  /**
   * 通过聚合根取消任务实例
   */
  async cancelTaskInstanceViaAggregate(
    templateUuid: string,
    instanceUuid: string,
    reason?: string,
  ): Promise<void> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 获取实例
    const instance = await this.taskInstanceRepository.findById(instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    // 验证实例属于该模板
    if (instance.templateUuid !== templateUuid) {
      throw new Error(`任务实例 ${instanceUuid} 不属于模板 ${templateUuid}`);
    }

    // 更新实例状态
    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...instance,
      execution: {
        ...instance.execution,
        status: 'cancelled',
        notes: reason,
      },
      lifecycle: {
        ...instance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...instance.lifecycle.events,
          {
            type: 'cancelled',
            timestamp: new Date().toISOString(),
            note: reason,
          },
        ],
      },
    };

    // 保存更新的实例
    await this.taskInstanceRepository.save(updatedInstance);

    // 更新模板统计（聚合根控制）
    await this.updateTemplateStats(templateUuid);
  }

  /**
   * 通过聚合根重新调度任务实例
   */
  async rescheduleTaskInstanceViaAggregate(
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<void> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 获取实例
    const instance = await this.taskInstanceRepository.findById(instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    // 验证实例属于该模板
    if (instance.templateUuid !== templateUuid) {
      throw new Error(`任务实例 ${instanceUuid} 不属于模板 ${templateUuid}`);
    }

    // 更新实例时间配置
    const updatedInstance: TaskContracts.TaskInstanceDTO = {
      ...instance,
      timeConfig: {
        ...instance.timeConfig,
        scheduledDate: request.newScheduledDate,
        startTime: request.newStartTime || instance.timeConfig.startTime,
        endTime: request.newEndTime || instance.timeConfig.endTime,
      },
      lifecycle: {
        ...instance.lifecycle,
        updatedAt: new Date().toISOString(),
        events: [
          ...instance.lifecycle.events,
          {
            type: 'rescheduled',
            timestamp: new Date().toISOString(),
            note: request.reason,
          },
        ],
      },
    };

    // 保存更新的实例
    await this.taskInstanceRepository.save(updatedInstance);
  }

  // ===== 聚合根查询操作 =====

  /**
   * 获取任务模板聚合根的完整状态
   */
  async getTaskTemplateAggregateState(templateUuid: string): Promise<{
    template: TaskContracts.TaskTemplateDTO;
    instances: TaskContracts.TaskInstanceDTO[];
    aggregateStats: {
      totalInstances: number;
      completedInstances: number;
      pendingInstances: number;
      cancelledInstances: number;
      completionRate: number;
    };
  } | null> {
    const aggregateData = await this.loadTaskTemplateAggregate(templateUuid);
    if (!aggregateData) {
      return null;
    }

    const { template, instances } = aggregateData;

    const totalInstances = instances.length;
    const completedInstances = instances.filter((i) => i.execution.status === 'completed').length;
    const pendingInstances = instances.filter((i) => i.execution.status === 'pending').length;
    const cancelledInstances = instances.filter((i) => i.execution.status === 'cancelled').length;
    const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

    return {
      template,
      instances,
      aggregateStats: {
        totalInstances,
        completedInstances,
        pendingInstances,
        cancelledInstances,
        completionRate,
      },
    };
  }

  /**
   * 获取账户的所有任务模板聚合根列表
   */
  async getAccountTaskTemplateAggregates(
    accountUuid: string,
    options: {
      includeInstances?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<TaskContracts.TaskTemplateListResponse> {
    // 查询模板列表
    const templatesResult = await this.taskTemplateRepository.findByAccountUuid(accountUuid, {
      limit: options.limit,
      offset: options.offset,
    });

    // 如果需要包含实例，则为每个模板加载实例
    if (options.includeInstances) {
      const templatesWithInstances = await Promise.all(
        templatesResult.templates.map(async (template) => {
          const instances = await this.taskInstanceRepository.findByTemplateUuid(template.uuid);
          return {
            ...template,
            // 注意：这里不能直接添加instances属性，因为DTO中没有定义
            // 应该在外层包装或者使用扩展接口
          };
        }),
      );

      return {
        templates: templatesWithInstances,
        total: templatesResult.total,
        page: templatesResult.page,
        limit: templatesResult.limit,
        hasMore: templatesResult.hasMore,
      };
    }

    return templatesResult;
  }

  // ===== 私有辅助方法 =====

  /**
   * 更新模板统计信息（聚合根控制）
   */
  private async updateTemplateStats(templateUuid: string): Promise<void> {
    const template = await this.taskTemplateRepository.findById(templateUuid);
    if (!template) {
      return;
    }

    const instances = await this.taskInstanceRepository.findByTemplateUuid(templateUuid);

    const totalInstances = instances.instances.length;
    const completedInstances = instances.instances.filter(
      (i: TaskContracts.TaskInstanceDTO) => i.execution.status === 'completed',
    ).length;
    const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

    // 获取最新实例日期
    const lastInstanceDate =
      instances.instances.length > 0
        ? instances.instances
            .map((i: TaskContracts.TaskInstanceDTO) => new Date(i.timeConfig.scheduledDate))
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
            .toISOString()
        : undefined;

    // 更新模板统计
    const updatedTemplate: TaskContracts.TaskTemplateDTO = {
      ...template,
      stats: {
        totalInstances,
        completedInstances,
        completionRate,
        lastInstanceDate,
      },
      lifecycle: {
        ...template.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.taskTemplateRepository.save(updatedTemplate);
  }

  // ===== 额外的聚合根管理方法 =====

  /**
   * 更新任务实例（通过聚合根）
   */
  async updateTaskInstanceViaAggregate(
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 获取并更新实例
    const instanceDTO = await this.taskInstanceRepository.findById(instanceUuid);
    if (!instanceDTO) {
      throw new Error(`实例不存在: ${instanceUuid}`);
    }

    // 创建更新后的DTO
    const updatedInstanceDTO: TaskContracts.TaskInstanceDTO = {
      ...instanceDTO,
      title: request.title !== undefined ? request.title : instanceDTO.title,
      description:
        request.description !== undefined ? request.description : instanceDTO.description,
      timeConfig: request.timeConfig
        ? {
            ...instanceDTO.timeConfig,
            ...request.timeConfig,
            scheduledDate: request.timeConfig.scheduledDate || instanceDTO.timeConfig.scheduledDate,
          }
        : instanceDTO.timeConfig,
      properties: request.properties
        ? {
            ...instanceDTO.properties,
            ...request.properties,
          }
        : instanceDTO.properties,
      lifecycle: {
        ...instanceDTO.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    // 保存更新
    await this.taskInstanceRepository.save(updatedInstanceDTO);

    // 更新模板统计
    await this.updateTemplateStats(templateUuid);

    return updatedInstanceDTO;
  }

  /**
   * 删除任务实例（通过聚合根）
   */
  async deleteTaskInstanceViaAggregate(templateUuid: string, instanceUuid: string): Promise<void> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 删除实例
    await this.taskInstanceRepository.delete(instanceUuid);

    // 更新模板统计
    await this.updateTemplateStats(templateUuid);
  }

  /**
   * 获取任务模板统计信息
   */
  async getTaskTemplateAnalytics(templateUuid: string): Promise<{
    totalInstances: number;
    completedInstances: number;
    completionRate: number;
    lastInstanceDate?: string;
    averageDuration?: number;
    statusDistribution: Record<string, number>;
  }> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    const instances = await this.taskInstanceRepository.findByTemplateUuid(templateUuid);

    const totalInstances = instances.instances.length;
    const completedInstances = instances.instances.filter(
      (i: TaskContracts.TaskInstanceDTO) => i.execution.status === 'completed',
    ).length;
    const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

    // 计算平均时长
    const completedWithDuration = instances.instances.filter(
      (i: TaskContracts.TaskInstanceDTO) =>
        i.execution.status === 'completed' && i.execution.actualDuration,
    );
    const averageDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, i) => sum + (i.execution.actualDuration || 0), 0) /
          completedWithDuration.length
        : undefined;

    // 状态分布
    const statusDistribution: Record<string, number> = {};
    instances.instances.forEach((i: TaskContracts.TaskInstanceDTO) => {
      statusDistribution[i.execution.status] = (statusDistribution[i.execution.status] || 0) + 1;
    });

    // 最新实例日期
    const lastInstanceDate =
      instances.instances.length > 0
        ? instances.instances
            .map((i: TaskContracts.TaskInstanceDTO) => new Date(i.timeConfig.scheduledDate))
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
            .toISOString()
        : undefined;

    return {
      totalInstances,
      completedInstances,
      completionRate,
      lastInstanceDate,
      averageDuration,
      statusDistribution,
    };
  }

  /**
   * 更新任务模板聚合根
   */
  async updateTaskTemplateAggregate(
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    // 获取现有模板
    const templateDTO = await this.taskTemplateRepository.findById(templateUuid);
    if (!templateDTO) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 创建更新后的DTO
    const updatedTemplateDTO: TaskContracts.TaskTemplateDTO = {
      ...templateDTO,
      title: request.title !== undefined ? request.title : templateDTO.title,
      description:
        request.description !== undefined ? request.description : templateDTO.description,
      timeConfig: request.timeConfig
        ? {
            ...templateDTO.timeConfig,
            ...request.timeConfig,
          }
        : templateDTO.timeConfig,
      properties: request.properties
        ? {
            ...templateDTO.properties,
            ...request.properties,
          }
        : templateDTO.properties,
      lifecycle: {
        ...templateDTO.lifecycle,
        updatedAt: new Date().toISOString(),
      },
    };

    // 保存更新
    await this.taskTemplateRepository.save(updatedTemplateDTO);

    return updatedTemplateDTO;
  }

  /**
   * 删除任务模板聚合根（包含所有实例）
   */
  async deleteTaskTemplateAggregate(templateUuid: string): Promise<void> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(templateUuid);
    if (!templateExists) {
      throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
    }

    // 获取所有相关实例
    const instances = await this.taskInstanceRepository.findByTemplateUuid(templateUuid);

    // 删除所有实例
    for (const instance of instances.instances) {
      await this.taskInstanceRepository.delete(instance.uuid);
    }

    // 删除模板
    await this.taskTemplateRepository.delete(templateUuid);
  }
}
