import type { 
  IGoal, 
  IGoalCreateDTO, 
  IRecord, 
  IRecordCreateDTO, 
  IGoalDir, 
  IGoalReview,
  IGoalReviewCreateDTO
} from "../../../../../common/modules/goal/types/goal";
import { Goal } from "../../domain/aggregates/goal";
import { GoalReview } from "../../domain/entities/goalReview";
import { GoalDir } from "../../domain/aggregates/goalDir";
import { Record } from "../../domain/entities/record";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import { generateUUID } from "@/shared/utils/uuid";
import { GoalContainer } from "../../infrastructure/di/goalContainer";
import type { IGoalRepository } from "../../domain/repositories/iGoalRepository";

/**
 * 主进程目标应用服务
 * 处理目标相关的业务逻辑和数据库操作
 * 
 * 职责：
 * 1. 目标的CRUD操作
 * 2. 关键结果管理
 * 3. 记录管理
 * 4. 目标目录管理
 * 5. 数据验证和业务规则执行
 */
export class MainGoalApplicationService {
  private static instance: MainGoalApplicationService;
  private goalRepository: IGoalRepository;
  constructor(goalRepository: IGoalRepository) {
    this.goalRepository = goalRepository;
  }

  static async createInstance(goalRepository?: IGoalRepository): Promise<MainGoalApplicationService> {
    const goalContainer = GoalContainer.getInstance();
    goalRepository = goalRepository || (await goalContainer.getGoalRepository());
    this.instance = new MainGoalApplicationService(goalRepository);
    return this.instance;
  }
  
  static async getInstance(): Promise<MainGoalApplicationService> {
    if (!this.instance) {
      MainGoalApplicationService.instance = await MainGoalApplicationService.createInstance();
    }
    return this.instance;
  }

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(accountUuid: string, goalData: IGoalCreateDTO): Promise<Goal> {
    // 验证数据
    const validation = Goal.validate(goalData);
    if (!validation.isValid) {
      throw new Error(`目标数据验证失败: ${validation.errors.join(', ')}`);
    }
    const goal = Goal.fromCreateDTO(goalData);
    const createdGoal = await this.goalRepository.createGoal(accountUuid, goal);
    return createdGoal;
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(accountUuid: string): Promise<Goal[]> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    return goals;
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalUuid: string): Promise<Goal | null> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    return goal || null;
  }

  /**
   * 更新目标
   */
  async updateGoal(goalData: IGoal): Promise<Goal> {
    const existingGoal = await this.goalRepository.getGoalById(goalData.uuid);
    if (!existingGoal) {
      throw new Error(`目标不存在: ${goalData.uuid}`);
    }
    const updates = {
      name: goalData.name,
      description: goalData.description,
      color: goalData.color,
      dirId: goalData.dirId,
      startTime: goalData.startTime,
      endTime: goalData.endTime,
      note: goalData.note,
      keyResults: goalData.keyResults.map(kr => ({
        name: kr.name,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        calculationMethod: kr.calculationMethod,
        weight: kr.weight
      })),
      analysis: goalData.analysis
    };
    const updatedGoal = await this.goalRepository.updateGoal(goalData.uuid, updates);
    return updatedGoal;
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalUuid: string): Promise<void> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    await this.goalRepository.deleteGoal(goalUuid);
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(accountUuid: string): Promise<void> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const goalUuids = goals.map(goal => goal.uuid);
    await this.goalRepository.batchDeleteGoals(goalUuids);
  }

  // ========== 关键结果管理 ==========

  /**
   * 更新关键结果当前值
   */
  async updateKeyResultCurrentValue(
    goalUuid: string, 
    keyResultId: string, 
    currentValue: number
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    goal.updateKeyResultCurrentValue(keyResultId, currentValue);
    const updatedGoal = await this.goalRepository.updateGoal(goalUuid, {
      keyResults: goal.keyResults.map(kr => ({
        name: kr.name,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        calculationMethod: kr.calculationMethod,
        weight: kr.weight
      }))
    });
    return updatedGoal;
  }

  /**
   * 为目标的关键结果添加记录（通过聚合根）
   */
  async addRecordToGoal(recordDTO: IRecordCreateDTO): Promise<{ goal: Goal; record: Record }> {
    if (recordDTO.value <= 0) {
      throw new Error('记录值必须大于0');
    }
    const goal = await this.goalRepository.getGoalById(recordDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${recordDTO.goalUuid}`);
    }
    const record = goal.addRecord(recordDTO);
    const updatedGoal = await this.goalRepository.updateGoal(goal.uuid, goal.toDTO());
    return { goal: updatedGoal, record };
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(accountUuid: string): Promise<Record[]> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const allRecords: Record[] = [];
    for (const goal of goals) {
      const records = await this.goalRepository.getRecordsByGoal(goal.uuid);
      allRecords.push(...records);
    }
    return allRecords;
  }

  /**
   * 根据目标ID获取记录
   */
  async getRecordsBygoalUuid(goalUuid: string): Promise<Record[]> {
    const records = await this.goalRepository.getRecordsByGoal(goalUuid);
    return records;
  }

  /**
   * 删除记录
   */
  async deleteRecord(recordId: string): Promise<void> {
    await this.goalRepository.deleteRecord(recordId);
  }

  // ========== 目标复盘管理（聚合根驱动）==========

  /**
   * 为目标添加复盘（聚合根驱动）
   */
  async addReviewToGoal(
    goalUuid: string,
    reviewData: IGoalReviewCreateDTO
  ): Promise<{ goal: Goal; review: GoalReview }> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    const goalReview = GoalReview.fromCreateDTO(reviewData);
    goal.addReview(goalReview);
    await this.goalRepository.updateGoal(goal.uuid, {});
    return { goal, review: goalReview };
  }

  /**
   * 更新目标的复盘（聚合根驱动）
   */
  async updateReviewInGoal(
    goalUuid: string,
    reviewId: string,
    updateData: Partial<IGoalReviewCreateDTO>
  ): Promise<{ goal: Goal; review: GoalReview }> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    goal.updateReview(reviewId, updateData);
    const review = goal.getReview(reviewId);
    if (!review) {
      throw new Error(`复盘不存在: ${reviewId}`);
    }
    await this.goalRepository.updateGoal(goal.uuid, {});
    return { goal, review };
  }

  /**
   * 从目标中移除复盘（聚合根驱动）
   */
  async removeReviewFromGoal(
    goalUuid: string,
    reviewId: string
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    goal.removeReview(reviewId);
    await this.goalRepository.updateGoal(goal.uuid, {});
    return goal;
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviews(goalUuid: string): Promise<GoalReview[]> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    const reviews = goal.getReviewsSortedByDate();
    return reviews;
  }

  /**
   * 为目标创建复盘快照（聚合根驱动）
   */
  async createGoalReviewSnapshot(goalUuid: string): Promise<{ goal: Goal; snapshot: any }> {
    const goal = await this.goalRepository.getGoalById(goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    const snapshot = goal.createSnapshot();
    return { goal, snapshot };
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalDir(goalDirData: IGoalDir, accountUuid: string): Promise<GoalDir> {
    const validation = GoalDir.validate(goalDirData);
    if (!validation.isValid) {
      throw new Error(`目录数据验证失败: ${validation.errors.join(', ')}`);
    }
    const goalDir = GoalDir.fromCreateDTO(goalDirData);
    const createdGoalDir = await this.goalRepository.createGoalDirectory(accountUuid, goalDir);
    console.log("✅ [MainGoalApplicationService.createGoalDir]:创建目标目录成功", createdGoalDir);
    return createdGoalDir;
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalDirs(accountUuid: string): Promise<GoalDir[]> {
    const goalDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
    return goalDirs;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(accountUuid: string, goalDirId: string): Promise<void> {
    const goalDir = await this.goalRepository.getGoalDirectoryById(goalDirId);
    if (!goalDir) {
      throw new Error(`目标目录不存在: ${goalDirId}`);
    }
    const goalsInDir = await this.goalRepository.getGoalsByDirectory(accountUuid, goalDirId);
    if (goalsInDir.length > 0) {
      throw new Error(`无法删除目录，还有 ${goalsInDir.length} 个目标在使用此目录`);
    }
    await this.goalRepository.deleteGoalDirectory(goalDirId);
  }

  /**
   * 更新目标目录
   */
  async updateGoalDir(goalDirData: IGoalDir): Promise<GoalDir> {
    const existingGoalDir = await this.goalRepository.getGoalDirectoryById(goalDirData.uuid);
    if (!existingGoalDir) {
      throw new Error(`目标目录不存在: ${goalDirData.uuid}`);
    }
    const updatedGoalDir = await this.goalRepository.updateGoalDirectory(goalDirData);
    return updatedGoalDir;
  }

  /**
   * 为目标添加关键结果（通过聚合根）
   */
  async addKeyResultToGoal(
    goalUuid: string,
    keyResultData: {
      name: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
      weight?: number;
    }
  ): Promise<{ goal: Goal; keyResultId: string }> {
    const goalWithRecords = await this.goalRepository.getGoalById(goalUuid);
    if (!goalWithRecords) {
      throw new Error('目标不存在');
    }
    const fullKeyResultData = {
      name: keyResultData.name,
      startValue: keyResultData.startValue,
      targetValue: keyResultData.targetValue,
      currentValue: keyResultData.currentValue ?? keyResultData.startValue,
      calculationMethod: keyResultData.calculationMethod ?? 'sum' as const,
      weight: keyResultData.weight ?? 1,
    };
    const keyResultId = goalWithRecords.addKeyResult(fullKeyResultData);
    await this.goalRepository.updateGoal(goalUuid, {
      name: goalWithRecords.name,
      description: goalWithRecords.description,
      color: goalWithRecords.color,
      dirId: goalWithRecords.dirId,
      startTime: goalWithRecords.startTime,
      endTime: goalWithRecords.endTime,
      note: goalWithRecords.note,
      keyResults: goalWithRecords.keyResults,
    });
    return { goal: goalWithRecords, keyResultId };
  }

  /**
   * 删除目标的关键结果（通过聚合根）
   */
  async removeKeyResultFromGoal(goalUuid: string, keyResultId: string): Promise<Goal> {
    const goalWithRecords = await this.goalRepository.getGoalById(goalUuid);
    if (!goalWithRecords) {
      throw new Error('目标不存在');
    }
    goalWithRecords.removeKeyResult(keyResultId);
    await this.goalRepository.updateGoal(goalUuid, {
      name: goalWithRecords.name,
      description: goalWithRecords.description,
      color: goalWithRecords.color,
      dirId: goalWithRecords.dirId,
      startTime: goalWithRecords.startTime,
      endTime: goalWithRecords.endTime,
      note: goalWithRecords.note,
      keyResults: goalWithRecords.keyResults,
    });
    return goalWithRecords;
  }

  /**
   * 更新目标的关键结果（通过聚合根）
   */
  async updateKeyResultOfGoal(
    goalUuid: string,
    keyResultId: string,
    updates: {
      name?: string;
      targetValue?: number;
      weight?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    }
  ): Promise<Goal> {
    const goalWithRecords = await this.goalRepository.getGoalById(goalUuid);
    if (!goalWithRecords) {
      throw new Error('目标不存在');
    }
    goalWithRecords.updateKeyResult(keyResultId, updates);
    await this.goalRepository.updateGoal(goalUuid, {
      name: goalWithRecords.name,
      description: goalWithRecords.description,
      color: goalWithRecords.color,
      dirId: goalWithRecords.dirId,
      startTime: goalWithRecords.startTime,
      endTime: goalWithRecords.endTime,
      note: goalWithRecords.note,
      keyResults: goalWithRecords.keyResults,
    });
    return goalWithRecords;
  }

  // ========== 记录管理 ==========

  /**
   * 从目标中删除记录（通过聚合根）
   */
  async removeRecordFromGoal(goalUuid: string, recordId: string): Promise<Goal> {
    const goalWithRecords = await this.goalRepository.getGoalById(goalUuid);
    if (!goalWithRecords) {
      throw new Error('目标不存在');
    }
    goalWithRecords.removeRecord(recordId);
    await this.goalRepository.updateGoal(goalUuid, {
      name: goalWithRecords.name,
      description: goalWithRecords.description,
      color: goalWithRecords.color,
      dirId: goalWithRecords.dirId,
      startTime: goalWithRecords.startTime,
      endTime: goalWithRecords.endTime,
      note: goalWithRecords.note,
      keyResults: goalWithRecords.keyResults,
    });
    return goalWithRecords;
  }
}