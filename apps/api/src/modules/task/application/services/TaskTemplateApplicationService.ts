import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskTemplateRepository, ITaskInstanceRepository } from '@dailyuse/domain-server';
import { TaskTemplateDomainService } from '../../domain/services/TaskTemplateDomainService';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

/**
 * TaskTemplate 应用服务
 * 
 * 职责：
 * 1. 注入具体的 Repository 实现
 * 2. 协调领域服务
 * 3. 管理 TaskTemplate 聚合根及其子实体（TaskInstance）
 *
 * 设计原则（参考 GoalApplicationService）：
 * - 通过聚合根控制所有子实体操作
 * - TaskInstance 必须通过 TaskTemplate 来创建/更新/删除
 * - 业务逻辑委托给领域服务
 * 
 * 整合说明：
 * - 合并了 TaskAggregateService 的聚合根控制逻辑
 * - 合并了 TaskApplicationService 的基础CRUD操作
 * - TaskInstance 操作全部通过 TaskTemplate 聚合根控制
 */
export class TaskTemplateApplicationService {
  private static instance: TaskTemplateApplicationService;
  private domainService: TaskTemplateDomainService;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;

  constructor(
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ) {
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
    this.domainService = new TaskTemplateDomainService(templateRepository, instanceRepository);
  }

  static async createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): Promise<TaskTemplateApplicationService> {
    const taskContainer = TaskContainer.getInstance();
    templateRepository =
      templateRepository || (await taskContainer.getPrismaTaskTemplateRepository());
    instanceRepository =
      instanceRepository || (await taskContainer.getPrismaTaskInstanceRepository());
    this.instance = new TaskTemplateApplicationService(templateRepository, instanceRepository);
    return this.instance;
  }

  static async getInstance(): Promise<TaskTemplateApplicationService> {
    if (!this.instance) {
      TaskTemplateApplicationService.instance =
        await TaskTemplateApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===== TaskTemplate 聚合根管理 =====

  /**
   * 创建任务模板
   */
  async createTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.createTemplate(accountUuid, request);
  }

  /**
   * 获取任务模板列表
   */
  async getTemplates(
    accountUuid: string,
    queryParams: any,
  ): Promise<TaskContracts.TaskTemplateListResponse> {
    return await this.domainService.getTemplates(accountUuid, queryParams);
  }

  /**
   * 获取任务模板详情
   */
  async getTemplateById(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse | null> {
    return await this.domainService.getTemplateById(accountUuid, templateUuid);
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.updateTemplate(accountUuid, templateUuid, request);
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(accountUuid: string, templateUuid: string): Promise<void> {
    await this.domainService.deleteTemplate(accountUuid, templateUuid);
  }

  // ===== TaskTemplate 状态管理 =====

  /**
   * 激活任务模板
   */
  async activateTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.activateTemplate(accountUuid, templateUuid);
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.pauseTemplate(accountUuid, templateUuid);
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.archiveTemplate(accountUuid, templateUuid);
  }

  // ===== DDD 聚合根控制方法 - TaskInstance 管理 =====

  /**
   * 通过聚合根创建任务实例
   * 体现DDD原则：TaskInstance 必须通过 TaskTemplate 聚合根创建
   */
  async createInstance(
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.createInstance(accountUuid, request);
  }

  /**
   * 获取任务实例详情
   */
  async getInstanceById(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse | null> {
    return await this.domainService.getInstanceById(accountUuid, instanceUuid);
  }

  /**
   * 获取任务实例列表
   */
  async getInstances(
    accountUuid: string,
    queryParams?: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getInstances(accountUuid, queryParams);
  }

  /**
   * 更新任务实例
   */
  async updateInstance(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.updateInstance(accountUuid, instanceUuid, request);
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(accountUuid: string, instanceUuid: string): Promise<void> {
    await this.domainService.deleteInstance(accountUuid, instanceUuid);
  }

  // ===== TaskInstance 状态管理 =====

  /**
   * 完成任务实例
   */
  async completeTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.completeTask(accountUuid, instanceUuid, request);
  }

  /**
   * 撤销完成任务
   */
  async undoCompleteTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.undoCompleteTask(accountUuid, instanceUuid);
  }

  /**
   * 取消任务实例
   */
  async cancelTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.cancelTask(accountUuid, instanceUuid);
  }

  /**
   * 开始任务实例
   */
  async startTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.startTask(accountUuid, instanceUuid);
  }

  /**
   * 重新调度任务实例
   */
  async rescheduleTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.rescheduleTask(accountUuid, instanceUuid, request);
  }

  // ===== 提醒管理 =====

  /**
   * 触发提醒
   */
  async triggerReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    await this.domainService.triggerReminder(accountUuid, instanceUuid, reminderId);
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<void> {
    await this.domainService.snoozeReminder(
      accountUuid,
      instanceUuid,
      reminderId,
      snoozeUntil,
      reason,
    );
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    await this.domainService.dismissReminder(accountUuid, instanceUuid, reminderId);
  }

  // ===== 统计和查询 =====

  /**
   * 获取任务统计信息
   */
  async getTaskStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO> {
    return await this.domainService.getTaskStats(accountUuid);
  }

  /**
   * 搜索任务
   */
  async searchTasks(
    accountUuid: string,
    queryParams: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.searchTasks(accountUuid, queryParams);
  }

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getUpcomingTasks(accountUuid, queryParams);
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getOverdueTasks(accountUuid, queryParams);
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getTodayTasks(accountUuid, queryParams);
  }
}
