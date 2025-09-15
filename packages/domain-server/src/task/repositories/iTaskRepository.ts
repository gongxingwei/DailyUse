import type { TaskContracts } from '@dailyuse/contracts';

/**
 * 任务模板仓储接口
 */
export interface ITaskTemplateRepository {
  /**
   * 根据ID查找任务模板
   */
  findById(uuid: string): Promise<TaskContracts.TaskTemplateDTO | null>;

  /**
   * 根据账户UUID查找任务模板列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskContracts.TaskTemplateListResponse>;

  /**
   * 根据状态查找任务模板
   */
  findByStatus(
    accountUuid: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskTemplateListResponse>;

  /**
   * 搜索任务模板
   */
  search(
    accountUuid: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskTemplateListResponse>;

  /**
   * 保存任务模板
   */
  save(taskTemplate: TaskContracts.TaskTemplateDTO): Promise<void>;

  /**
   * 删除任务模板
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除任务模板
   */
  deleteBatch(uuids: string[]): Promise<void>;

  /**
   * 统计任务模板数量
   */
  count(accountUuid: string, status?: string): Promise<number>;

  /**
   * 检查任务模板是否存在
   */
  exists(uuid: string): Promise<boolean>;
}

/**
 * 任务实例仓储接口
 */
export interface ITaskInstanceRepository {
  /**
   * 根据ID查找任务实例
   */
  findById(uuid: string): Promise<TaskContracts.TaskInstanceDTO | null>;

  /**
   * 根据模板UUID查找任务实例列表
   */
  findByTemplateUuid(
    templateUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 根据账户UUID查找任务实例列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt' | 'importance' | 'urgency';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 查询任务实例
   */
  query(
    queryParams: TaskContracts.TaskQueryParamsDTO,
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 根据日期范围查找任务实例
   */
  findByDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 根据状态查找任务实例
   */
  findByStatus(
    accountUuid: string,
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 查找逾期任务实例
   */
  findOverdue(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 查找今日任务实例
   */
  findToday(
    accountUuid: string,
    timezone: string,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 查找本周任务实例
   */
  findThisWeek(
    accountUuid: string,
    timezone: string,
    options?: {
      status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 查找提醒待触发的任务实例
   */
  findPendingReminders(
    beforeTime: Date,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskInstanceListResponse>;

  /**
   * 保存任务实例
   */
  save(taskInstance: TaskContracts.TaskInstanceDTO): Promise<void>;

  /**
   * 删除任务实例
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除任务实例
   */
  deleteBatch(uuids: string[]): Promise<void>;

  /**
   * 统计任务实例数量
   */
  count(accountUuid: string, status?: string): Promise<number>;

  /**
   * 统计模板的实例数量
   */
  countByTemplate(templateUuid: string): Promise<number>;

  /**
   * 统计模板的已完成实例数量
   */
  countCompletedByTemplate(templateUuid: string): Promise<number>;

  /**
   * 检查任务实例是否存在
   */
  exists(uuid: string): Promise<boolean>;
}

/**
 * 任务元模板仓储接口
 */
export interface ITaskMetaTemplateRepository {
  /**
   * 根据ID查找任务元模板
   */
  findById(uuid: string): Promise<TaskContracts.TaskMetaTemplateDTO | null>;

  /**
   * 根据账户UUID查找任务元模板列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'usageCount';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse>;

  /**
   * 根据分类查找任务元模板
   */
  findByCategory(
    accountUuid: string,
    category: string,
    options?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse>;

  /**
   * 查找收藏的任务元模板
   */
  findFavorites(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse>;

  /**
   * 查找常用的任务元模板
   */
  findPopular(
    accountUuid: string,
    options?: {
      minUsageCount?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse>;

  /**
   * 搜索任务元模板
   */
  search(
    accountUuid: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<TaskContracts.TaskMetaTemplateListResponse>;

  /**
   * 保存任务元模板
   */
  save(taskMetaTemplate: TaskContracts.TaskMetaTemplateDTO): Promise<void>;

  /**
   * 删除任务元模板
   */
  delete(uuid: string): Promise<void>;

  /**
   * 统计任务元模板数量
   */
  count(accountUuid: string, isActive?: boolean): Promise<number>;

  /**
   * 检查任务元模板是否存在
   */
  exists(uuid: string): Promise<boolean>;
}

/**
 * 任务统计仓储接口
 */
export interface ITaskStatsRepository {
  /**
   * 获取账户的任务统计
   */
  getAccountStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO>;

  /**
   * 获取模板的任务统计
   */
  getTemplateStats(templateUuid: string): Promise<TaskContracts.TaskStatsDTO['byTemplate'][0]>;

  /**
   * 获取日期范围内的任务统计
   */
  getDateRangeStats(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TaskContracts.TaskStatsDTO['byTimePeriod']>;

  /**
   * 获取任务完成趋势
   */
  getCompletionTrends(
    accountUuid: string,
    days: number,
  ): Promise<TaskContracts.TaskStatsDTO['trends']>;

  /**
   * 获取任务效率分析
   */
  getEfficiencyAnalysis(
    accountUuid: string,
    templateUuids?: string[],
  ): Promise<{
    avgDuration: number;
    onTimeRate: number;
    completionRate: number;
    overdueRate: number;
  }>;
}

/**
 * 任务模板聚合根仓储扩展接口
 * 支持聚合根级别的原子操作和一致性管理
 */
export interface ITaskTemplateAggregateRepository extends ITaskTemplateRepository {
  /**
   * 加载任务模板聚合根（包含关联的实例）
   */
  loadAggregate(
    templateUuid: string,
    options?: {
      includeInstances?: boolean;
      includeStats?: boolean;
      includeMetaTemplate?: boolean;
    },
  ): Promise<{
    template: TaskContracts.TaskTemplateDTO;
    instances?: TaskContracts.TaskInstanceDTO[];
    stats?: TaskContracts.TaskStatsDTO['byTemplate'][0];
    metaTemplate?: TaskContracts.TaskMetaTemplateDTO;
  } | null>;

  /**
   * 保存任务模板聚合根（原子操作）
   */
  saveAggregate(
    templateAggregate: {
      template: TaskContracts.TaskTemplateDTO;
      instances?: TaskContracts.TaskInstanceDTO[];
      metaTemplate?: TaskContracts.TaskMetaTemplateDTO;
    },
    options?: {
      validateConsistency?: boolean;
      cascadeInstances?: boolean;
    },
  ): Promise<void>;

  /**
   * 更新任务模板聚合根
   */
  updateAggregate(
    templateUuid: string,
    updates: Partial<TaskContracts.TaskTemplateDTO>,
    options?: {
      updateInstances?: boolean;
      preserveCustomizations?: boolean;
    },
  ): Promise<void>;

  /**
   * 原子更新操作
   */
  atomicUpdate(
    templateUuid: string,
    operation: (template: TaskContracts.TaskTemplateDTO) => Promise<TaskContracts.TaskTemplateDTO>,
  ): Promise<void>;

  /**
   * 验证聚合根一致性
   */
  validateAggregateConsistency(templateUuid: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * 获取聚合根统计信息
   */
  getAggregateStatistics(templateUuid: string): Promise<{
    totalInstances: number;
    completedInstances: number;
    pendingInstances: number;
    overdueInstances: number;
    averageCompletionTime: number;
    lastActivityDate: Date | null;
  }>;

  /**
   * 批量处理聚合根操作
   */
  batchProcessAggregates(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      templateUuid?: string;
      data?: Partial<TaskContracts.TaskTemplateDTO>;
    }>,
  ): Promise<{
    successful: string[];
    failed: Array<{ templateUuid: string; error: string }>;
  }>;
}

/**
 * 任务实例聚合根仓储扩展接口
 * 支持聚合根级别的原子操作和生命周期管理
 */
export interface ITaskInstanceAggregateRepository extends ITaskInstanceRepository {
  /**
   * 加载任务实例聚合根（包含模板和依赖）
   */
  loadAggregate(
    instanceUuid: string,
    options?: {
      includeTemplate?: boolean;
      includeDependencies?: boolean;
      includeHistory?: boolean;
    },
  ): Promise<{
    instance: TaskContracts.TaskInstanceDTO;
    template?: TaskContracts.TaskTemplateDTO;
    dependencies?: TaskContracts.TaskInstanceDTO[];
    history?: Array<{
      status: string;
      timestamp: Date;
      duration?: number;
    }>;
  } | null>;

  /**
   * 保存任务实例聚合根（原子操作）
   */
  saveAggregate(
    instanceAggregate: {
      instance: TaskContracts.TaskInstanceDTO;
      template?: TaskContracts.TaskTemplateDTO;
      dependencies?: TaskContracts.TaskInstanceDTO[];
    },
    options?: {
      validateConsistency?: boolean;
      updateTemplate?: boolean;
    },
  ): Promise<void>;

  /**
   * 更新任务实例聚合根
   */
  updateAggregate(
    instanceUuid: string,
    updates: Partial<TaskContracts.TaskInstanceDTO>,
    options?: {
      cascadeToTemplate?: boolean;
      notifyDependents?: boolean;
    },
  ): Promise<void>;

  /**
   * 原子更新操作
   */
  atomicUpdate(
    instanceUuid: string,
    operation: (instance: TaskContracts.TaskInstanceDTO) => Promise<TaskContracts.TaskInstanceDTO>,
  ): Promise<void>;

  /**
   * 批量处理实例操作
   */
  batchProcessInstances(
    operations: Array<{
      type: 'create' | 'update' | 'complete' | 'cancel' | 'delete';
      instanceUuid?: string;
      templateUuid?: string;
      data?: Partial<TaskContracts.TaskInstanceDTO>;
    }>,
  ): Promise<{
    successful: string[];
    failed: Array<{ instanceUuid: string; error: string }>;
  }>;

  /**
   * 生命周期分析
   */
  getLifecycleAnalysis(instanceUuid: string): Promise<{
    createdAt: Date;
    lastUpdatedAt: Date;
    statusHistory: Array<{
      status: string;
      timestamp: Date;
      duration?: number;
    }>;
    totalDuration: number;
    currentPhase: string;
  }>;

  /**
   * 依赖关系管理
   */
  manageDependencies(
    instanceUuid: string,
    action: 'add' | 'remove' | 'update',
    dependencies: string[],
  ): Promise<{
    updated: boolean;
    conflictsResolved: string[];
    errors: string[];
  }>;

  /**
   * 验证聚合根一致性
   */
  validateAggregateConsistency(instanceUuid: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}
