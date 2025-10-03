import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskMetaTemplateRepository } from '@dailyuse/domain-server';
import { TaskMetaTemplateDomainService } from '../../domain/services/TaskMetaTemplateDomainService';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';

/**
 * TaskMetaTemplate 应用服务
 * 负责：
 * 1. 注入具体的 Repository 实现
 * 2. 协调领域服务
 * 3. 管理 TaskMetaTemplate 聚合根
 *
 * 设计原则（参考 GoalDirApplicationService）：
 * - TaskMetaTemplate 是独立的聚合根
 * - 用于创建任务模板的预设配置
 * - 业务逻辑委托给领域服务
 */
export class TaskMetaTemplateApplicationService {
  private static instance: TaskMetaTemplateApplicationService;
  private domainService: TaskMetaTemplateDomainService;
  private metaTemplateRepository: ITaskMetaTemplateRepository;

  constructor(metaTemplateRepository: ITaskMetaTemplateRepository) {
    this.metaTemplateRepository = metaTemplateRepository;
    this.domainService = new TaskMetaTemplateDomainService(metaTemplateRepository);
  }

  static async createInstance(
    metaTemplateRepository?: ITaskMetaTemplateRepository,
  ): Promise<TaskMetaTemplateApplicationService> {
    const taskContainer = TaskContainer.getInstance();
    metaTemplateRepository =
      metaTemplateRepository || (await taskContainer.getPrismaTaskMetaTemplateRepository());
    this.instance = new TaskMetaTemplateApplicationService(metaTemplateRepository);
    return this.instance;
  }

  static async getInstance(): Promise<TaskMetaTemplateApplicationService> {
    if (!this.instance) {
      TaskMetaTemplateApplicationService.instance =
        await TaskMetaTemplateApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===== TaskMetaTemplate 聚合根管理 =====

  /**
   * 创建任务元模板
   */
  async createMetaTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    return await this.domainService.createMetaTemplate(accountUuid, request);
  }

  /**
   * 获取任务元模板列表
   */
  async getMetaTemplates(
    accountUuid: string,
    queryParams: any,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const parsedParams = {
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 10,
      category: queryParams.category,
      isFavorite: queryParams.isFavorite === 'true',
      isActive: queryParams.isActive !== 'false', // 默认只显示激活的
      sortBy: queryParams.sortBy || 'usageCount',
      sortOrder: queryParams.sortOrder || 'desc',
    };

    return await this.domainService.getMetaTemplates(accountUuid, parsedParams);
  }

  /**
   * 获取任务元模板详情
   */
  async getMetaTemplateById(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse | null> {
    return await this.domainService.getMetaTemplateById(accountUuid, metaTemplateUuid);
  }

  /**
   * 更新任务元模板
   */
  async updateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
    request: TaskContracts.UpdateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    return await this.domainService.updateMetaTemplate(accountUuid, metaTemplateUuid, request);
  }

  /**
   * 删除任务元模板
   */
  async deleteMetaTemplate(accountUuid: string, metaTemplateUuid: string): Promise<void> {
    await this.domainService.deleteMetaTemplate(accountUuid, metaTemplateUuid);
  }

  // ===== TaskMetaTemplate 状态管理 =====

  /**
   * 激活任务元模板
   */
  async activateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    return await this.domainService.activateMetaTemplate(accountUuid, metaTemplateUuid);
  }

  /**
   * 停用任务元模板
   */
  async deactivateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    return await this.domainService.deactivateMetaTemplate(accountUuid, metaTemplateUuid);
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    return await this.domainService.toggleFavorite(accountUuid, metaTemplateUuid);
  }

  // ===== 基于元模板创建任务模板 =====

  /**
   * 使用元模板创建任务模板
   * 这个方法会记录元模板的使用次数
   */
  async createTemplateFromMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
    overrides?: {
      title?: string;
      description?: string;
      timeConfig?: Partial<TaskContracts.CreateTaskTemplateRequest['timeConfig']>;
    },
  ): Promise<TaskContracts.CreateTaskTemplateRequest> {
    return await this.domainService.createTemplateFromMetaTemplate(
      accountUuid,
      metaTemplateUuid,
      overrides,
    );
  }

  // ===== 查询和统计 =====

  /**
   * 按分类获取元模板
   */
  async getMetaTemplatesByCategory(
    accountUuid: string,
    category: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.domainService.getMetaTemplatesByCategory(accountUuid, category);
  }

  /**
   * 获取收藏的元模板
   */
  async getFavoriteMetaTemplates(
    accountUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.domainService.getFavoriteMetaTemplates(accountUuid);
  }

  /**
   * 获取热门元模板（按使用次数排序）
   */
  async getPopularMetaTemplates(
    accountUuid: string,
    limit?: number,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.domainService.getPopularMetaTemplates(accountUuid, limit);
  }

  /**
   * 获取最近使用的元模板
   */
  async getRecentlyUsedMetaTemplates(
    accountUuid: string,
    limit?: number,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.domainService.getRecentlyUsedMetaTemplates(accountUuid, limit);
  }
}
