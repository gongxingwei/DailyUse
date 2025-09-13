/**
 * Goal 领域仓储接口
 * 定义所有 Goal 相关实体的数据访问契约
 *
 * 注意：仓储层返回的是结构化数据（与DTO定义一致），而不是领域实体
 * 这样可以避免仓储层与领域层的紧耦合，并便于数据库直接映射
 */
import type { GoalContracts } from '@dailyuse/contracts';

export interface IGoalRepository {
  // ========================= Goal 相关 =========================

  /**
   * 创建目标
   */
  createGoal(
    accountUuid: string,
    goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.GoalDTO>;

  /**
   * 根据UUID获取目标
   */
  getGoalByUuid(accountUuid: string, uuid: string): Promise<GoalContracts.GoalDTO | null>;

  /**
   * 获取用户所有目标
   */
  getAllGoals(
    accountUuid: string,
    params?: GoalContracts.GoalQueryParams,
  ): Promise<{
    goals: GoalContracts.GoalDTO[];
    total: number;
  }>;

  /**
   * 更新目标
   */
  updateGoal(
    accountUuid: string,
    uuid: string,
    goalData: Partial<GoalContracts.GoalDTO>,
  ): Promise<GoalContracts.GoalDTO>;

  /**
   * 删除目标
   */
  deleteGoal(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 根据目录UUID获取目标列表
   */
  getGoalsByDirectoryUuid(
    accountUuid: string,
    directoryUuid: string,
  ): Promise<GoalContracts.GoalDTO[]>;

  /**
   * 根据状态获取目标列表
   */
  getGoalsByStatus(
    accountUuid: string,
    status: 'active' | 'completed' | 'paused' | 'archived',
  ): Promise<GoalContracts.GoalDTO[]>;

  /**
   * 批量更新目标状态
   */
  batchUpdateGoalStatus(
    accountUuid: string,
    uuids: string[],
    status: 'active' | 'completed' | 'paused' | 'archived',
  ): Promise<boolean>;

  // ========================= GoalDir 相关 =========================

  /**
   * 创建目标目录
   */
  createGoalDirectory(
    accountUuid: string,
    dirData: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.GoalDirDTO>;

  /**
   * 根据UUID获取目标目录
   */
  getGoalDirectoryByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalDirDTO | null>;

  /**
   * 获取用户所有目标目录
   */
  getAllGoalDirectories(
    accountUuid: string,
    params?: GoalContracts.GoalDirQueryParams,
  ): Promise<{
    goalDirs: GoalContracts.GoalDirDTO[];
    total: number;
  }>;

  /**
   * 更新目标目录
   */
  updateGoalDirectory(
    accountUuid: string,
    uuid: string,
    dirData: Partial<GoalContracts.GoalDirDTO>,
  ): Promise<GoalContracts.GoalDirDTO>;

  /**
   * 删除目标目录
   */
  deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 获取目录树结构
   */
  getGoalDirectoryTree(accountUuid: string): Promise<GoalContracts.GoalDirDTO[]>;

  // ========================= KeyResult 相关 =========================

  /**
   * 创建关键结果
   */
  createKeyResult(
    accountUuid: string,
    keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.KeyResultDTO>;

  /**
   * 根据UUID获取关键结果
   */
  getKeyResultByUuid(accountUuid: string, uuid: string): Promise<GoalContracts.KeyResultDTO | null>;

  /**
   * 根据目标UUID获取关键结果列表
   */
  getKeyResultsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.KeyResultDTO[]>;

  /**
   * 更新关键结果
   */
  updateKeyResult(
    accountUuid: string,
    uuid: string,
    keyResultData: Partial<GoalContracts.KeyResultDTO>,
  ): Promise<GoalContracts.KeyResultDTO>;

  /**
   * 删除关键结果
   */
  deleteKeyResult(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 更新关键结果进度
   */
  updateKeyResultProgress(
    accountUuid: string,
    uuid: string,
    value: number,
  ): Promise<GoalContracts.KeyResultDTO>;

  // ========================= GoalRecord 相关 =========================

  /**
   * 创建目标记录
   */
  createGoalRecord(
    accountUuid: string,
    recordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'>,
  ): Promise<GoalContracts.GoalRecordDTO>;

  /**
   * 根据UUID获取目标记录
   */
  getGoalRecordByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalRecordDTO | null>;

  /**
   * 根据目标UUID获取记录列表
   */
  getGoalRecordsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: Date; end?: Date };
    },
  ): Promise<{
    records: GoalContracts.GoalRecordDTO[];
    total: number;
  }>;

  /**
   * 根据关键结果UUID获取记录列表
   */
  getGoalRecordsByKeyResultUuid(
    accountUuid: string,
    keyResultUuid: string,
  ): Promise<GoalContracts.GoalRecordDTO[]>;

  /**
   * 更新目标记录
   */
  updateGoalRecord(
    accountUuid: string,
    uuid: string,
    recordData: Partial<GoalContracts.GoalRecordDTO>,
  ): Promise<GoalContracts.GoalRecordDTO>;

  /**
   * 删除目标记录
   */
  deleteGoalRecord(accountUuid: string, uuid: string): Promise<boolean>;

  // ========================= GoalReview 相关 =========================

  /**
   * 创建目标复盘
   */
  createGoalReview(
    accountUuid: string,
    reviewData: Omit<GoalContracts.GoalReviewDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<GoalContracts.GoalReviewDTO>;

  /**
   * 根据UUID获取目标复盘
   */
  getGoalReviewByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalReviewDTO | null>;

  /**
   * 根据目标UUID获取复盘列表
   */
  getGoalReviewsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalReviewDTO[]>;

  /**
   * 更新目标复盘
   */
  updateGoalReview(
    accountUuid: string,
    uuid: string,
    reviewData: Partial<GoalContracts.GoalReviewDTO>,
  ): Promise<GoalContracts.GoalReviewDTO>;

  /**
   * 删除目标复盘
   */
  deleteGoalReview(accountUuid: string, uuid: string): Promise<boolean>;

  // ========================= 统计和分析 =========================

  /**
   * 获取目标统计信息
   */
  getGoalStats(
    accountUuid: string,
    dateRange?: { start?: Date; end?: Date },
  ): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    pausedGoals: number;
    archivedGoals: number;
    overallProgress: number;
    avgKeyResultsPerGoal: number;
    completionRate: number;
  }>;

  /**
   * 获取进度趋势数据
   */
  getProgressTrend(
    accountUuid: string,
    goalUuid?: string,
    days?: number,
  ): Promise<
    Array<{
      date: string;
      progress: number;
    }>
  >;

  /**
   * 获取即将到期的目标
   */
  getUpcomingDeadlines(
    accountUuid: string,
    days?: number,
  ): Promise<
    Array<{
      goalUuid: string;
      goalName: string;
      endTime: number;
      daysRemaining: number;
      progress: number;
    }>
  >;

  // ========================= DDD聚合根控制方法 =========================

  /**
   * 加载完整的Goal聚合根
   * 包含目标、关键结果、记录、复盘等所有子实体
   * 用于聚合根业务操作
   */
  loadGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    goal: GoalContracts.GoalDTO;
    keyResults: GoalContracts.KeyResultDTO[];
    records: GoalContracts.GoalRecordDTO[];
    reviews: GoalContracts.GoalReviewDTO[];
  } | null>;

  /**
   * 原子性更新Goal聚合根
   * 在一个事务中更新目标及其所有子实体
   * 保证聚合一致性
   */
  updateGoalAggregate(
    accountUuid: string,
    aggregateData: {
      goal: Partial<GoalContracts.GoalDTO>;
      keyResults?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.KeyResultDTO | Partial<GoalContracts.KeyResultDTO>;
        uuid?: string;
      }>;
      records?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.GoalRecordDTO | Partial<GoalContracts.GoalRecordDTO>;
        uuid?: string;
      }>;
      reviews?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.GoalReviewDTO | Partial<GoalContracts.GoalReviewDTO>;
        uuid?: string;
      }>;
    },
  ): Promise<{
    goal: GoalContracts.GoalDTO;
    keyResults: GoalContracts.KeyResultDTO[];
    records: GoalContracts.GoalRecordDTO[];
    reviews: GoalContracts.GoalReviewDTO[];
  }>;

  /**
   * 验证聚合根业务规则
   * 在持久化前验证聚合的完整性和业务规则
   */
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    proposedChanges: {
      keyResults?: GoalContracts.KeyResultDTO[];
      records?: GoalContracts.GoalRecordDTO[];
    },
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      rule: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  }>;

  /**
   * 级联删除Goal聚合根
   * 删除目标及其所有相关子实体
   * 保证数据一致性
   */
  cascadeDeleteGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    deletedGoal: GoalContracts.GoalDTO;
    deletedKeyResults: GoalContracts.KeyResultDTO[];
    deletedRecords: GoalContracts.GoalRecordDTO[];
    deletedReviews: GoalContracts.GoalReviewDTO[];
  }>;

  /**
   * 聚合根版本控制
   * 实现乐观锁机制，防止并发修改冲突
   */
  updateGoalVersion(
    accountUuid: string,
    goalUuid: string,
    expectedVersion: number,
    newVersion: number,
  ): Promise<boolean>;

  /**
   * 获取聚合根变更历史
   * 用于审计和回滚操作
   */
  getGoalAggregateHistory(
    accountUuid: string,
    goalUuid: string,
    limit?: number,
  ): Promise<
    Array<{
      version: number;
      changedAt: number;
      changedBy: string;
      changeType: 'goal' | 'keyResult' | 'record' | 'review';
      entityUuid: string;
      changeData: any;
    }>
  >;
}
