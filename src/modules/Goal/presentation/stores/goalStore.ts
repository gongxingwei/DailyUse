import { defineStore } from "pinia";
import type { IGoal, IRecord, IGoalDir } from "../../domain/types/goal";

/**
 * 目标状态接口
 */
interface GoalState {
  goals: IGoal[];
  goalDirs: IGoalDir[];
}

/**
 * 精简的目标 Pinia Store - 纯状态管理版本
 * 移除了持久化存储功能，只负责状态管理
 */
export const useGoalStore = defineStore("goal", {
  state: () =>
    ({
      goals: [] as IGoal[],
      goalDirs: [] as IGoalDir[],
    } as GoalState),

  getters: {
    // ========== 目标查询 ==========
    
    /**
     * 获取所有目标
     */
    getAllGoals(): IGoal[] {
      return this.goals;
    },

    /**
     * 根据ID获取目标
     */
    getGoalById: (state) => (id: string) => {
      return state.goals.find((g) => g.id === id);
    },

    /**
     * 根据目录ID获取目标
     */
    getGoalsByDirId: (state) => (dirId: string) => {
      if (dirId === "all") {
        return state.goals.filter((g) => g.lifecycle.status !== "archived");
      }
      return state.goals.filter((g) => g.dirId === dirId);
    },

    /**
     * 获取活跃目标
     */
    getActiveGoals: (state) => {
      return state.goals.filter((g) => g.lifecycle.status === "active");
    },

    // ========== 记录查询（通过目标获取）==========
    
    /**
     * 获取所有记录
     */
    getAllRecords(): IRecord[] {
      return this.goals.flatMap(g => g.records);
    },

    /**
     * 根据目标ID获取记录
     */
    getRecordsByGoalId: (state) => (goalId: string) => {
      const goal = state.goals.find(g => g.id === goalId);
      return goal?.records || [];
    },

    /**
     * 根据关键结果ID获取记录
     */
    getRecordsByKeyResultId: (state) => (keyResultId: string) => {
      return state.goals
        .flatMap(g => g.records)
        .filter(r => r.keyResultId === keyResultId);
    },

    // ========== 目标目录查询 ==========
    
    /**
     * 获取所有目标目录
     */
    getAllGoalDirs(): IGoalDir[] {
      return this.goalDirs;
    },

    /**
     * 根据ID获取目标目录
     */
    getGoalDirById: (state) => (id: string) => {
      return state.goalDirs.find((d) => d.id === id);
    },
  },

  actions: {
    // ========== 状态同步方法（用于仓库接口实现）==========
    
    /**
     * 添加目标到状态
     */
    async addGoal(goal: IGoal): Promise<void> {
      const existingIndex = this.goals.findIndex(g => g.id === goal.id);
      if (existingIndex >= 0) {
        this.goals[existingIndex] = goal;
      } else {
        this.goals.push(goal);
      }
    },

    /**
     * 更新目标状态
     */
    async updateGoal(goal: IGoal): Promise<void> {
      const index = this.goals.findIndex(g => g.id === goal.id);
      if (index >= 0) {
        this.goals[index] = goal;
      }
    },

    /**
     * 移除目标状态
     */
    async removeGoal(goalId: string): Promise<void> {
      const index = this.goals.findIndex(g => g.id === goalId);
      if (index >= 0) {
        this.goals.splice(index, 1);
      }
    },

    /**
     * 设置所有目标
     */
    async setGoals(goals: IGoal[]): Promise<void> {
      this.goals = goals;
    },

    /**
     * 清空所有目标
     */
    async clearAllGoals(): Promise<void> {
      this.goals = [];
    },

    // ========== 记录状态管理 ==========
    
    /**
     * 添加记录（通过更新目标实现）
     */
    async addRecord(record: IRecord): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === record.goalId);
      if (goalIndex >= 0) {
        const goal = this.goals[goalIndex];
        const recordExists = goal.records.some(r => r.id === record.id);
        if (!recordExists) {
          goal.records.push(record);
        }
      }
    },

    /**
     * 更新记录（通过更新目标实现）
     */
    async updateRecord(record: IRecord): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === record.goalId);
      if (goalIndex >= 0) {
        const goal = this.goals[goalIndex];
        const recordIndex = goal.records.findIndex(r => r.id === record.id);
        if (recordIndex >= 0) {
          goal.records[recordIndex] = record;
        }
      }
    },

    /**
     * 移除记录
     */
    async removeRecord(recordId: string): Promise<void> {
      for (const goal of this.goals) {
        const recordIndex = goal.records.findIndex(r => r.id === recordId);
        if (recordIndex >= 0) {
          goal.records.splice(recordIndex, 1);
          break;
        }
      }
    },

    /**
     * 设置所有记录
     */
    async setRecords(records: IRecord[]): Promise<void> {
      // 清空所有目标的记录
      for (const goal of this.goals) {
        goal.records = [];
      }
      
      // 重新分配记录到对应目标
      for (const record of records) {
        await this.addRecord(record);
      }
    },

    /**
     * 根据目标ID移除记录
     */
    async removeRecordsByGoalId(goalId: string): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === goalId);
      if (goalIndex >= 0) {
        this.goals[goalIndex].records = [];
      }
    },

    /**
     * 根据关键结果ID移除记录
     */
    async removeRecordsByKeyResultId(keyResultId: string): Promise<void> {
      for (const goal of this.goals) {
        goal.records = goal.records.filter(r => r.keyResultId !== keyResultId);
      }
    },

    /**
     * 清空所有记录
     */
    async clearAllRecords(): Promise<void> {
      for (const goal of this.goals) {
        goal.records = [];
      }
    },

    // ========== 目标目录状态管理 ==========
    
    /**
     * 添加目标目录
     */
    async addGoalDir(goalDir: IGoalDir): Promise<void> {
      const existingIndex = this.goalDirs.findIndex(d => d.id === goalDir.id);
      if (existingIndex >= 0) {
        this.goalDirs[existingIndex] = goalDir;
      } else {
        this.goalDirs.push(goalDir);
      }
    },

    /**
     * 更新目标目录
     */
    async updateGoalDir(goalDir: IGoalDir): Promise<void> {
      const index = this.goalDirs.findIndex(d => d.id === goalDir.id);
      if (index >= 0) {
        this.goalDirs[index] = goalDir;
      }
    },

    /**
     * 移除目标目录
     */
    async removeGoalDir(goalDirId: string): Promise<void> {
      const index = this.goalDirs.findIndex(d => d.id === goalDirId);
      if (index >= 0) {
        this.goalDirs.splice(index, 1);
      }
    },

    /**
     * 设置所有目标目录
     */
    async setGoalDirs(goalDirs: IGoalDir[]): Promise<void> {
      this.goalDirs = goalDirs;
    },

    /**
     * 清空所有目标目录
     */
    async clearAllGoalDirs(): Promise<void> {
      this.goalDirs = [];
    },

    // ========== 批量同步 ==========
    
    /**
     * 同步所有目标数据
     */
    async syncAllGoalData(data: {
      goals: IGoal[];
      records: IRecord[];
      goalDirs: IGoalDir[];
    }): Promise<void> {
      this.goals = data.goals;
      this.goalDirs = data.goalDirs;
      // records 已经包含在 goals 中，无需单独处理
    },
  },
});
