import type { IGoalStateRepository } from "../../domain/repositories/IGoalStateRepository";
import type { IGoal, IRecord, IGoalDir } from "../../domain/types/goal";
import { useGoalStore } from "@/modules/Goal/presentation/stores/goalStore";

/**
 * 基于 Pinia Store 的目标状态仓库实现
 * 
 * 这是 IGoalStateRepository 接口的具体实现
 * 将抽象的状态管理操作映射到 Pinia store 的具体方法
 */
export class PiniaGoalStateRepository implements IGoalStateRepository {
  private _goalStore: ReturnType<typeof useGoalStore> | null = null;

  /**
   * 延迟获取 goalStore，确保 Pinia 已经初始化
   */
  private get goalStore() {
    if (!this._goalStore) {
      this._goalStore = useGoalStore();
    }
    return this._goalStore;
  }

  // ========== 目标管理 ==========
  async addGoal(goal: IGoal): Promise<void> {
    try {
      await this.goalStore.addGoal(goal);
      console.log(`✅ [StateRepo] 添加目标到状态: ${goal.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 添加目标失败: ${goal.id}`, error);
      throw error;
    }
  }

  async updateGoal(goal: IGoal): Promise<void> {
    try {
      await this.goalStore.updateGoal(goal);
      console.log(`✅ [StateRepo] 更新目标状态: ${goal.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 更新目标失败: ${goal.id}`, error);
      throw error;
    }
  }

  async removeGoal(goalId: string): Promise<void> {
    try {
      await this.goalStore.removeGoal(goalId);
      console.log(`✅ [StateRepo] 从状态删除目标: ${goalId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除目标失败: ${goalId}`, error);
      throw error;
    }
  }

  async setGoals(goals: IGoal[]): Promise<void> {
    try {
      this.goalStore.setGoals(goals);
      console.log(`✅ [StateRepo] 设置目标状态: ${goals.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置目标失败', error);
      throw error;
    }
  }

  async clearAllGoals(): Promise<void> {
    try {
      this.goalStore.clearAllGoals();
      console.log('✅ [StateRepo] 清空所有目标状态');
    } catch (error) {
      console.error('❌ [StateRepo] 清空目标失败', error);
      throw error;
    }
  }

  // ========== 记录管理 ==========
  async addRecord(record: IRecord): Promise<void> {
    try {
      await this.goalStore.addRecord(record);
      console.log(`✅ [StateRepo] 添加记录到状态: ${record.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 添加记录失败: ${record.id}`, error);
      throw error;
    }
  }

  async updateRecord(record: IRecord): Promise<void> {
    try {
      await this.goalStore.updateRecord(record);
      console.log(`✅ [StateRepo] 更新记录状态: ${record.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 更新记录失败: ${record.id}`, error);
      throw error;
    }
  }

  async removeRecord(recordId: string): Promise<void> {
    try {
      await this.goalStore.removeRecord(recordId);
      console.log(`✅ [StateRepo] 从状态删除记录: ${recordId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除记录失败: ${recordId}`, error);
      throw error;
    }
  }

  async setRecords(records: IRecord[]): Promise<void> {
    try {
      this.goalStore.setRecords(records);
      console.log(`✅ [StateRepo] 设置记录状态: ${records.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置记录失败', error);
      throw error;
    }
  }

  async removeRecordsByGoalId(goalId: string): Promise<void> {
    try {
      await this.goalStore.removeRecordsByGoalId(goalId);
      console.log(`✅ [StateRepo] 删除目标相关记录: ${goalId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除目标相关记录失败: ${goalId}`, error);
      throw error;
    }
  }

  async removeRecordsByKeyResultId(keyResultId: string): Promise<void> {
    try {
      await this.goalStore.removeRecordsByKeyResultId(keyResultId);
      console.log(`✅ [StateRepo] 删除关键结果相关记录: ${keyResultId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除关键结果相关记录失败: ${keyResultId}`, error);
      throw error;
    }
  }

  async clearAllRecords(): Promise<void> {
    try {
      this.goalStore.clearAllRecords();
      console.log('✅ [StateRepo] 清空所有记录状态');
    } catch (error) {
      console.error('❌ [StateRepo] 清空记录失败', error);
      throw error;
    }
  }

  // ========== 目标目录管理 ==========
  async addGoalDir(goalDir: IGoalDir): Promise<void> {
    try {
      await this.goalStore.addGoalDir(goalDir);
      console.log(`✅ [StateRepo] 添加目标目录到状态: ${goalDir.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 添加目标目录失败: ${goalDir.id}`, error);
      throw error;
    }
  }

  async updateGoalDir(goalDir: IGoalDir): Promise<void> {
    try {
      await this.goalStore.updateGoalDir(goalDir);
      console.log(`✅ [StateRepo] 更新目标目录状态: ${goalDir.id}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 更新目标目录失败: ${goalDir.id}`, error);
      throw error;
    }
  }

  async removeGoalDir(goalDirId: string): Promise<void> {
    try {
      await this.goalStore.removeGoalDir(goalDirId);
      console.log(`✅ [StateRepo] 从状态删除目标目录: ${goalDirId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除目标目录失败: ${goalDirId}`, error);
      throw error;
    }
  }

  async setGoalDirs(goalDirs: IGoalDir[]): Promise<void> {
    try {
      this.goalStore.setGoalDirs(goalDirs);
      console.log(`✅ [StateRepo] 设置目标目录状态: ${goalDirs.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置目标目录失败', error);
      throw error;
    }
  }

  async clearAllGoalDirs(): Promise<void> {
    try {
      this.goalStore.clearAllGoalDirs();
      console.log('✅ [StateRepo] 清空所有目标目录状态');
    } catch (error) {
      console.error('❌ [StateRepo] 清空目标目录失败', error);
      throw error;
    }
  }

  // ========== 批量操作 ==========
  async syncAllGoalData(data: {
    goals: IGoal[];
    records: IRecord[];
    goalDirs: IGoalDir[];
  }): Promise<void> {
    try {
      this.goalStore.syncAllGoalData(data);
      console.log(`✅ [StateRepo] 全量同步目标数据: ${data.goals.length} 目标, ${data.records.length} 记录, ${data.goalDirs.length} 目录`);
    } catch (error) {
      console.error('❌ [StateRepo] 全量同步失败', error);
      throw error;
    }
  }

  // ========== 状态查询 ==========
  isAvailable(): boolean {
    try {
      // 简单检查 store 是否可用
      return this.goalStore !== null && this.goalStore !== undefined;
    } catch (error) {
      console.error('❌ [StateRepo] 状态仓库不可用', error);
      return false;
    }
  }
}
