import type {
  IGoal,
  IRecord,
  IGoalDir,
  IGoalReview,
  IKeyResult,
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

  static async createInstance(
    goalRepository?: IGoalRepository
  ): Promise<MainGoalApplicationService> {
    const goalContainer = GoalContainer.getInstance();
    goalRepository =
      goalRepository || (await goalContainer.getGoalRepository());
    this.instance = new MainGoalApplicationService(goalRepository);
    return this.instance;
  }

  static async getInstance(): Promise<MainGoalApplicationService> {
    if (!this.instance) {
      MainGoalApplicationService.instance =
        await MainGoalApplicationService.createInstance();
    }
    return this.instance;
  }

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(accountUuid: string, goalDTO: IGoal): Promise<Goal> {
    const goal = Goal.fromDTO(goalDTO);
    console.log("🔄 [MainGoalApplicationService.createGoal] 创建目标:", goal);
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
  async getGoalById(
    accountUuid: string,
    goalUuid: string
  ): Promise<Goal | null> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    return goal || null;
  }

  /**
   * 更新目标
   */
  async updateGoal(accountUuid: string, goalData: IGoal): Promise<Goal> {
    const existingGoal = await this.goalRepository.getGoalByUuid(
      accountUuid,
      goalData.uuid
    );
    if (!existingGoal) {
      throw new Error(`目标不存在: ${goalData.uuid}`);
    }

    // Convert DTO to Goal object
    const updatedGoal = Goal.fromDTO(goalData);
    const result = await this.goalRepository.updateGoal(
      accountUuid,
      updatedGoal
    );
    return result;
  }

  /**
   * 删除目标
   */
  async deleteGoal(accountUuid: string, goalUuid: string): Promise<void> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    await this.goalRepository.deleteGoal(accountUuid, goalUuid);
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(accountUuid: string): Promise<void> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const goalUuids = goals.map((goal) => goal.uuid);
    await this.goalRepository.batchDeleteGoals(accountUuid, goalUuids);
  }

  // ========== 关键结果管理 ==========

  /**
   * 为目标的关键结果添加记录（通过聚合根）
   */
  async addRecordToGoal(
    accountUuid: string,
    recordDTO: IRecord
  ): Promise<{ goal: Goal; record: Record }> {
    if (recordDTO.value <= 0) {
      throw new Error("记录值必须大于0");
    }

    const goal = await this.goalRepository.getGoalByUuid(
      accountUuid,
      recordDTO.goalUuid
    );
    if (!goal) {
      throw new Error(`目标不存在: ${recordDTO.goalUuid}`);
    }

    const record = Record.fromDTO(recordDTO);
    goal.addRecord(record);

    const updatedGoal = await this.goalRepository.updateGoal(accountUuid, goal);
    return { goal: updatedGoal, record };
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(accountUuid: string): Promise<Record[]> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const allRecords: Record[] = [];
    for (const goal of goals) {
      const records = await this.goalRepository.getRecordsByGoal(
        accountUuid,
        goal.uuid
      );
      allRecords.push(...records);
    }
    return allRecords;
  }

  /**
   * 根据目标ID获取记录
   */
  async getRecordsByGoalUuid(
    accountUuid: string,
    goalUuid: string
  ): Promise<Record[]> {
    const records = await this.goalRepository.getRecordsByGoal(
      accountUuid,
      goalUuid
    );
    return records;
  }

  /**
   * 删除记录
   */
  async deleteRecord(accountUuid: string, recordId: string): Promise<void> {
    await this.goalRepository.deleteRecord(accountUuid, recordId);
  }

  // ========== 目标复盘管理（聚合根驱动）==========

  /**
   * 为目标添加复盘（聚合根驱动）
   */
  async addReviewToGoal(
    accountUuid: string,
    goalReviewDTO: IGoalReview
  ): Promise<{ goal: Goal; review: GoalReview }> {
    try {
      console.log(
        "🔄 [MainGoalApplicationService.addReviewToGoal] 添加复盘:", goalReviewDTO
      );
      
      // Create review entity and add to goal
      const goalReview = GoalReview.fromDTO(goalReviewDTO);

      // Update goal with new review
      await this.goalRepository.createGoalReview(accountUuid, goalReview);
      const goal = await this.goalRepository.getGoalByUuid(
        accountUuid,
        goalReviewDTO.goalUuid
      );
      if (!goal) {
        throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
      }
      return { goal, review: goalReview };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`添加复盘失败：${error.message}`);
      } else {
        throw new Error(`添加复盘失败：${String(error)}`);
      }
    }
  }

  /**
   * 更新目标的复盘（聚合根驱动）
   */
  async updateReviewInGoal(
    accountUuid: string,
    goalReviewDTO: IGoalReview
  ): Promise<{ goal: Goal; review: GoalReview }> {
    const review = GoalReview.fromDTO(goalReviewDTO);
    await this.goalRepository.updateGoalReview(accountUuid, review);
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalReviewDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
    }
    return { goal, review };
  }

  /**
   * 从目标中移除复盘
   */
  async removeReviewFromGoal(
    accountUuid: string,
    goalReviewDTO: IGoalReview      
  ): Promise<Goal> {
    await this.goalRepository.removeGoalReview(accountUuid, goalReviewDTO.uuid);
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalReviewDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
    }
    return goal;
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalDir(
    accountUuid: string,
    goalDirDTO: IGoalDir
  ): Promise<GoalDir> {
    const validation = GoalDir.validate(goalDirDTO);
    if (!validation.isValid) {
      throw new Error(`目录数据验证失败: ${validation.errors.join(", ")}`);
    }

    // Convert DTO to domain object
    const goalDir = GoalDir.fromDTO(goalDirDTO);
    const createdGoalDir = await this.goalRepository.createGoalDirectory(
      accountUuid,
      goalDir
    );
    console.log(
      "✅ [MainGoalApplicationService.createGoalDir]:创建目标目录成功",
      createdGoalDir
    );
    return createdGoalDir;
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalDirs(accountUuid: string): Promise<GoalDir[]> {
    const goalDirs = await this.goalRepository.getAllGoalDirectories(
      accountUuid
    );
    return goalDirs;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(accountUuid: string, goalDirId: string): Promise<void> {
    const goalDir = await this.goalRepository.getGoalDirectoryByUuid(
      accountUuid,
      goalDirId
    );
    if (!goalDir) {
      throw new Error(`目标目录不存在: ${goalDirId}`);
    }

    const goalsInDir = await this.goalRepository.getGoalsByDirectory(
      accountUuid,
      goalDirId
    );
    if (goalsInDir.length > 0) {
      throw new Error(
        `无法删除目录，还有 ${goalsInDir.length} 个目标在使用此目录`
      );
    }

    await this.goalRepository.deleteGoalDirectory(accountUuid, goalDirId);
  }

  /**
   * 更新目标目录
   */
  async updateGoalDir(
    accountUuid: string,
    goalDirData: IGoalDir
  ): Promise<GoalDir> {
    const existingGoalDir = await this.goalRepository.getGoalDirectoryByUuid(
      accountUuid,
      goalDirData.uuid
    );
    if (!existingGoalDir) {
      throw new Error(`目标目录不存在: ${goalDirData.uuid}`);
    }

    // Convert DTO to domain object
    const updatedGoalDir = GoalDir.fromDTO(goalDirData);
    const result = await this.goalRepository.updateGoalDirectory(
      accountUuid,
      updatedGoalDir
    );
    return result;
  }

  /**
   * 删除目标的关键结果（通过聚合根）
   */
  async removeKeyResultFromGoal(
    accountUuid: string,
    goalUuid: string,
    keyResultId: string
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error("目标不存在");
    }

    goal.removeKeyResult(keyResultId);
    await this.goalRepository.updateGoal(accountUuid, goal);
    return goal;
  }
  // ========== 记录管理 ==========

  /**
   * 从目标中删除记录（通过聚合根）
   */
  async removeRecordFromGoal(
    accountUuid: string,
    goalUuid: string,
    recordId: string
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error("目标不存在");
    }

    goal.removeRecord(recordId);
    await this.goalRepository.updateGoal(accountUuid, goal);
    return goal;
  }
}
