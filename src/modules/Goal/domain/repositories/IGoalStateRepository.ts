import type { IGoal, IRecord, IGoalDir } from "../types/goal";

/**
 * 目标状态仓库接口
 * 定义前端状态管理的抽象接口，支持不同的状态管理实现（如 Pinia、Vuex 等）
 */
export interface IGoalStateRepository {
  // ========== 目标管理 ==========
  
  /**
   * 添加目标到状态
   */
  addGoal(goal: IGoal): Promise<void>;

  /**
   * 更新状态中的目标
   */
  updateGoal(goal: IGoal): Promise<void>;

  /**
   * 从状态中移除目标
   */
  removeGoal(goalId: string): Promise<void>;

  /**
   * 设置所有目标（替换现有状态）
   */
  setGoals(goals: IGoal[]): Promise<void>;

  /**
   * 清空所有目标
   */
  clearAllGoals(): Promise<void>;

  // ========== 记录管理 ==========
  
  /**
   * 添加记录到状态
   */
  addRecord(record: IRecord): Promise<void>;

  /**
   * 更新状态中的记录
   */
  updateRecord(record: IRecord): Promise<void>;

  /**
   * 从状态中移除记录
   */
  removeRecord(recordId: string): Promise<void>;

  /**
   * 设置所有记录（替换现有状态）
   */
  setRecords(records: IRecord[]): Promise<void>;

  /**
   * 移除指定目标的所有记录
   */
  removeRecordsByGoalId(goalId: string): Promise<void>;

  /**
   * 移除指定关键结果的所有记录
   */
  removeRecordsByKeyResultId(keyResultId: string): Promise<void>;

  /**
   * 清空所有记录
   */
  clearAllRecords(): Promise<void>;

  // ========== 目标目录管理 ==========
  
  /**
   * 添加目标目录到状态
   */
  addGoalDir(goalDir: IGoalDir): Promise<void>;

  /**
   * 更新状态中的目标目录
   */
  updateGoalDir(goalDir: IGoalDir): Promise<void>;

  /**
   * 从状态中移除目标目录
   */
  removeGoalDir(goalDirId: string): Promise<void>;

  /**
   * 设置所有目标目录（替换现有状态）
   */
  setGoalDirs(goalDirs: IGoalDir[]): Promise<void>;

  /**
   * 清空所有目标目录
   */
  clearAllGoalDirs(): Promise<void>;

  // ========== 批量操作 ==========
  
  /**
   * 同步所有目标相关数据
   */
  syncAllGoalData(data: {
    goals: IGoal[];
    records: IRecord[];
    goalDirs: IGoalDir[];
  }): Promise<void>;

  // ========== 状态查询 ==========
  
  /**
   * 检查仓库是否可用
   */
  isAvailable(): boolean;
}
