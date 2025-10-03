import type { TaskContracts } from '@dailyuse/contracts';
import {
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
} from '@dailyuse/domain-server';
import { TaskDomainService } from '../../domain/services/TaskDomainService';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

/**
 * Task 应用服务
 *
 * 职责：
 * - 协调应用层业务流程
 * - 委托给 TaskDomainService 处理领域逻辑
 * - 处理事务边界
 *
 * 设计原则：
 * - 薄应用层：只做编排，不做业务逻辑
 * - 委托模式：委托给 TaskDomainService
 * - 单一入口：统一的服务入口
 */
export class TaskApplicationService {
  private static instance: TaskApplicationService;
  private domainService: TaskDomainService;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;

  constructor(
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ) {
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
    this.domainService = new TaskDomainService(templateRepository, instanceRepository);
  }

  static async createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): Promise<TaskApplicationService> {
    const container = TaskContainer.getInstance();
    templateRepository = templateRepository || (await container.getPrismaTaskTemplateRepository());
    instanceRepository = instanceRepository || (await container.getPrismaTaskInstanceRepository());
    this.instance = new TaskApplicationService(templateRepository, instanceRepository);
    return this.instance;
  }

  static async getInstance(): Promise<TaskApplicationService> {
    if (!this.instance) {
      TaskApplicationService.instance = await TaskApplicationService.createInstance();
    }
    return this.instance;
  }

  // ==================== TaskTemplate CRUD 操作 ====================

  async createTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.createTemplate(accountUuid, request);
  }

  async getTemplateById(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse | null> {
    return await this.domainService.getTemplateById(accountUuid, templateUuid);
  }

  async getTemplates(
    accountUuid: string,
    queryParams?: any,
  ): Promise<TaskContracts.TaskTemplateListResponse> {
    return await this.domainService.getTemplates(accountUuid, queryParams);
  }

  async updateTemplate(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.updateTemplate(accountUuid, templateUuid, request);
  }

  async deleteTemplate(accountUuid: string, templateUuid: string): Promise<void> {
    await this.domainService.deleteTemplate(accountUuid, templateUuid);
  }

  // ==================== TaskTemplate 状态管理 ====================

  async activateTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.activateTemplate(accountUuid, templateUuid);
  }

  async pauseTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.pauseTemplate(accountUuid, templateUuid);
  }

  async archiveTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    return await this.domainService.archiveTemplate(accountUuid, templateUuid);
  }

  // ==================== TaskInstance CRUD 操作 ====================

  async createInstance(
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.createInstance(accountUuid, request);
  }

  async getInstanceById(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse | null> {
    return await this.domainService.getInstanceById(accountUuid, instanceUuid);
  }

  async getInstances(
    accountUuid: string,
    queryParams?: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getInstances(accountUuid, queryParams);
  }

  async updateInstance(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.updateInstance(accountUuid, instanceUuid, request);
  }

  async deleteInstance(accountUuid: string, instanceUuid: string): Promise<void> {
    await this.domainService.deleteInstance(accountUuid, instanceUuid);
  }

  // ==================== TaskInstance 状态管理 ====================

  async completeTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.completeTask(accountUuid, instanceUuid, request);
  }

  async undoCompleteTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.undoCompleteTask(accountUuid, instanceUuid);
  }

  async rescheduleTask(
    accountUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.rescheduleTask(accountUuid, instanceUuid, request);
  }

  async cancelTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.cancelTask(accountUuid, instanceUuid);
  }

  async startTask(
    accountUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    return await this.domainService.startTask(accountUuid, instanceUuid);
  }

  // ==================== 提醒管理 ====================

  async triggerReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    await this.domainService.triggerReminder(accountUuid, instanceUuid, reminderId);
  }

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

  async dismissReminder(
    accountUuid: string,
    instanceUuid: string,
    reminderId: string,
  ): Promise<void> {
    await this.domainService.dismissReminder(accountUuid, instanceUuid, reminderId);
  }

  // ==================== 统计和查询 ====================

  async getTaskStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO> {
    return await this.domainService.getTaskStats(accountUuid);
  }

  async searchTasks(
    accountUuid: string,
    queryParams: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.searchTasks(accountUuid, queryParams);
  }

  async getUpcomingTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getUpcomingTasks(accountUuid, queryParams);
  }

  async getOverdueTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getOverdueTasks(accountUuid, queryParams);
  }

  async getTodayTasks(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getTodayTasks(accountUuid, queryParams);
  }
}
