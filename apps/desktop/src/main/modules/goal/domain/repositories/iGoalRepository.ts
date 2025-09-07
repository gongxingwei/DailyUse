import type { Goal } from '../aggregates/goal';
import type { GoalDir } from '../aggregates/goalDir';
import { GoalReview } from '../entities/goalReview';
import type { GoalRecord } from '../entities/record';

/**
 * Goal 仓库接口
 * 定义目标聚合根的持久化操作
 */
export interface IGoalRepository {
  // Goal 操作
  createGoal(accountUuid: string, goal: Goal): Promise<Goal>;
  getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null>;
  getAllGoals(accountUuid: string): Promise<Goal[]>;
  getGoalsByDirectory(accountUuid: string, directoryId: string): Promise<Goal[]>;
  updateGoal(accountUuid: string, goal: Goal): Promise<Goal>;
  deleteGoal(accountUuid: string, uuid: string): Promise<void>;

  // GoalDir 操作
  createGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;
  getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null>;
  getAllGoalDirectories(accountUuid: string): Promise<GoalDir[]>;
  updateGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;
  deleteGoalDirectory(accountUuid: string, uuid: string): Promise<void>;

  // GoalRecord 操作
  createGoalRecord(accountUuid: string, record: GoalRecord): Promise<GoalRecord>;
  getGoalRecordByUuid(accountUuid: string, uuid: string): Promise<GoalRecord | null>;
  getGoalRecordsByGoal(accountUuid: string, goalUuid: string): Promise<GoalRecord[]>;
  updateGoalRecord(accountUuid: string, record: GoalRecord): Promise<GoalRecord>;
  deleteGoalRecord(accountUuid: string, uuid: string): Promise<void>;

  // GoalReview 操作
  createGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview>;
  removeGoalReview(accountUuid: string, uuid: string): Promise<void>;
  getGoalReviewByUuid(accountUuid: string, uuid: string): Promise<GoalReview | null>;
  getGoalReviewsByGoal(accountUuid: string, goalUuid: string): Promise<GoalReview[]>;
  updateGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview>;

  // 批量操作
  batchDeleteGoals(accountUuid: string, uuids: string[]): Promise<void>;
  batchDeleteGoalRecords(accountUuid: string, uuids: string[]): Promise<void>;
}
