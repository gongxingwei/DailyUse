import type { TaskContracts } from '@dailyuse/contracts';
import type {
  ITaskMetaTemplateAggregateRepository,
  TaskMetaTemplate,
} from '@dailyuse/domain-server';
import { TaskDomainException, TaskErrorCode } from '@dailyuse/domain-server';

/**
 * TaskMetaTemplate 领域服务
 *
 * 职责：
 * - 处理 TaskMetaTemplate 聚合根的核心业务逻辑
 * - 通过 ITaskMetaTemplateAggregateRepository 接口操作数据（返回实体）
 * - 验证业务规则
 * - 管理元模板的使用统计
 *
 * 设计原则（参考 GoalDirDomainService）：
 * - 依赖倒置：只依赖仓储接口
 * - 单一职责：只处理 TaskMetaTemplate 聚合根相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 * - 仓储返回实体，服务层转换为DTO/ClientDTO
 */
export class TaskMetaTemplateDomainService {
  constructor(private readonly metaTemplateRepository: ITaskMetaTemplateAggregateRepository) {}

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

    // 保存到仓储（返回实体）
    const savedEntity = await this.metaTemplateRepository.saveMetaTemplate(
      accountUuid,
      metaTemplateEntity,
    );

    // 转换为DTO返回
    return savedEntity.toDTO();
  }

  /**
   * 获取任务元模板详情
   */
  async getMetaTemplateById(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse | null> {
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      return null;
    }

    return entity.toDTO();
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
    const limit = queryParams.limit || 10;
    const offset = ((queryParams.page || 1) - 1) * limit;

    // 调用仓储获取实体列表
    const result = await this.metaTemplateRepository.getAllMetaTemplates(accountUuid, {
      isActive: queryParams.isActive,
      isFavorite: queryParams.isFavorite,
      category: queryParams.category,
      limit,
      offset,
      sortBy: (queryParams.sortBy as any) || 'usageCount',
      sortOrder: queryParams.sortOrder || 'desc',
    });

    // 转换为DTO
    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: queryParams.page || 1,
      limit,
      hasMore: offset + limit < result.total,
    };
  }

  /**
   * 更新任务元模板
   */
  async updateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
    request: TaskContracts.UpdateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    // 获取现有实体
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    // 应用更新
    if (request.name !== undefined) {
      entity.updateName(request.name);
    }

    if (request.appearance !== undefined) {
      entity.updateAppearance(request.appearance);
    }

    // 保存更新后的实体
    const savedEntity = await this.metaTemplateRepository.saveMetaTemplate(accountUuid, entity);

    return savedEntity.toDTO();
  }

  /**
   * 删除任务元模板
   */
  async deleteMetaTemplate(accountUuid: string, metaTemplateUuid: string): Promise<void> {
    const exists = await this.metaTemplateRepository.metaTemplateExists(
      accountUuid,
      metaTemplateUuid,
    );

    if (!exists) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    await this.metaTemplateRepository.deleteMetaTemplate(accountUuid, metaTemplateUuid);
  }

  // ===== TaskMetaTemplate 状态管理 =====

  /**
   * 激活任务元模板
   */
  async activateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    entity.activate();

    const savedEntity = await this.metaTemplateRepository.saveMetaTemplate(accountUuid, entity);
    return savedEntity.toDTO();
  }

  /**
   * 停用任务元模板
   */
  async deactivateMetaTemplate(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    entity.deactivate();

    const savedEntity = await this.metaTemplateRepository.saveMetaTemplate(accountUuid, entity);
    return savedEntity.toDTO();
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(
    accountUuid: string,
    metaTemplateUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateResponse> {
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    entity.toggleFavorite();

    const savedEntity = await this.metaTemplateRepository.saveMetaTemplate(accountUuid, entity);
    return savedEntity.toDTO();
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
    const entity = await this.metaTemplateRepository.getMetaTemplateByUuid(
      accountUuid,
      metaTemplateUuid,
    );

    if (!entity) {
      throw new TaskDomainException(TaskErrorCode.META_TEMPLATE_NOT_FOUND, '元模板不存在');
    }

    // 使用元模板
    entity.use();

    // 保存更新后的使用统计
    await this.metaTemplateRepository.saveMetaTemplate(accountUuid, entity);

    // 基于元模板生成任务模板请求
    const dto = entity.toDTO();
    return {
      title: overrides?.title || dto.name,
      description: overrides?.description || dto.description,
      timeConfig: {
        time: {
          timeType: dto.defaultTimeConfig.timeType,
          startTime: dto.defaultTimeConfig.commonTimeSettings?.startTime,
          endTime: dto.defaultTimeConfig.commonTimeSettings?.endTime,
        },
        date: {
          startDate: new Date().toISOString(),
          endDate: undefined,
        },
        schedule: {
          mode: dto.defaultTimeConfig.scheduleMode,
          intervalDays: undefined,
          weekdays: [],
          monthDays: [],
        },
        timezone: dto.defaultTimeConfig.timezone,
        ...overrides?.timeConfig,
      },
      reminderConfig: dto.defaultReminderConfig,
      properties: dto.defaultProperties,
      goalLinks: [],
    };
  }

  // ===== 查询和统计 =====

  /**
   * 按分类获取元模板
   */
  async getMetaTemplatesByCategory(
    accountUuid: string,
    category: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const result = await this.metaTemplateRepository.getAllMetaTemplates(accountUuid, {
      category,
      isActive: true,
    });

    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: 1,
      limit: result.total,
      hasMore: false,
    };
  }

  /**
   * 获取收藏的元模板
   */
  async getFavoriteMetaTemplates(
    accountUuid: string,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const result = await this.metaTemplateRepository.getAllMetaTemplates(accountUuid, {
      isFavorite: true,
      isActive: true,
    });

    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: 1,
      limit: result.total,
      hasMore: false,
    };
  }

  /**
   * 获取热门元模板（按使用次数排序）
   */
  async getPopularMetaTemplates(
    accountUuid: string,
    limit: number = 10,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const result = await this.metaTemplateRepository.getAllMetaTemplates(accountUuid, {
      isActive: true,
      limit,
      sortBy: 'usageCount',
      sortOrder: 'desc',
    });

    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: 1,
      limit,
      hasMore: result.total > limit,
    };
  }

  /**
   * 获取最近使用的元模板
   */
  async getRecentlyUsedMetaTemplates(
    accountUuid: string,
    limit: number = 10,
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const result = await this.metaTemplateRepository.getAllMetaTemplates(accountUuid, {
      isActive: true,
      limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: 1,
      limit,
      hasMore: result.total > limit,
    };
  }

  /**
   * 搜索元模板
   */
  async searchMetaTemplates(
    accountUuid: string,
    query: string,
    options?: {
      limit?: number;
      page?: number;
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const limit = options?.limit || 10;
    const offset = ((options?.page || 1) - 1) * limit;

    const result = await this.metaTemplateRepository.searchMetaTemplates(accountUuid, query, {
      limit,
      offset,
    });

    return {
      data: result.metaTemplates.map((entity) => entity.toDTO()),
      total: result.total,
      page: options?.page || 1,
      limit,
      hasMore: offset + limit < result.total,
    };
  }

  /**
   * 统计元模板数量
   */
  async countMetaTemplates(
    accountUuid: string,
    isActive?: boolean,
  ): Promise<{ total: number; active: number; inactive: number }> {
    const [total, active] = await Promise.all([
      this.metaTemplateRepository.countMetaTemplates(accountUuid),
      this.metaTemplateRepository.countMetaTemplates(accountUuid, true),
    ]);

    return {
      total,
      active,
      inactive: total - active,
    };
  }
}
