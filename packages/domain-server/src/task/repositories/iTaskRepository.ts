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
