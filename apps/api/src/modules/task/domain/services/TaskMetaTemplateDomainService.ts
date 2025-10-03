import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskMetaTemplateRepository, TaskMetaTemplate } from '@dailyuse/domain-server';
import { TaskDomainException } from '@dailyuse/domain-server';

/**
 * TaskMetaTemplate 领域服务
 *
 * 职责：
 * - 处理 TaskMetaTemplate 聚合根的核心业务逻辑
 * - 通过 ITaskMetaTemplateRepository 接口操作数据
 * - 验证业务规则
 * - 管理元模板的使用统计
 *
 * 设计原则（参考 GoalDirDomainService）：
 * - 依赖倒置：只依赖仓储接口
 * - 单一职责：只处理 TaskMetaTemplate 聚合根相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 */
export class TaskMetaTemplateDomainService {
  constructor(private readonly metaTemplateRepository: ITaskMetaTemplateRepository) {}

  // ===== TaskMetaTemplate CRUD 操作 =====

  /**
   * 创建任务元模板
   */
  async createMetaTemplate(
    accountUuid: string,
    request: TaskContracts.CreateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    // 动态导入实体类
    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');

    // 创建元模板实体
    const metaTemplateEntity = TaskMetaTemplate.create({
      accountUuid,
      name: request.name,
      description: request.description,
      appearance: request.appearance,
      defaultTimeConfig: request.defaultTimeConfig,
      defaultReminderConfig: request.defaultReminderConfig,
      defaultProperties: request.defaultProperties,
    });

    // 保存到仓储
    const metaTemplateDTO = metaTemplateEntity.toDTO();
    await this.metaTemplateRepository.save(metaTemplateDTO);

    return metaTemplateDTO;
  }

  /**
   * 获取任务元模板详情
   */
  async getMetaTemplateById(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse | null> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO || metaTemplateDTO.accountUuid !== accountUuid) {
      return null;
    }

    return metaTemplateDTO;
  }

  /**
   * 获取任务元模板列表
   */
  async getMetaTemplates(
    accountUuid: string,
    queryParams: {
      page?: number;
      limit?: number;
      category?: string;
      isFavorite?: boolean;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    // 使用 findByAccountUuid 方法
    return await this.metaTemplateRepository.findByAccountUuid(accountUuid, {
      limit: queryParams.limit || 10,
      offset: ((queryParams.page || 1) - 1) * (queryParams.limit || 10),
      isActive: queryParams.isActive,
      sortBy: (queryParams.sortBy as any) || 'usageCount',
      sortOrder: queryParams.sortOrder || 'desc',
    });
  }

  /**
   * 更新任务元模板
   */
  async updateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
    request: TaskContracts.UpdateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权访问此元模板');
    }

    // 动态导入实体类
    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');
    const metaTemplateEntity = TaskMetaTemplate.fromDTO(metaTemplateDTO);

    // 更新属性
    if (request.name !== undefined) {
      metaTemplateEntity.updateName(request.name);
    }

    if (request.appearance !== undefined) {
      metaTemplateEntity.updateAppearance(request.appearance);
    }

    // 保存更新
    const updatedDTO = metaTemplateEntity.toDTO();
    await this.metaTemplateRepository.save(updatedDTO);

    return updatedDTO;
  }

  /**
   * 删除任务元模板
   */
  async deleteMetaTemplate(accountUuid: string, metaTemplateUuid: string): Promise<void> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权删除此元模板');
    }

    await this.metaTemplateRepository.delete(metaTemplateUuid);
  }

  // ===== TaskMetaTemplate 状态管理 =====

  /**
   * 激活任务元模板
   */
  async activateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权访问此元模板');
    }

    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');
    const metaTemplateEntity = TaskMetaTemplate.fromDTO(metaTemplateDTO);

    metaTemplateEntity.activate();

    const updatedDTO = metaTemplateEntity.toDTO();
    await this.metaTemplateRepository.save(updatedDTO);

    return updatedDTO;
  }

  /**
   * 停用任务元模板
   */
  async deactivateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权访问此元模板');
    }

    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');
    const metaTemplateEntity = TaskMetaTemplate.fromDTO(metaTemplateDTO);

    metaTemplateEntity.deactivate();

    const updatedDTO = metaTemplateEntity.toDTO();
    await this.metaTemplateRepository.save(updatedDTO);

    return updatedDTO;
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权访问此元模板');
    }

    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');
    const metaTemplateEntity = TaskMetaTemplate.fromDTO(metaTemplateDTO);

    metaTemplateEntity.toggleFavorite();

    const updatedDTO = metaTemplateEntity.toDTO();
    await this.metaTemplateRepository.save(updatedDTO);

    return updatedDTO;
  }

  // ===== 基于元模板创建任务模板 =====

  /**
   * 使用元模板创建任务模板配置
   * 返回用于创建 TaskTemplate 的请求对象
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
    const metaTemplateDTO = await this.metaTemplateRepository.findById(metaTemplateUuid);

    if (!metaTemplateDTO) {
      throw TaskDomainException.templateNotFound(metaTemplateUuid);
    }

    if (metaTemplateDTO.accountUuid !== accountUuid) {
      throw TaskDomainException.businessRuleViolation('无权访问此元模板');
    }

    // 记录使用
    const { TaskMetaTemplate } = await import('@dailyuse/domain-server');
    const metaTemplateEntity = TaskMetaTemplate.fromDTO(metaTemplateDTO);
    metaTemplateEntity.use();
    await this.metaTemplateRepository.save(metaTemplateEntity.toDTO());

    // 构建任务模板创建请求
    const now = new Date();
    const templateRequest: TaskContracts.CreateTaskTemplateRequest = {
      title: overrides?.title || `基于${metaTemplateDTO.name}的任务`,
      description: overrides?.description || metaTemplateDTO.description,
      timeConfig: {
        time: {
          timeType: metaTemplateDTO.defaultTimeConfig.timeType,
          startTime: metaTemplateDTO.defaultTimeConfig.commonTimeSettings?.startTime,
          endTime: metaTemplateDTO.defaultTimeConfig.commonTimeSettings?.endTime,
        },
        date: {
          startDate: now.toISOString(),
          endDate: undefined,
        },
        schedule: {
          mode: metaTemplateDTO.defaultTimeConfig.scheduleMode,
        },
        timezone: metaTemplateDTO.defaultTimeConfig.timezone,
        ...overrides?.timeConfig,
      },
      reminderConfig: metaTemplateDTO.defaultReminderConfig,
      properties: metaTemplateDTO.defaultProperties,
    };

    return templateRequest;
  }

  // ===== 查询和统计 =====

  /**
   * 按分类获取元模板
   */
  async getMetaTemplatesByCategory(
    accountUuid: string,
    category: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.metaTemplateRepository.findByCategory(accountUuid, category);
  }

  /**
   * 获取收藏的元模板
   */
  async getFavoriteMetaTemplates(
    accountUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.metaTemplateRepository.findFavorites(accountUuid);
  }

  /**
   * 获取热门元模板（按使用次数排序）
   */
  async getPopularMetaTemplates(
    accountUuid: string,
    limit: number = 10,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    return await this.metaTemplateRepository.findPopular(accountUuid, {
      limit: limit,
      minUsageCount: 1,
    });
  }

  /**
   * 获取最近使用的元模板
   */
  async getRecentlyUsedMetaTemplates(
    accountUuid: string,
    limit: number = 10,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    // 使用 findByAccountUuid 并按 lastUsedAt 排序
    return await this.metaTemplateRepository.findByAccountUuid(accountUuid, {
      limit: limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }
}
