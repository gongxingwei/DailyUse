import { TaskContracts } from '@dailyuse/contracts';
import {
  TaskTemplate,
  TaskInstance,
  TaskMetaTemplate,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
  type ITaskMetaTemplateRepository,
  type ITaskStatsRepository,
} from '@dailyuse/domain-server';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

// 为了简化类型引用，创建类型别名
type TaskTemplateDTO = TaskContracts.TaskTemplateDTO;
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type TaskMetaTemplateDTO = TaskContracts.TaskMetaTemplateDTO;
type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;
type CreateTaskMetaTemplateRequest = TaskContracts.CreateTaskMetaTemplateRequest;
type UpdateTaskMetaTemplateRequest = TaskContracts.UpdateTaskMetaTemplateRequest;
type CompleteTaskRequest = TaskContracts.CompleteTaskRequest;
type RescheduleTaskRequest = TaskContracts.RescheduleTaskRequest;
type UpdateTaskInstanceStatusRequest = TaskContracts.UpdateTaskInstanceStatusRequest;
type TaskQueryParamsDTO = TaskContracts.TaskQueryParamsDTO;
type TaskTemplateListResponse = TaskContracts.TaskTemplateListResponse;
type TaskInstanceListResponse = TaskContracts.TaskInstanceListResponse;
type TaskMetaTemplateListResponse = TaskContracts.TaskMetaTemplateListResponse;
type TaskStatsDTO = TaskContracts.TaskStatsDTO;

/**
 * 任务应用服务 - 协调业务流程
 */
export class TaskApplicationService {
  private static instance: TaskApplicationService;
  private taskTemplateRepository: ITaskTemplateRepository;
  private taskInstanceRepository: ITaskInstanceRepository;
  private taskMetaTemplateRepository: ITaskMetaTemplateRepository;
  private taskStatsRepository: ITaskStatsRepository;

  constructor(
    taskTemplateRepository: ITaskTemplateRepository,
    taskInstanceRepository: ITaskInstanceRepository,
    taskMetaTemplateRepository: ITaskMetaTemplateRepository,
    taskStatsRepository: ITaskStatsRepository,
  ) {
    this.taskTemplateRepository = taskTemplateRepository;
    this.taskInstanceRepository = taskInstanceRepository;
    this.taskMetaTemplateRepository = taskMetaTemplateRepository;
    this.taskStatsRepository = taskStatsRepository;
  }

  /**
   * 创建实例时注入依赖，支持默认选项
   */
  static async createInstance(
    taskTemplateRepository?: ITaskTemplateRepository,
    taskInstanceRepository?: ITaskInstanceRepository,
    taskMetaTemplateRepository?: ITaskMetaTemplateRepository,
    taskStatsRepository?: ITaskStatsRepository,
  ): Promise<TaskApplicationService> {
    const container = TaskContainer.getInstance();
    const finalTaskTemplateRepository =
      taskTemplateRepository || (await container.getPrismaTaskTemplateRepository());
    const finalTaskInstanceRepository =
      taskInstanceRepository || (await container.getPrismaTaskInstanceRepository());
    const finalTaskMetaTemplateRepository =
      taskMetaTemplateRepository || (await container.getPrismaTaskMetaTemplateRepository());
    const finalTaskStatsRepository =
      taskStatsRepository || (await container.getPrismaTaskStatsRepository());

    this.instance = new TaskApplicationService(
      finalTaskTemplateRepository,
      finalTaskInstanceRepository,
      finalTaskMetaTemplateRepository,
      finalTaskStatsRepository,
    );
    return this.instance;
  }

  /**
   * 获取服务实例
   */
  static async getInstance(): Promise<TaskApplicationService> {
    if (!this.instance) {
      TaskApplicationService.instance = await TaskApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===================== 任务模板管理 =====================

  /**
   * 创建任务模板
   */
  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateDTO> {
    // 创建领域对象
    const taskTemplate = TaskTemplate.create({
      accountUuid: request.accountUuid,
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

    // 转换为 DTO 并保存
    const taskTemplateDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(taskTemplateDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return taskTemplateDTO;
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(
    accountUuid: string,
    options?: {
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskTemplateListResponse> {
    if (options?.status) {
      return await this.taskTemplateRepository.findByStatus(accountUuid, options.status, options);
    }
    return await this.taskTemplateRepository.findByAccountUuid(accountUuid, options);
  }

  /**
   * 根据ID获取任务模板
   */
  async getTaskTemplateById(uuid: string): Promise<TaskTemplateDTO | null> {
    return await this.taskTemplateRepository.findById(uuid);
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateDTO> {
    // 获取现有模板
    const existingDTO = await this.taskTemplateRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务模板不存在');
    }

    // 转换为领域对象
    const taskTemplate = TaskTemplate.fromDTO(existingDTO);

    // 应用更新
    if (request.title) {
      taskTemplate.updateTitle(request.title);
    }
    if (request.timeConfig) {
      taskTemplate.updateTimeConfig(request.timeConfig);
    }
    if (request.reminderConfig) {
      taskTemplate.updateReminderConfig(request.reminderConfig);
    }

    // 保存更新
    const updatedDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<TaskTemplateDTO> {
    const existingDTO = await this.taskTemplateRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务模板不存在');
    }

    const taskTemplate = TaskTemplate.fromDTO(existingDTO);
    taskTemplate.activate();

    const updatedDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskTemplateDTO> {
    const existingDTO = await this.taskTemplateRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务模板不存在');
    }

    const taskTemplate = TaskTemplate.fromDTO(existingDTO);
    taskTemplate.pause();

    const updatedDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 完成任务模板
   */
  async completeTaskTemplate(uuid: string): Promise<TaskTemplateDTO> {
    const existingDTO = await this.taskTemplateRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务模板不存在');
    }

    const taskTemplate = TaskTemplate.fromDTO(existingDTO);
    taskTemplate.complete();

    const updatedDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(uuid: string): Promise<TaskTemplateDTO> {
    const existingDTO = await this.taskTemplateRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务模板不存在');
    }

    const taskTemplate = TaskTemplate.fromDTO(existingDTO);
    taskTemplate.archive();

    const updatedDTO = taskTemplate.toDTO();
    await this.taskTemplateRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    const exists = await this.taskTemplateRepository.exists(uuid);
    if (!exists) {
      throw new Error('任务模板不存在');
    }

    // 检查是否有关联的实例
    const instanceCount = await this.taskInstanceRepository.countByTemplate(uuid);
    if (instanceCount > 0) {
      throw new Error('无法删除有关联任务实例的模板');
    }

    await this.taskTemplateRepository.delete(uuid);
  }

  // ===================== 任务实例管理 =====================

  /**
   * 创建任务实例
   */
  async createTaskInstance(request: CreateTaskInstanceRequest): Promise<TaskInstanceDTO> {
    // 验证模板存在
    const templateExists = await this.taskTemplateRepository.exists(request.templateUuid);
    if (!templateExists) {
      throw new Error('任务模板不存在');
    }

    // 创建领域对象
    const taskInstance = TaskInstance.create({
      templateUuid: request.templateUuid,
      accountUuid: request.accountUuid,
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
      properties: request.properties,
      goalLinks: request.goalLinks,
    });

    // 转换为 DTO 并保存
    const taskInstanceDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(taskInstanceDTO);

    // 更新模板统计
    await this.updateTemplateStats(request.templateUuid);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return taskInstanceDTO;
  }

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(queryParams: TaskQueryParamsDTO): Promise<TaskInstanceListResponse> {
    return await this.taskInstanceRepository.query(queryParams);
  }

  /**
   * 根据ID获取任务实例
   */
  async getTaskInstanceById(uuid: string): Promise<TaskInstanceDTO | null> {
    return await this.taskInstanceRepository.findById(uuid);
  }

  /**
   * 更新任务实例
   */
  async updateTaskInstance(
    uuid: string,
    request: UpdateTaskInstanceRequest,
  ): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);

    // 应用更新
    if (request.title) {
      (taskInstance as any)._title = request.title;
    }
    if (request.description !== undefined) {
      (taskInstance as any)._description = request.description;
    }
    if (request.timeConfig) {
      if (request.timeConfig.scheduledDate) {
        taskInstance.reschedule(
          new Date(request.timeConfig.scheduledDate),
          request.timeConfig.startTime,
          request.timeConfig.endTime,
        );
      }
    }

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 开始任务实例
   */
  async startTaskInstance(uuid: string): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);
    taskInstance.start();

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(uuid: string, request: CompleteTaskRequest): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);

    // 设置完成信息
    if (request.actualStartTime) {
      (taskInstance as any)._execution.actualStartTime = new Date(request.actualStartTime);
    }
    if (request.actualEndTime) {
      (taskInstance as any)._execution.actualEndTime = new Date(request.actualEndTime);
    }
    if (request.actualDuration) {
      (taskInstance as any)._execution.actualDuration = request.actualDuration;
    }
    if (request.progressPercentage) {
      (taskInstance as any)._execution.progressPercentage = request.progressPercentage;
    }
    if (request.notes) {
      (taskInstance as any)._execution.notes = request.notes;
    }

    taskInstance.complete();

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 更新模板统计
    await this.updateTemplateStats(existingDTO.templateUuid);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 取消完成任务实例
   */
  async undoCompleteTaskInstance(uuid: string): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);
    taskInstance.undoComplete();

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 更新模板统计
    await this.updateTemplateStats(existingDTO.templateUuid);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 重新调度任务实例
   */
  async rescheduleTaskInstance(
    uuid: string,
    request: RescheduleTaskRequest,
  ): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);
    taskInstance.reschedule(
      new Date(request.newScheduledDate),
      request.newStartTime,
      request.newEndTime,
    );

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 取消任务实例
   */
  async cancelTaskInstance(uuid: string): Promise<TaskInstanceDTO> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    const taskInstance = TaskInstance.fromDTO(existingDTO);
    taskInstance.cancel();

    const updatedDTO = taskInstance.toDTO();
    await this.taskInstanceRepository.save(updatedDTO);

    // 发布领域事件
    const domainEvents = taskInstance.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return updatedDTO;
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    const existingDTO = await this.taskInstanceRepository.findById(uuid);
    if (!existingDTO) {
      throw new Error('任务实例不存在');
    }

    await this.taskInstanceRepository.delete(uuid);

    // 更新模板统计
    await this.updateTemplateStats(existingDTO.templateUuid);
  }

  // ===================== 任务元模板管理 =====================

  /**
   * 创建任务元模板
   */
  async createTaskMetaTemplate(
    request: CreateTaskMetaTemplateRequest,
  ): Promise<TaskMetaTemplateDTO> {
    const metaTemplate = TaskMetaTemplate.create({
      accountUuid: request.accountUuid,
      name: request.name,
      description: request.description,
      appearance: request.appearance,
      defaultTimeConfig: request.defaultTimeConfig,
      defaultReminderConfig: request.defaultReminderConfig,
      defaultProperties: request.defaultProperties,
    });

    const metaTemplateDTO = metaTemplate.toDTO();
    await this.taskMetaTemplateRepository.save(metaTemplateDTO);

    // 发布领域事件
    const domainEvents = metaTemplate.getDomainEvents();
    for (const event of domainEvents) {
      await eventBus.publish(event);
    }

    return metaTemplateDTO;
  }

  /**
   * 获取任务元模板列表
   */
  async getTaskMetaTemplates(
    accountUuid: string,
    options?: {
      isActive?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskMetaTemplateListResponse> {
    if (options?.category) {
      return await this.taskMetaTemplateRepository.findByCategory(
        accountUuid,
        options.category,
        options,
      );
    }
    return await this.taskMetaTemplateRepository.findByAccountUuid(accountUuid, options);
  }

  // ===================== 查询和统计 =====================

  /**
   * 获取今日任务
   */
  async getTodayTasks(accountUuid: string, timezone: string): Promise<TaskInstanceListResponse> {
    return await this.taskInstanceRepository.findToday(accountUuid, timezone);
  }

  /**
   * 获取本周任务
   */
  async getThisWeekTasks(accountUuid: string, timezone: string): Promise<TaskInstanceListResponse> {
    return await this.taskInstanceRepository.findThisWeek(accountUuid, timezone);
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(accountUuid: string): Promise<TaskInstanceListResponse> {
    return await this.taskInstanceRepository.findOverdue(accountUuid);
  }

  /**
   * 获取任务统计
   */
  async getTaskStats(accountUuid: string): Promise<TaskStatsDTO> {
    return await this.taskStatsRepository.getAccountStats(accountUuid);
  }

  /**
   * 搜索任务
   */
  async searchTasks(accountUuid: string, query: string): Promise<TaskInstanceListResponse> {
    const queryParams: TaskQueryParamsDTO = {
      // 这里可以根据查询字符串构建查询参数
      limit: 50,
      offset: 0,
    };
    return await this.taskInstanceRepository.query(queryParams);
  }

  // ===================== 私有辅助方法 =====================

  /**
   * 更新模板统计信息
   */
  private async updateTemplateStats(templateUuid: string): Promise<void> {
    const totalInstances = await this.taskInstanceRepository.countByTemplate(templateUuid);
    const completedInstances =
      await this.taskInstanceRepository.countCompletedByTemplate(templateUuid);

    const templateDTO = await this.taskTemplateRepository.findById(templateUuid);
    if (templateDTO) {
      const taskTemplate = TaskTemplate.fromDTO(templateDTO);
      taskTemplate.updateInstanceStats(totalInstances, completedInstances);

      const updatedDTO = taskTemplate.toDTO();
      await this.taskTemplateRepository.save(updatedDTO);
    }
  }
}
