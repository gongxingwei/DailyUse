import { PiniaGoalStateRepository } from '../infrastructure/repositories/piniaGoalStateRepository';
import type { IGoal, IRecord, IGoalDir } from '../domain/types/goal';
import type { DateTime } from '@/shared/types/myDateTime';
import { Goal } from '../domain/entities/goal';
import { GoalDir } from '../domain/entities/goalDir';
import { v4 as uuidv4 } from 'uuid';

/**
 * 简洁的目标状态管理示例
 * 展示重构后的代码如何使用
 */
export class GoalStateManager {
  private repository = new PiniaGoalStateRepository();

  // ========== 目标操作 ==========
  
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
    // ✅ 使用领域对象创建目标
    const goal = new Goal(
      uuidv4(),
      goalData.title,
      {
        description: goalData.description,
        color: goalData.color,
        dirId: goalData.dirId,
        startTime: goalData.startTime,
        endTime: goalData.endTime,
        note: goalData.note,
        analysis: goalData.analysis,
      }
    );

    // 添加关键结果（如果有）
    if (goalData.keyResults) {
      for (const krData of goalData.keyResults) {
        goal.addKeyResult({
          name: krData.name,
          startValue: krData.startValue,
          targetValue: krData.targetValue,
          currentValue: krData.currentValue,
          calculationMethod: krData.calculationMethod,
          weight: krData.weight
        });
      }
    }

    // 保存到仓储
    const goalDTO = goal.toDTO();
    await this.repository.addGoal(goalDTO);
    
    return goalDTO;
  }

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
    // ✅ 通过领域对象更新目标
    const goalDTO = this.repository.store.getGoalById(goalId);
    if (!goalDTO) {
      throw new Error(`目标不存在: ${goalId}`);
    }

    const goal = Goal.fromDTO(goalDTO);
    goal.updateBasicInfo(updates);

    const updatedGoalDTO = goal.toDTO();
    await this.repository.updateGoal(updatedGoalDTO);
    
    return updatedGoalDTO;
  }

  async deleteGoal(goalId: string): Promise<void> {
    // ✅ 通过聚合根删除目标（会自动清理相关记录）
    const goalDTO = this.repository.store.getGoalById(goalId);
    if (!goalDTO) {
      throw new Error(`目标不存在: ${goalId}`);
    }

    await this.repository.removeGoal(goalId);
  }

  // ========== 记录操作 ==========
  
  async addRecord(recordData: {
    goalId: string;
    keyResultId: string;
    value: number;
    note?: string;
  }): Promise<IRecord> {
    // ✅ 通过 Goal 聚合管理记录
    // 1. 获取目标
    const goalDTO = this.repository.store.getGoalById(recordData.goalId);
    if (!goalDTO) {
      throw new Error(`目标不存在: ${recordData.goalId}`);
    }

    // 2. 重建 Goal 聚合
    const goal = Goal.fromDTO(goalDTO);
    
    // 3. 添加记录（会自动更新关键结果和目标进度）
    const record = goal.addRecord(
      recordData.keyResultId,
      recordData.value,
      recordData.note
    );

    // 4. 保存更新后的目标
    await this.repository.updateGoal(goal.toDTO());
    
    return record.toDTO();
  }

  async updateRecord(recordId: string, updates: {
    value?: number;
    note?: string;
  }): Promise<IRecord> {
    // ✅ 通过 Goal 聚合更新记录
    // 1. 找到包含该记录的目标
    const goals = this.repository.store.getAllGoals;
    const goalDTO = goals.find((g: IGoal) => g.records.some((r: IRecord) => r.id === recordId));
    if (!goalDTO) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    // 2. 重建 Goal 聚合
    const goal = Goal.fromDTO(goalDTO);
    
    // 3. 更新记录
    goal.updateRecord(recordId, updates);

    // 4. 保存更新后的目标
    await this.repository.updateGoal(goal.toDTO());
    
    // 5. 返回更新后的记录
    const updatedRecord = goal.records.find(r => r.id === recordId);
    if (!updatedRecord) {
      throw new Error(`记录更新后丢失: ${recordId}`);
    }
    
    return updatedRecord;
  }

  async deleteRecord(recordId: string): Promise<void> {
    // ✅ 通过 Goal 聚合删除记录
    // 1. 找到包含该记录的目标
    const goals = this.repository.store.getAllGoals;
    const goalDTO = goals.find((g: IGoal) => g.records.some((r: IRecord) => r.id === recordId));
    if (!goalDTO) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    // 2. 重建 Goal 聚合
    const goal = Goal.fromDTO(goalDTO);
    
    // 3. 删除记录（会自动调整关键结果）
    goal.removeRecord(recordId);

    // 4. 保存更新后的目标
    await this.repository.updateGoal(goal.toDTO());
  }

  // ========== 目录操作 ==========
  
  async createGoalDir(dirData: {
    name: string;
    icon?: string;
    parentId?: string;
  }): Promise<IGoalDir> {
    // ✅ 使用领域对象创建目录
    const goalDir = new GoalDir(
      uuidv4(),
      dirData.name,
      dirData.icon || 'mdi-folder',
      dirData.parentId
    );

    // 保存到仓储
    const goalDirDTO = goalDir.toDTO();
    await this.repository.addGoalDir(goalDirDTO);
    
    return goalDirDTO;
  }

  async deleteGoalDir(dirId: string): Promise<void> {
    await this.repository.removeGoalDir(dirId);
  }

  // ========== 批量操作 ==========
  
  async syncAllData(data: {
    goals: IGoal[];
    records: IRecord[];
    goalDirs: IGoalDir[];
  }): Promise<void> {
    await this.repository.syncAllGoalData(data);
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.repository.clearAllGoals(),
      this.repository.clearAllRecords(),
      this.repository.clearAllGoalDirs()
    ]);
  }

  // ========== 状态检查 ==========
  
  isAvailable(): boolean {
    return this.repository.isAvailable();
  }
}

// 导出单例实例，便于在应用中使用
export const goalStateManager = new GoalStateManager();
