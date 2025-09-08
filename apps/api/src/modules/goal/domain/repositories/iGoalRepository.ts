/**
 * Goal 领域仓储接口
 * 定义所有 Goal 相关实体的数据访问契约
 */

import { Goal, GoalDir, KeyResult, GoalRecord, GoalReview } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';

export interface IGoalRepository {
  // ========================= Goal 相关 =========================

  /**
   * 创建目标
   */
  createGoal(accountUuid: string, goal: Goal): Promise<Goal>;

  /**
   * 根据UUID获取目标
   */
  getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null>;

  /**
   * 获取用户所有目标
   */
  getAllGoals(accountUuid: string, params?: GoalContracts.GetGoalsParams): Promise<Goal[]>;

  /**
   * 更新目标
   */
  updateGoal(accountUuid: string, goal: Goal): Promise<Goal>;

  /**
   * 删除目标
   */
  deleteGoal(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 根据目录UUID获取目标列表
   */
  getGoalsByDirectoryUuid(accountUuid: string, directoryUuid: string): Promise<Goal[]>;

  /**
   * 根据状态获取目标列表
   */
  getGoalsByStatus(accountUuid: string, status: string): Promise<Goal[]>;

  // ========================= GoalDir 相关 =========================

  /**
   * 创建目标目录
   */
  createGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;

  /**
   * 根据UUID获取目标目录
   */
  getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null>;

  /**
   * 获取用户所有目标目录
   */
  getAllGoalDirectories(
    accountUuid: string,
    params?: GoalContracts.GetGoalDirsParams,
  ): Promise<GoalDir[]>;

  /**
   * 更新目标目录
   */
  updateGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;

  /**
   * 删除目标目录
   */
  deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean>;

  // ========================= KeyResult 相关 =========================

  /**
   * 创建关键结果
   */
  createKeyResult(accountUuid: string, keyResult: KeyResult): Promise<KeyResult>;

  /**
   * 根据目标UUID获取关键结果列表
   */
  getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string): Promise<KeyResult[]>;

  /**
   * 更新关键结果
   */
  updateKeyResult(accountUuid: string, keyResult: KeyResult): Promise<KeyResult>;

  /**
   * 删除关键结果
   */
  deleteKeyResult(accountUuid: string, uuid: string): Promise<boolean>;

  // ========================= GoalRecord 相关 =========================

  /**
   * 创建目标记录
   */
  createGoalRecord(accountUuid: string, record: GoalRecord): Promise<GoalRecord>;

  /**
   * 根据目标UUID获取记录列表
   */
  getGoalRecordsByGoalUuid(accountUuid: string, goalUuid: string): Promise<GoalRecord[]>;

  // ========================= GoalReview 相关 =========================

  /**
   * 创建目标审查
   */
  createGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview>;

  /**
   * 根据目标UUID获取审查列表
   */
  getGoalReviewsByGoalUuid(accountUuid: string, goalUuid: string): Promise<GoalReview[]>;
}
