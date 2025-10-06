/**
 * GoalDir 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { GoalContracts } from '@dailyuse/contracts';
import type { GoalDir } from '../aggregates/GoalDir';

export interface IGoalDirRepository {
  // ===== GoalDir 聚合根 CRUD =====

  /**
   * 保存 GoalDir 聚合根
   */
  saveGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir>;

  /**
   * 根据 UUID 获取 GoalDir
   */
  getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null>;

  /**
   * 获取所有 GoalDir（分页查询）
   */
  getAllGoalDirectories(
    accountUuid: string,
    params?: GoalContracts.GoalDirQueryParams,
  ): Promise<{ goalDirs: GoalDir[]; total: number }>;

  /**
   * 获取目录树结构（包含所有层级）
   */
  getGoalDirectoryTree(accountUuid: string): Promise<GoalDir[]>;

  /**
   * 删除 GoalDir
   */
  deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean>;
}
