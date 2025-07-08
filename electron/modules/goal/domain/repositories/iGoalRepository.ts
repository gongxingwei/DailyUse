import type { Goal } from '../entities/goal';
import type { GoalDir } from '../entities/goalDir';
import type { Record } from '../entities/record';
import type { IGoalCreateDTO, IGoalDir, IRecordCreateDTO, IKeyResult } from '@/modules/Goal/domain/types/goal';

/**
 * Goal 仓库接口
 * 定义目标聚合根的持久化操作
 */
export interface IGoalRepository {
  /**
   * 设置当前用户
   */
  setCurrentUser(username: string): void;

  // ========== Goal 操作 ==========
  
  /**
   * 创建目标
   */
  createGoal(data: IGoalCreateDTO): Promise<Goal>;
  
  /**
   * 根据ID获取目标
   */
  getGoalById(id: string): Promise<Goal | null>;
  
  /**
   * 获取所有目标
   */
  getAllGoals(): Promise<Goal[]>;
  
  /**
   * 根据目录获取目标
   */
  getGoalsByDirectory(directoryId: string): Promise<Goal[]>;
  
  /**
   * 更新目标
   */
  updateGoal(id: string, updates: Partial<IGoalCreateDTO>): Promise<Goal>;
  
  /**
   * 删除目标
   */
  deleteGoal(id: string): Promise<void>;

  // ========== Goal Directory 操作 ==========
  
  /**
   * 创建目标目录
   */
  createGoalDirectory(data: IGoalDir): Promise<GoalDir>;
  
  /**
   * 根据ID获取目标目录
   */
  getGoalDirectoryById(id: string): Promise<GoalDir | null>;
  
  /**
   * 获取所有目标目录
   */
  getAllGoalDirectories(): Promise<GoalDir[]>;
  
  /**
   * 更新目标目录
   */
  updateGoalDirectory(data: IGoalDir): Promise<GoalDir>;
  
  /**
   * 删除目标目录
   */
  deleteGoalDirectory(id: string): Promise<void>;

  // ========== Record 操作 ==========
  
  /**
   * 创建记录
   */
  createRecord(data: IRecordCreateDTO): Promise<Record>;
  
  /**
   * 根据ID获取记录
   */
  getRecordById(id: string): Promise<Record | null>;
  
  /**
   * 获取目标的所有记录
   */
  getRecordsByGoal(goalId: string): Promise<Record[]>;
  
  /**
   * 更新记录
   */
  updateRecord(id: string, updates: Partial<IRecordCreateDTO>): Promise<Record>;
  
  /**
   * 删除记录
   */
  deleteRecord(id: string): Promise<void>;

  // ========== Key Result 操作 ==========
  
  /**
   * 更新目标的关键结果
   */
  updateKeyResults(goalId: string, keyResults: IKeyResult[]): Promise<void>;
  
  /**
   * 获取目标的关键结果
   */
  getKeyResults(goalId: string): Promise<IKeyResult[]>;

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
