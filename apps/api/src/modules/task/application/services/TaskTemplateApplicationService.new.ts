import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskTemplateRepository, ITaskInstanceRepository } from '@dailyuse/domain-server';
import { TaskTemplateDomainService } from '../../domain/services/TaskTemplateDomainService';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

/**
 * TaskTemplate 应用服务
 * 负责：
 * 1. 注入具体的 Repository 实现
 * 2. 协调领域服务
 * 3. 管理 TaskTemplate 聚合根及其子实体（TaskInstance）
 *
 * 设计原则（参考 GoalApplicationService）：
 * - 通过聚合根控制所有子实体操作
 * - TaskInstance 必须通过 TaskTemplate 来创建/更新/删除
 * - 业务逻辑委托给领域服务
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
    const parsedParams: TaskContracts.TaskTemplateQueryParams = {
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 10,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : undefined,
      status: queryParams.status,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    };

    return await this.domainService.getTemplates(accountUuid, parsedParams);
  }

  /**
   * 获取任务模板详情
   */
  async getTemplateById(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO | null> {
    return await this.domainService.getTemplateById(accountUuid, templateUuid);
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
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
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    return await this.domainService.activateTemplate(accountUuid, templateUuid);
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    return await this.domainService.pauseTemplate(accountUuid, templateUuid);
  }

  /**
   * 完成任务模板
   */
  async completeTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    return await this.domainService.completeTemplate(accountUuid, templateUuid);
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    return await this.domainService.archiveTemplate(accountUuid, templateUuid);
  }

  // ===== DDD 聚合根控制方法 - TaskInstance 管理 =====

  /**
   * 通过聚合根创建任务实例
   * 体现DDD原则：TaskInstance 必须通过 TaskTemplate 聚合根创建
   */
  async createInstance(
    accountUuid: string,
    templateUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return await this.domainService.createInstanceForTemplate(accountUuid, templateUuid, request);
  }

  /**
   * 通过聚合根更新任务实例
   */
  async updateInstance(
    accountUuid: string,
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return await this.domainService.updateInstanceForTemplate(
      accountUuid,
      templateUuid,
      instanceUuid,
      request,
    );
  }

  /**
   * 通过聚合根删除任务实例
   */
  async deleteInstance(
    accountUuid: string,
    templateUuid: string,
    instanceUuid: string,
  ): Promise<void> {
    await this.domainService.deleteInstanceForTemplate(accountUuid, templateUuid, instanceUuid);
  }

  /**
   * 获取模板的所有任务实例
   */
  async getTemplateInstances(
    accountUuid: string,
    templateUuid: string,
    queryParams?: any,
  ): Promise<TaskContracts.TaskInstanceListResponse> {
    return await this.domainService.getTemplateInstances(accountUuid, templateUuid, queryParams);
  }

  // ===== TaskInstance 状态管理（通过聚合根）=====

  /**
   * 完成任务实例
   */
  async completeInstance(
    accountUuid: string,
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return await this.domainService.completeTaskInstance(
      accountUuid,
      templateUuid,
      instanceUuid,
      request,
    );
  }

  /**
   * 取消任务实例
   */
  async cancelInstance(
    accountUuid: string,
    templateUuid: string,
    instanceUuid: string,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return await this.domainService.cancelTaskInstance(accountUuid, templateUuid, instanceUuid);
  }

  /**
   * 重新调度任务实例
   */
  async rescheduleInstance(
    accountUuid: string,
    templateUuid: string,
    instanceUuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    return await this.domainService.rescheduleTaskInstance(
      accountUuid,
      templateUuid,
      instanceUuid,
      request,
    );
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取完整的 TaskTemplate 聚合根视图
   * 包含模板及所有相关任务实例
   */
  async getTemplateAggregateView(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskTemplateAggregateViewResponse> {
    return await this.domainService.getTemplateAggregateView(accountUuid, templateUuid);
  }

  // ===== 统计和查询 =====

  /**
   * 获取模板统计信息
   */
  async getTemplateStats(
    accountUuid: string,
    templateUuid: string,
  ): Promise<TaskContracts.TaskStatsDTO> {
    return await this.domainService.getTemplateStats(accountUuid, templateUuid);
  }

  /**
   * 批量生成任务实例（根据调度规则）
   */
  async generateScheduledInstances(
    accountUuid: string,
    templateUuid: string,
    request: {
      startDate: Date;
      endDate: Date;
    },
  ): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    return await this.domainService.generateScheduledInstances(accountUuid, templateUuid, request);
  }
}
