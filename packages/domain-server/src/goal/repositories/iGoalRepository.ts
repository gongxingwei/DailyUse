/**
 * Goal 领域仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { GoalContracts } from '@dailyuse/contracts';
import type { Goal, GoalDir } from '../index';

export interface IGoalRepository {
  // Goal 聚合根
  saveGoal(accountUuid: string, goal: Goal): Promise<Goal>;
  getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null>;
  getAllGoals(
    accountUuid: string,
    params?: GoalContracts.GoalQueryParams,
  ): Promise<{ goals: Goal[]; total: number }>;
  getGoalsByDirectoryUuid(accountUuid: string, directoryUuid: string): Promise<Goal[]>;
  getGoalsByStatus(accountUuid: string, status: GoalContracts.GoalStatus): Promise<Goal[]>;
  deleteGoal(accountUuid: string, uuid: string): Promise<boolean>;
  batchUpdateGoalStatus(
    accountUuid: string,
    uuids: string[],
    status: GoalContracts.GoalStatus,
  ): Promise<boolean>;

  // GoalDir
  saveGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;
  getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null>;
  getAllGoalDirectories(
    accountUuid: string,
    params?: GoalContracts.GoalDirQueryParams,
  ): Promise<{ goalDirs: GoalDir[]; total: number }>;
  getGoalDirectoryTree(accountUuid: string): Promise<GoalDir[]>;
  deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean>;

  // 统计分析
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
  getProgressTrend(
    accountUuid: string,
    goalUuid?: string,
    days?: number,
  ): Promise<Array<{ date: string; progress: number }>>;
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
}
