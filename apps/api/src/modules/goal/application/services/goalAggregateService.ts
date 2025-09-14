import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, type IGoalRepository } from '@dailyuse/domain-server';

/**
 * Goal 聚合根服务
 * 体现DDD聚合根控制模式：通过聚合根管理所有子实体的CRUD操作
 *
 * 核心原则：
 * 1. 所有子实体操作都通过聚合根进行
 * 2. 聚合根负责维护业务规则和数据一致性
 * 3. 发布领域事件通知其他模块
 */
export class GoalAggregateService {
  constructor(private goalRepository: IGoalRepository) {}

  // ===== 聚合根控制：关键结果管理 =====

  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：只能通过Goal聚合根创建KeyResult
   */
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ): Promise<GoalContracts.KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    // 2. 转换为领域实体（聚合根）
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根创建关键结果（业务规则验证在这里）
    const keyResultUuid = goal.createKeyResult({
      accountUuid,
      name: request.name,
      description: request.description,
      startValue: request.startValue,
      targetValue: request.targetValue,
      currentValue: request.currentValue,
      unit: request.unit,
      weight: request.weight,
      calculationMethod: request.calculationMethod,
    });

    // 4. 获取新创建的关键结果
    const newKeyResult = goal.getKeyResult(keyResultUuid);
    if (!newKeyResult) {
      throw new Error('Failed to create key result');
    }

    // 5. 将聚合根的更改持久化到仓储
    const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
      goalUuid: newKeyResult.goalUuid,
      accountUuid,
      name: newKeyResult.name,
      description: newKeyResult.description,
      startValue: newKeyResult.startValue,
      targetValue: newKeyResult.targetValue,
      currentValue: newKeyResult.currentValue,
      unit: newKeyResult.unit,
      weight: newKeyResult.weight,
      calculationMethod: newKeyResult.calculationMethod,
    };

    const savedKeyResult = await this.goalRepository.createKeyResult(accountUuid, keyResultData);

    // 6. 更新Goal的版本号
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: {
        ...goalDTO.lifecycle,
        updatedAt: Date.now(),
      },
    });

    // 7. 返回响应
    return {
      uuid: savedKeyResult.uuid,
      goalUuid: savedKeyResult.goalUuid,
      accountUuid: savedKeyResult.accountUuid,
      name: savedKeyResult.name,
      description: savedKeyResult.description,
      startValue: savedKeyResult.startValue,
      targetValue: savedKeyResult.targetValue,
      currentValue: savedKeyResult.currentValue,
      unit: savedKeyResult.unit,
      weight: savedKeyResult.weight,
      calculationMethod: savedKeyResult.calculationMethod,
      progress: Math.min((savedKeyResult.currentValue / savedKeyResult.targetValue) * 100, 100),
      isCompleted: savedKeyResult.currentValue >= savedKeyResult.targetValue,
      remaining: Math.max(savedKeyResult.targetValue - savedKeyResult.currentValue, 0),
      lifecycle: savedKeyResult.lifecycle,
    };
  }

  /**
   * 通过聚合根更新关键结果
   */
  async updateKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    keyResultUuid: string,
    request: {
      name?: string;
      description?: string;
      currentValue?: number;
      weight?: number;
      status?: 'active' | 'completed' | 'archived';
    },
  ): Promise<GoalContracts.KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    // 2. 获取关键结果列表
    const keyResults = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);

    // 3. 构建完整的聚合根（包含子实体）
    const goal = Goal.fromDTO(goalDTO);
    // 注意：不直接添加DTO到聚合根，在需要时单独处理业务逻辑

    // 4. 通过聚合根更新关键结果（业务规则验证）
    goal.updateKeyResult(keyResultUuid, request);

    // 5. 持久化更改
    const updateData: Partial<GoalContracts.KeyResultDTO> = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.currentValue !== undefined) updateData.currentValue = request.currentValue;
    if (request.weight !== undefined) updateData.weight = request.weight;
    if (request.status !== undefined) {
      updateData.lifecycle = {
        createdAt: Date.now(), // 这里应该从现有数据获取
        updatedAt: Date.now(),
        status: request.status,
      };
    }

    const updatedKeyResult = await this.goalRepository.updateKeyResult(
      accountUuid,
      keyResultUuid,
      updateData,
    );

    // 6. 更新Goal版本
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: {
        ...goalDTO.lifecycle,
        updatedAt: Date.now(),
      },
    });

    return {
      uuid: updatedKeyResult.uuid,
      goalUuid: updatedKeyResult.goalUuid,
      accountUuid: updatedKeyResult.accountUuid,
      name: updatedKeyResult.name,
      description: updatedKeyResult.description,
      startValue: updatedKeyResult.startValue,
      targetValue: updatedKeyResult.targetValue,
      currentValue: updatedKeyResult.currentValue,
      unit: updatedKeyResult.unit,
      weight: updatedKeyResult.weight,
      calculationMethod: updatedKeyResult.calculationMethod,
      progress: Math.min((updatedKeyResult.currentValue / updatedKeyResult.targetValue) * 100, 100),
      isCompleted: updatedKeyResult.currentValue >= updatedKeyResult.targetValue,
      remaining: Math.max(updatedKeyResult.targetValue - updatedKeyResult.currentValue, 0),
      lifecycle: updatedKeyResult.lifecycle,
    };
  }

  /**
   * 通过聚合根删除关键结果
   */
  async removeKeyResultFromGoal(
    accountUuid: string,
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<void> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    // 2. 获取关键结果和记录
    const keyResults = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);
    const records = await this.goalRepository.getGoalRecordsByKeyResultUuid(
      accountUuid,
      keyResultUuid,
    );

    // 3. 构建聚合根
    const goal = Goal.fromDTO(goalDTO);
    // 注意：不直接添加DTO到聚合根，在需要时单独处理业务逻辑

    // 4. 通过聚合根删除（包含级联删除逻辑）
    goal.removeKeyResult(keyResultUuid);

    // 5. 持久化删除操作
    await this.goalRepository.deleteKeyResult(accountUuid, keyResultUuid);

    // 6. 级联删除相关记录
    for (const record of records) {
      await this.goalRepository.deleteGoalRecord(accountUuid, record.uuid);
    }

    // 7. 更新Goal版本
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: {
        ...goalDTO.lifecycle,
        updatedAt: Date.now(),
      },
    });
  }

  // ===== 聚合根控制：目标记录管理 =====

  /**
   * 通过聚合根创建目标记录
   */
  async createRecordForGoal(
    accountUuid: string,
    goalUuid: string,
    request: {
      keyResultUuid: string;
      value: number;
      note?: string;
    },
  ): Promise<GoalContracts.GoalRecordResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    // 2. 获取关键结果
    const keyResults = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);

    // 3. 构建聚合根
    const goal = Goal.fromDTO(goalDTO);
    // 注意：不直接添加DTO到聚合根，在需要时单独处理业务逻辑

    // 4. 通过聚合根创建记录（自动更新关键结果进度）
    const recordUuid = goal.createRecord({
      accountUuid,
      keyResultUuid: request.keyResultUuid,
      value: request.value,
      note: request.note,
    });

    // 5. 持久化记录
    const recordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'> = {
      accountUuid,
      goalUuid,
      keyResultUuid: request.keyResultUuid,
      value: request.value,
      note: request.note,
    };

    const savedRecord = await this.goalRepository.createGoalRecord(accountUuid, recordData);

    // 6. 更新关键结果的当前值
    const updatedKeyResult = goal.getKeyResult(request.keyResultUuid);
    if (updatedKeyResult) {
      await this.goalRepository.updateKeyResult(accountUuid, request.keyResultUuid, {
        currentValue: updatedKeyResult.currentValue,
        lifecycle: {
          createdAt: updatedKeyResult.lifecycle.createdAt.getTime(),
          updatedAt: Date.now(),
          status: updatedKeyResult.lifecycle.status,
        },
      });
    }

    return {
      uuid: savedRecord.uuid,
      accountUuid: savedRecord.accountUuid,
      goalUuid: savedRecord.goalUuid,
      keyResultUuid: savedRecord.keyResultUuid,
      value: savedRecord.value,
      note: savedRecord.note,
      createdAt: savedRecord.createdAt,
      xxxx: '', // 预留字段
    };
  }

  // ===== 聚合根控制：目标复盘管理 =====

  /**
   * 通过聚合根创建目标复盘
   */
  async createReviewForGoal(
    accountUuid: string,
    goalUuid: string,
    request: {
      title: string;
      type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
      content: {
        achievements: string;
        challenges: string;
        learnings: string;
        nextSteps: string;
        adjustments?: string;
      };
      rating: {
        progressSatisfaction: number;
        executionEfficiency: number;
        goalReasonableness: number;
      };
      reviewDate?: Date;
    },
  ): Promise<GoalContracts.GoalReviewResponse> {
    // 1. 获取聚合根（包含完整状态）
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    const keyResults = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);

    // 2. 构建聚合根
    const goal = Goal.fromDTO(goalDTO);
    // 注意：这里不加载关键结果到聚合根中，直接用于复盘快照生成

    // 3. 通过聚合根创建复盘（生成当前状态快照）
    const reviewUuid = goal.createReview({
      title: request.title,
      type: request.type,
      content: request.content,
      rating: request.rating,
      reviewDate: request.reviewDate,
    });

    // 4. 获取生成的复盘
    const newReview = goal.getLatestReview();
    if (!newReview) {
      throw new Error('Failed to create review');
    }

    // 5. 持久化复盘
    const reviewData: Omit<GoalContracts.GoalReviewDTO, 'uuid' | 'createdAt' | 'updatedAt'> = {
      goalUuid,
      title: newReview.title,
      type: newReview.type,
      reviewDate: newReview.reviewDate.getTime(),
      content: newReview.content,
      snapshot: {
        ...newReview.snapshot,
        snapshotDate: newReview.snapshot.snapshotDate.getTime(),
      },
      rating: newReview.rating,
    };

    const savedReview = await this.goalRepository.createGoalReview(accountUuid, reviewData);

    return {
      uuid: savedReview.uuid,
      goalUuid: savedReview.goalUuid,
      title: savedReview.title,
      type: savedReview.type,
      reviewDate: savedReview.reviewDate,
      content: savedReview.content,
      snapshot: savedReview.snapshot,
      rating: savedReview.rating,
      overallRating:
        (savedReview.rating.progressSatisfaction +
          savedReview.rating.executionEfficiency +
          savedReview.rating.goalReasonableness) /
        3,
      isPositiveReview:
        (savedReview.rating.progressSatisfaction +
          savedReview.rating.executionEfficiency +
          savedReview.rating.goalReasonableness) /
          3 >=
        7,
      createdAt: savedReview.createdAt,
      updatedAt: savedReview.updatedAt,
    };
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取聚合根的完整视图（用于复杂查询）
   */
  async getGoalAggregateView(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalAggregateViewResponse> {
    // 1. 获取根实体
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalDTO) {
      throw new Error('Goal not found');
    }

    // 2. 获取所有子实体
    const [keyResults, records, reviews] = await Promise.all([
      this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid),
      this.goalRepository.getGoalRecordsByGoalUuid(accountUuid, goalUuid),
      this.goalRepository.getGoalReviewsByGoalUuid(accountUuid, goalUuid),
    ]);

    // 3. 构建Goal实体以获取响应格式
    const goal = Goal.fromDTO(goalDTO);

    // 4. 直接返回视图数据
    return {
      goal: goal.toResponse(),
      keyResults: keyResults.map((kr) => ({
        uuid: kr.uuid,
        goalUuid: kr.goalUuid,
        accountUuid: kr.accountUuid,
        name: kr.name,
        description: kr.description,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        weight: kr.weight,
        calculationMethod: kr.calculationMethod,
        progress: Math.min((kr.currentValue / kr.targetValue) * 100, 100),
        isCompleted: kr.currentValue >= kr.targetValue,
        remaining: Math.max(kr.targetValue - kr.currentValue, 0),
        lifecycle: kr.lifecycle,
      })),
      recentRecords: records.records.slice(0, 5).map((record) => ({
        uuid: record.uuid,
        accountUuid: record.accountUuid,
        goalUuid: record.goalUuid,
        keyResultUuid: record.keyResultUuid,
        value: record.value,
        note: record.note,
        createdAt: record.createdAt,
        xxxx: '', // 预留字段
      })),
      reviews: reviews.map((review) => ({
        uuid: review.uuid,
        goalUuid: review.goalUuid,
        title: review.title,
        type: review.type,
        reviewDate: review.reviewDate,
        content: review.content,
        snapshot: {
          ...review.snapshot,
          snapshotDate:
            typeof review.snapshot.snapshotDate === 'number'
              ? review.snapshot.snapshotDate
              : review.snapshot.snapshotDate,
        },
        rating: review.rating,
        overallRating:
          (review.rating.progressSatisfaction +
            review.rating.executionEfficiency +
            review.rating.goalReasonableness) /
          3,
        isPositiveReview:
          (review.rating.progressSatisfaction +
            review.rating.executionEfficiency +
            review.rating.goalReasonableness) /
            3 >=
          7,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  }
}
