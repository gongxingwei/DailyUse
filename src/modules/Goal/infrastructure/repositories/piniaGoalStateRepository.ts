import type { IGoalStateRepository } from "../../domain/repositories/IGoalStateRepository";
import type { IGoal, IRecord, IGoalDir } from "../../domain/types/goal";
import { useGoalStore } from "@/modules/Goal/presentation/stores/goalStore";

/**
 * Pinia 目标状态仓库实现
 * 简洁版本，直接代理到 goalStore 的方法
 */
export class PiniaGoalStateRepository implements IGoalStateRepository {
  public store = useGoalStore(); // 改为 public 以便访问

  // ========== 目标管理 ==========
  async addGoal(goal: IGoal): Promise<void> {
    return this.store.addGoal(goal);
  }

  async updateGoal(goal: IGoal): Promise<void> {
    return this.store.updateGoal(goal);
  }

  async removeGoal(goalId: string): Promise<void> {
    return this.store.removeGoal(goalId);
  }

  async setGoals(goals: IGoal[]): Promise<void> {
    return this.store.setGoals(goals);
  }

  async clearAllGoals(): Promise<void> {
    return this.store.clearAllGoals();
  }

  // ========== 记录管理 ==========
  async addRecord(record: IRecord): Promise<void> {
    return this.store.addRecord(record);
  }

  async updateRecord(record: IRecord): Promise<void> {
    return this.store.updateRecord(record);
  }

  async removeRecord(recordId: string): Promise<void> {
    return this.store.removeRecord(recordId);
  }

  async setRecords(records: IRecord[]): Promise<void> {
    return this.store.setRecords(records);
  }

  async removeRecordsByGoalId(goalId: string): Promise<void> {
    return this.store.removeRecordsByGoalId(goalId);
  }

  async removeRecordsByKeyResultId(keyResultId: string): Promise<void> {
    return this.store.removeRecordsByKeyResultId(keyResultId);
  }

  async clearAllRecords(): Promise<void> {
    return this.store.clearAllRecords();
  }

  // ========== 目标目录管理 ==========
  async addGoalDir(goalDir: IGoalDir): Promise<void> {
    return this.store.addGoalDir(goalDir);
  }

  async updateGoalDir(goalDir: IGoalDir): Promise<void> {
    return this.store.updateGoalDir(goalDir);
  }

  async removeGoalDir(goalDirId: string): Promise<void> {
    return this.store.removeGoalDir(goalDirId);
  }

  async setGoalDirs(goalDirs: IGoalDir[]): Promise<void> {
    return this.store.setGoalDirs(goalDirs);
  }

  async clearAllGoalDirs(): Promise<void> {
    return this.store.clearAllGoalDirs();
  }

  // ========== 批量操作 ==========
  async syncAllGoalData(data: {
    goals: IGoal[];
    records: IRecord[];
    goalDirs: IGoalDir[];
  }): Promise<void> {
    return this.store.syncAllGoalData(data);
  }

  // ========== 状态查询 ==========
  isAvailable(): boolean {
    return true; // Pinia store 始终可用
  }
}
