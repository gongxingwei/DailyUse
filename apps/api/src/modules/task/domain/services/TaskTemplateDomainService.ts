import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskTemplateAggregateRepository } from '@dailyuse/domain-server';
import {
  TaskDomainException,
  TaskErrorCode,
  TaskTemplate,
  TaskInstance,
} from '@dailyuse/domain-server';

// EventEmitter 类型（可选依赖，用于发送领域事件）
type EventEmitter = {
  emit(event: string, payload: any): boolean;
};

export class TaskTemplateDomainService {
  public eventEmitter?: EventEmitter;

  constructor(private readonly templateRepository: ITaskTemplateAggregateRepository) {}

  async createTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const timeConfig = {
      ...request.timeConfig,
      date: {
        startDate: new Date(request.timeConfig.date.startDate),
        endDate: request.timeConfig.date.endDate
          ? new Date(request.timeConfig.date.endDate)
          : undefined,
      },
    };
    const template = TaskTemplate.create({
      accountUuid,
      title: request.title,
      description: request.description,
      timeConfig,
      reminderConfig: request.reminderConfig,
      properties: request.properties,
      goalLinks: request.goalLinks,
    });
    const savedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    // 发射 TaskTemplateCreated 事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('TaskTemplateCreated', {
        aggregateId: savedTemplate.uuid,
        payload: {
          templateUuid: savedTemplate.uuid,
          accountUuid,
          template: savedTemplate.toDTO(),
        },
      });
    }

    return savedTemplate.toDTO();
  }

  async getTemplates(
    accountUuid: string,
    queryParams: any,
  ): Promise<TaskContracts.TaskTemplateListResponse> {
    const { templates, total } = await this.templateRepository.getAllTemplates(
      accountUuid,
      queryParams,
    );
    return {
      data: templates.map((template) => template.toDTO()),
      total,
      page: queryParams?.page || 1,
      limit: queryParams?.limit || 20,
      hasMore: (queryParams?.page || 1) * (queryParams?.limit || 20) < total,
    };
  }

  async getTemplateById(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse | null> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    return template ? template.toDTO() : null;
  }

  async updateTemplate(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    if (!template)
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        'Task template not found: ' + templateUuid,
      );
    if (request.title !== undefined) template.updateTitle(request.title);
    if (request.timeConfig !== undefined) {
      const timeConfig = {
        ...request.timeConfig,
        date: request.timeConfig.date
          ? {
              startDate: request.timeConfig.date.startDate
                ? new Date(request.timeConfig.date.startDate)
                : undefined,
              endDate: request.timeConfig.date.endDate
                ? new Date(request.timeConfig.date.endDate)
                : undefined,
            }
          : undefined,
      };
      template.updateTimeConfig(timeConfig);
    }
    if (request.reminderConfig !== undefined) template.updateReminderConfig(request.reminderConfig);
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    // 发射 TaskTemplateUpdated 事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('TaskTemplateUpdated', {
        aggregateId: updatedTemplate.uuid,
        payload: {
          templateUuid: updatedTemplate.uuid,
          accountUuid,
          template: updatedTemplate.toDTO(),
        },
      });
    }

    return updatedTemplate.toDTO();
  }

  async deleteTemplate(accountUuid: string, templateUuid: string): Promise<void> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    if (!template)
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        'Task template not found: ' + templateUuid,
      );

    const templateTitle = template.title;
    await this.templateRepository.deleteTemplate(accountUuid, templateUuid);

    // 发射 TaskTemplateDeleted 事件
    if (this.eventEmitter) {
      this.eventEmitter.emit('TaskTemplateDeleted', {
        aggregateId: templateUuid,
        payload: {
          templateUuid,
          accountUuid,
          templateTitle,
        },
      });
    }
  }

  async activateTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    if (!template)
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        'Task template not found: ' + templateUuid,
      );
    template.activate();
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);
    return updatedTemplate.toDTO();
  }

  async pauseTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    if (!template)
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        'Task template not found: ' + templateUuid,
      );
    template.pause();
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);
    return updatedTemplate.toDTO();
  }

  async archiveTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const template = await this.templateRepository.getTemplateByUuid(accountUuid, templateUuid);
    if (!template)
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        'Task template not found: ' + templateUuid,
      );
    template.archive();
    const updatedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);
    return updatedTemplate.toDTO();
  }

  // ===== TaskInstance 管理（通过聚合根）=====

  /**
   * 通过聚合根创建任务实例
   * 参考 GoalDomainService.createReviewForGoal 模式
   */
  async createInstance(
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    // 1. 获取聚合根实体
    const template = await this.templateRepository.getTemplateByUuid(
      accountUuid,
      request.templateUuid,
    );
    if (!template) {
      throw new TaskDomainException(
        TaskErrorCode.TEMPLATE_NOT_FOUND,
        `Task template not found: ${request.templateUuid}`,
      );
    }

    // 2. 通过聚合根创建实例（调用聚合根的业务方法）
    const instanceUuid = template.createInstance({
      title: request.title,
      description: request.description,
      scheduledDate: new Date(request.timeConfig.scheduledDate),
      startTime: request.timeConfig.startTime,
      endTime: request.timeConfig.endTime,
      estimatedDuration: request.timeConfig.estimatedDuration,
      properties: request.properties,
      goalLinks: request.goalLinks,
    });

    // 3. 保存整个聚合根（包含新创建的实例）
    const savedTemplate = await this.templateRepository.saveTemplate(accountUuid, template);

    // 4. 获取并返回新创建的实例
    const savedInstance = savedTemplate.getInstance(instanceUuid);
    if (!savedInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        'Failed to retrieve created instance',
      );
    }

    return savedInstance.toDTO();
  }

  /**
   * 获取任务实例详情（从聚合根中查询）
   */
  async getInstanceById(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse | null> {
    // 需要遍历所有模板找到包含该实例的模板
    // 或者在仓储中添加辅助查询方法
    throw new Error('getInstanceById: 待实现 - 需要辅助查询方法');
  }

  /**
   * 获取任务实例列表（跨所有模板）
   */
  async getInstances(
    accountUuid: string,
    queryParams?: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    // 获取所有模板，然后过滤实例
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});

    const allInstances = templates.flatMap((template) =>
      template.instances.map((instance) => instance.toDTO()),
    );

    // TODO: 应用过滤和分页
    return {
      data: allInstances,
      total: allInstances.length,
      page: 1,
      limit: queryParams?.limit || 20,
      hasMore: false,
    };
  }

  /**
   * 更新任务实例（通过聚合根）
   */
  async updateInstance(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    // 1. 找到包含该实例的模板
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    // 2. 获取实例并更新（通过重建实例）
    const instance = templateWithInstance.getInstance(instanceUuid);
    if (!instance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    // 使用 fromDTO 保留原有 uuid 并更新字段
    const instanceDTO = instance.toDTO();
    const updatedDTO: TaskContracts.TaskInstanceDTO = {
      ...instanceDTO,
      title: request.title ?? instanceDTO.title,
      description: request.description ?? instanceDTO.description,
      timeConfig: request.timeConfig
        ? {
            ...instanceDTO.timeConfig,
            timeType: request.timeConfig.timeType ?? instanceDTO.timeConfig.timeType,
            scheduledDate: request.timeConfig.scheduledDate ?? instanceDTO.timeConfig.scheduledDate,
            startTime: request.timeConfig.startTime ?? instanceDTO.timeConfig.startTime,
            endTime: request.timeConfig.endTime ?? instanceDTO.timeConfig.endTime,
            estimatedDuration:
              request.timeConfig.estimatedDuration ?? instanceDTO.timeConfig.estimatedDuration,
            timezone: request.timeConfig.timezone ?? instanceDTO.timeConfig.timezone,
          }
        : instanceDTO.timeConfig,
      properties: request.properties
        ? {
            ...instanceDTO.properties,
            importance: request.properties.importance ?? instanceDTO.properties.importance,
            urgency: request.properties.urgency ?? instanceDTO.properties.urgency,
            location: request.properties.location ?? instanceDTO.properties.location,
            tags: request.properties.tags ?? instanceDTO.properties.tags,
          }
        : instanceDTO.properties,
      goalLinks: request.goalLinks ?? instanceDTO.goalLinks,
    };

    // 移除旧实例并添加更新后的实例
    templateWithInstance.removeInstance(instanceUuid);
    const updatedInstance = TaskInstance.fromDTO(updatedDTO);
    templateWithInstance.addInstance(updatedInstance);

    // 3. 保存聚合根
    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);

    // 4. 返回更新后的实例
    return instance.toDTO();
  }

  /**
   * 删除任务实例（通过聚合根）
   */
  async deleteInstance(accountUuid: string, instanceUuid: string): Promise<void> {
    // 1. 找到包含该实例的模板
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    // 2. 从聚合根中移除实例
    templateWithInstance.removeInstance(instanceUuid);

    // 3. 保存聚合根
    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
  }

  // ===== TaskInstance 状态管理（通过聚合根中的实例）=====

  /**
   * 完成任务
   */
  async completeTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    instance.complete();

    // TaskInstance.complete() 已经设置了实际结束时间
    // 如果需要自定义时间或备注，可以在实体中添加对应方法

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
    return instance.toDTO();
  }

  /**
   * 撤销完成
   */
  async undoCompleteTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    instance.undoComplete();

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
    return instance.toDTO();
  }

  /**
   * 取消任务
   */
  async cancelTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    instance.cancel();

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
    return instance.toDTO();
  }

  /**
   * 开始任务
   */
  async startTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    instance.start();

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
    return instance.toDTO();
  }

  /**
   * 重新调度任务
   */
  async rescheduleTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    instance.reschedule(
      new Date(request.newScheduledDate),
      request.newStartTime,
      request.newEndTime,
    );

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
    return instance.toDTO();
  }

  // ===== 提醒管理 =====

  async triggerReminder(
    accountUuid: string,
    instanceUuid: string,
    _reminderId: string,
  ): Promise<void> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    // TODO: 需要在 TaskInstance 实体中添加 triggerReminder 方法
    // instance.triggerReminder();

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
  }

  async snoozeReminder(
    accountUuid: string,
    instanceUuid: string,
    _reminderId: string,
    snoozeUntil: Date,
    _reason?: string,
  ): Promise<void> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    // TODO: 需要在 TaskInstance 实体中添加 snoozeReminder 方法
    // instance.snoozeReminder(snoozeUntil);

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
  }

  async dismissReminder(
    accountUuid: string,
    instanceUuid: string,
    _reminderId: string,
  ): Promise<void> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const templateWithInstance = templates.find((t) => t.getInstance(instanceUuid));

    if (!templateWithInstance) {
      throw new TaskDomainException(
        TaskErrorCode.INSTANCE_NOT_FOUND,
        `Task instance not found: ${instanceUuid}`,
      );
    }

    const instance = templateWithInstance.getInstance(instanceUuid)!;
    // TODO: 需要在 TaskInstance 实体中添加 dismissReminder 方法
    // instance.dismissReminder();

    await this.templateRepository.saveTemplate(accountUuid, templateWithInstance);
  }

  // ===== 统计和查询 =====

  async getTaskStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO> {
    return await this.templateRepository.getAccountStats(accountUuid);
  }

  async searchTasks(
    accountUuid: string,
    queryParams: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    // 获取所有模板的实例并过滤
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});

    let allInstances = templates.flatMap((template) =>
      template.instances.map((instance) => instance.toDTO()),
    );

    // 应用过滤
    if (queryParams.status) {
      allInstances = allInstances.filter((i) => queryParams.status?.includes(i.execution.status));
    }
    if (queryParams.templateUuid) {
      allInstances = allInstances.filter((i) => i.templateUuid === queryParams.templateUuid);
    }

    return {
      data: allInstances,
      total: allInstances.length,
      page: 1,
      limit: queryParams.limit || 20,
      hasMore: false,
    };
  }

  async getUpcomingTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const upcomingInstances = templates
      .flatMap((template) => template.instances.map((instance) => instance.toDTO()))
      .filter((instance) => {
        const scheduledDate = new Date(instance.timeConfig.scheduledDate);
        return (
          scheduledDate >= now &&
          scheduledDate <= futureDate &&
          (instance.execution.status === 'pending' || instance.execution.status === 'inProgress')
        );
      })
      .sort(
        (a, b) =>
          new Date(a.timeConfig.scheduledDate).getTime() -
          new Date(b.timeConfig.scheduledDate).getTime(),
      );

    return {
      data: upcomingInstances.slice(0, queryParams?.limit || 20),
      total: upcomingInstances.length,
      page: 1,
      limit: queryParams?.limit || 20,
      hasMore: upcomingInstances.length > (queryParams?.limit || 20),
    };
  }

  async getOverdueTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const now = new Date();

    const overdueInstances = templates
      .flatMap((template) => template.instances.map((instance) => instance.toDTO()))
      .filter((instance) => {
        const scheduledDate = new Date(instance.timeConfig.scheduledDate);
        return (
          scheduledDate < now &&
          (instance.execution.status === 'pending' ||
            instance.execution.status === 'inProgress' ||
            instance.execution.status === 'overdue')
        );
      })
      .sort(
        (a, b) =>
          new Date(a.timeConfig.scheduledDate).getTime() -
          new Date(b.timeConfig.scheduledDate).getTime(),
      );

    return {
      data: overdueInstances.slice(0, queryParams?.limit || 20),
      total: overdueInstances.length,
      page: 1,
      limit: queryParams?.limit || 20,
      hasMore: overdueInstances.length > (queryParams?.limit || 20),
    };
  }

  async getTodayTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    const { templates } = await this.templateRepository.getAllTemplates(accountUuid, {});
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInstances = templates
      .flatMap((template) => template.instances.map((instance) => instance.toDTO()))
      .filter((instance) => {
        const scheduledDate = new Date(instance.timeConfig.scheduledDate);
        return scheduledDate >= today && scheduledDate < tomorrow;
      })
      .sort(
        (a, b) =>
          new Date(a.timeConfig.scheduledDate).getTime() -
          new Date(b.timeConfig.scheduledDate).getTime(),
      );

    return {
      data: todayInstances.slice(0, queryParams?.limit || 20),
      total: todayInstances.length,
      page: 1,
      limit: queryParams?.limit || 20,
      hasMore: todayInstances.length > (queryParams?.limit || 20),
    };
  }
}
