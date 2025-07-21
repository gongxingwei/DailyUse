import type { Goal } from '../aggregates/goal';
import type { GoalDir } from '../aggregates/goalDir';
import type { Record } from '../entities/record';
import type { IGoalCreateDTO, IGoalDir, IRecordCreateDTO, IKeyResult } from '@common/modules/goal/types/goal';

/**
 * Goal 仓库接口
 * 定义目标聚合根的持久化操作
 */
export interface IGoalRepository {
  // ========== Goal 操作 ==========
  
  /**
   * 创建目标
   */
  createGoal(accountUuid: string, data: IGoalCreateDTO): Promise<Goal>;
  
  /**
   * 根据ID获取目标
   */
  getGoalById(uuid: string): Promise<Goal | null>;
  
  /**
   * 获取所有目标
   */
  getAllGoals(accountUuid: string): Promise<Goal[]>;
  
  /**
   * 根据目录获取目标
   */
  getGoalsByDirectory(accountUuid: string, directoryId: string): Promise<Goal[]>;
  
  /**
   * 更新目标
   */
  updateGoal(uuid: string, updates: Partial<IGoalCreateDTO>): Promise<Goal>;
  
  /**
   * 删除目标
   */
  deleteGoal(uuid: string): Promise<void>;

  // ========== Goal Directory 操作 ==========
  
  /**
   * 创建目标目录
   */
  createGoalDirectory(accountUuid: string, data: IGoalDir): Promise<GoalDir>;
  
  /**
   * 根据ID获取目标目录
   */
  getGoalDirectoryById(uuid: string): Promise<GoalDir | null>;
  
  /**
   * 获取所有目标目录
   */
  getAllGoalDirectories(accountUuid: string): Promise<GoalDir[]>;
  
  /**
   * 更新目标目录
   */
  updateGoalDirectory(data: IGoalDir): Promise<GoalDir>;
  
  /**
   * 删除目标目录
   */
  deleteGoalDirectory(uuid: string): Promise<void>;

  // ========== Record 操作 ==========
  
  /**
   * 创建记录
   */
  createRecord(accountUuid: string, data: IRecordCreateDTO): Promise<Record>;
  
  /**
   * 根据ID获取记录
   */
  getRecordById(uuid: string): Promise<Record | null>;
  
  /**
   * 获取目标的所有记录
   */
  getRecordsByGoal(goalUuid: string): Promise<Record[]>;
  
  /**
   * 更新记录
   */
  updateRecord(uuid: string, updates: Partial<IRecordCreateDTO>): Promise<Record>;
  
  /**
   * 删除记录
   */
  deleteRecord(uuid: string): Promise<void>;

  // ========== Key Result 操作 ==========
  
  


  // ========== 批量操作 ==========
  
  /**
   * 批量删除目标
   */
  batchDeleteGoals(ids: string[]): Promise<void>;
  
  /**
   * 批量删除记录
   */
  batchDeleteRecords(ids: string[]): Promise<void>;
}
