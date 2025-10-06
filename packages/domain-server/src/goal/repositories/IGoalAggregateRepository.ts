/**
 * Goal 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { GoalContracts } from '@dailyuse/contracts';
import type { Goal } from '../aggregates/Goal';

export interface IGoalAggregateRepository {
  // ===== Goal 聚合根 CRUD =====

  /**
   * 保存 Goal 聚合根（包含所有子实体：KeyResult, Record, Review）
   */
  saveGoal(accountUuid: string, goal: Goal): Promise<Goal>;

  /**
   * 根据 UUID 获取 Goal 聚合根（包含所有子实体）
   */
  getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null>;

  /**
   * 获取所有 Goal 聚合根（分页查询）
   */
  getAllGoals(
    accountUuid: string,
    params?: GoalContracts.GoalQueryParams,
  ): Promise<{ goals: Goal[]; total: number }>;

  /**
   * 根据目录 UUID 获取 Goal 列表
   */
  getGoalsByDirectoryUuid(accountUuid: string, directoryUuid: string): Promise<Goal[]>;

  /**
   * 根据状态获取 Goal 列表
   */
  getGoalsByStatus(accountUuid: string, status: GoalContracts.GoalStatus): Promise<Goal[]>;

  /**
   * 删除 Goal 聚合根（级联删除所有子实体）
   */
  deleteGoal(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 批量更新 Goal 状态
   */
  batchUpdateGoalStatus(
    accountUuid: string,
    uuids: string[],
    status: GoalContracts.GoalStatus,
  ): Promise<boolean>;

  // ===== 统计分析 =====

  /**
   * 获取 Goal 统计数据
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
   * 获取进度趋势
   */
  getProgressTrend(
    accountUuid: string,
    goalUuid?: string,
    days?: number,
  ): Promise<Array<{ date: string; progress: number }>>;

  /**
   * 获取即将到期的 Goal
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

  // ===== 聚合根业务规则验证 =====

  /**
   * 验证 Goal 聚合根业务规则
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
   * 聚合根版本控制（乐观锁）
   */
  updateGoalVersion(
    accountUuid: string,
    goalUuid: string,
    expectedVersion: number,
    newVersion: number,
  ): Promise<boolean>;

  /**
   * 获取聚合根变更历史
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
