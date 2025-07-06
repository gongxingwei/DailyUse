import { defineStore } from "pinia";
import type { IGoal, IRecord, IGoalDir } from "../../domain/types/goal";
import type { DateTime } from "@/shared/types/myDateTime";
import { Goal } from "../../domain/entities/goal";
import { GoalDir } from "../../domain/entities/goalDir";
import { useStoreSave } from "@/shared/composables/useStoreSave";
import { v4 as uuidv4 } from 'uuid';

/**
 * 目标状态接口
 */
interface GoalState {
  goals: IGoal[];
  goalDirs: IGoalDir[];
  _autoSave: any;
}

/**
 * 精简的目标 Pinia Store
 * 基于聚合根的简洁设计，移除冗余的Record独立管理
 */
export const useGoalStore = defineStore("goal", {
  state: () =>
    ({
      goals: [] as IGoal[],
      goalDirs: [] as IGoalDir[],
      _autoSave: null as ReturnType<typeof useStoreSave> | null,
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
    // ========== 核心业务方法 ==========

    /**
     * 创建目标（面向对象方式）
     */
    async createGoal(goalData: {
      title: string;
      description?: string;
      color?: string;
      dirId?: string;
      startTime?: DateTime;
      endTime?: DateTime;
      note?: string;
      analysis?: {
        motive: string;
        feasibility: string;
      };
      keyResults?: Array<{
        name: string;
        startValue: number;
        targetValue: number;
        currentValue: number;
        calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
        weight: number;
      }>;
    }): Promise<IGoal> {
      // 使用聚合根创建
      const goal = new Goal(uuidv4(), goalData.title, {
        description: goalData.description,
        color: goalData.color,
        dirId: goalData.dirId,
        startTime: goalData.startTime,
        endTime: goalData.endTime,
        note: goalData.note,
        analysis: goalData.analysis,
      });

      // 添加关键结果
      if (goalData.keyResults) {
        for (const krData of goalData.keyResults) {
          goal.addKeyResult(krData);
        }
      }

      const goalDTO = goal.toDTO();
      this.goals.push(goalDTO);
      await this.saveData();
      
      return goalDTO;
    },

    /**
     * 更新目标
     */
    async updateGoal(goalId: string, updates: {
      title?: string;
      description?: string;
      color?: string;
      note?: string;
      analysis?: {
        motive: string;
        feasibility: string;
      };
    }): Promise<IGoal> {
      const goalDTO = this.getGoalById(goalId);
      if (!goalDTO) {
        throw new Error(`目标不存在: ${goalId}`);
      }

      const goal = Goal.fromDTO(goalDTO);
      goal.updateBasicInfo(updates);

      const updatedGoalDTO = goal.toDTO();
      const index = this.goals.findIndex(g => g.id === goalId);
      this.goals[index] = updatedGoalDTO;
      
      await this.saveData();
      return updatedGoalDTO;
    },

    /**
     * 删除目标
     */
    async deleteGoal(goalId: string): Promise<void> {
      const index = this.goals.findIndex(g => g.id === goalId);
      if (index >= 0) {
        this.goals.splice(index, 1);
        await this.saveData();
      }
    },

    /**
     * 添加记录到目标
     */
    async addRecord(goalId: string, recordData: {
      keyResultId: string;
      value: number;
      note?: string;
    }): Promise<IRecord> {
      const goalDTO = this.getGoalById(goalId);
      if (!goalDTO) {
        throw new Error(`目标不存在: ${goalId}`);
      }

      const goal = Goal.fromDTO(goalDTO);
      const record = goal.addRecord(recordData.keyResultId, recordData.value, recordData.note);

      // 更新状态中的目标
      const index = this.goals.findIndex(g => g.id === goalId);
      this.goals[index] = goal.toDTO();
      
      await this.saveData();
      return record.toDTO();
    },

    /**
     * 更新记录
     */
    async updateRecord(goalId: string, recordId: string, updates: {
      value?: number;
      note?: string;
    }): Promise<IRecord> {
      const goalDTO = this.getGoalById(goalId);
      if (!goalDTO) {
        throw new Error(`目标不存在: ${goalId}`);
      }

      const goal = Goal.fromDTO(goalDTO);
      goal.updateRecord(recordId, updates);

      // 更新状态
      const index = this.goals.findIndex(g => g.id === goalId);
      this.goals[index] = goal.toDTO();
      
      await this.saveData();
      
      const updatedRecord = goal.records.find(r => r.id === recordId);
      if (!updatedRecord) {
        throw new Error(`记录更新后丢失: ${recordId}`);
      }
      return updatedRecord;
    },

    /**
     * 删除记录
     */
    async deleteRecord(goalId: string, recordId: string): Promise<void> {
      const goalDTO = this.getGoalById(goalId);
      if (!goalDTO) {
        throw new Error(`目标不存在: ${goalId}`);
      }

      const goal = Goal.fromDTO(goalDTO);
      goal.removeRecord(recordId);

      // 更新状态
      const index = this.goals.findIndex(g => g.id === goalId);
      this.goals[index] = goal.toDTO();
      
      await this.saveData();
    },

    /**
     * 添加关键结果
     */
    async addKeyResult(goalId: string, keyResultData: {
      name: string;
      startValue: number;
      targetValue: number;
      currentValue: number;
      calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
      weight: number;
    }): Promise<IGoal> {
      const goalDTO = this.getGoalById(goalId);
      if (!goalDTO) {
        throw new Error(`目标不存在: ${goalId}`);
      }

      const goal = Goal.fromDTO(goalDTO);
      goal.addKeyResult(keyResultData);

      const updatedGoalDTO = goal.toDTO();
      const index = this.goals.findIndex(g => g.id === goalId);
      this.goals[index] = updatedGoalDTO;
      
      await this.saveData();
      return updatedGoalDTO;
    },

    /**
     * 创建目标目录
     */
    async createGoalDir(dirData: {
      name: string;
      icon?: string;
      parentId?: string;
    }): Promise<IGoalDir> {
      const goalDir = new GoalDir(
        uuidv4(),
        dirData.name,
        dirData.icon || 'mdi-folder',
        dirData.parentId
      );

      const goalDirDTO = goalDir.toDTO();
      this.goalDirs.push(goalDirDTO);
      await this.saveData();
      
      return goalDirDTO;
    },

    /**
     * 删除目标目录
     */
    async deleteGoalDir(dirId: string): Promise<void> {
      const index = this.goalDirs.findIndex(d => d.id === dirId);
      if (index >= 0) {
        this.goalDirs.splice(index, 1);
        await this.saveData();
      }
    },

    // ========== 数据管理 ==========

    /**
     * 统一保存数据
     */
    async saveData(): Promise<void> {
      if (this._autoSave) {
        await Promise.all([
          this._autoSave.saveData("goals", this.goals),
          this._autoSave.saveData("goalDirs", this.goalDirs),
        ]);
      }
    },

    /**
     * 初始化 Store
     */
    async initialize(): Promise<void> {
      try {
        this._autoSave = useStoreSave();
        
        const [goals, goalDirs] = await Promise.all([
          this._autoSave.loadData("goals", []),
          this._autoSave.loadData("goalDirs", []),
        ]);
        
        this.goals = goals || [];
        this.goalDirs = goalDirs || [];
        
        console.log('✅ Goal Store 初始化完成');
      } catch (error) {
        console.error('❌ Goal Store 初始化失败:', error);
      }
    },

    /**
     * 清理 Store
     */
    async cleanup(): Promise<void> {
      if (this._autoSave) {
        await this.saveData();
        this._autoSave = null;
      }
    },
  },
});

// 导出单例，作为统一的业务门面
export const goalManager = {
  store: useGoalStore(),
  
  // 便捷方法
  async createGoal(goalData: Parameters<typeof useGoalStore.prototype.createGoal>[0]) {
    return this.store.createGoal(goalData);
  },
  
  async addRecord(goalId: string, recordData: Parameters<typeof useGoalStore.prototype.addRecord>[1]) {
    return this.store.addRecord(goalId, recordData);
  },
  
  async createGoalDir(dirData: Parameters<typeof useGoalStore.prototype.createGoalDir>[0]) {
    return this.store.createGoalDir(dirData);
  },
  
  // 查询方法
  getGoalById(id: string) {
    return this.store.getGoalById(id);
  },
  
  getAllGoals() {
    return this.store.getAllGoals;
  },
  
  getRecordsByGoalId(goalId: string) {
    return this.store.getRecordsByGoalId(goalId);
  }
};
