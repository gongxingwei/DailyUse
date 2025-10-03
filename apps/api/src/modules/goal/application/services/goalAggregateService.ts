import type { GoalContracts } from '@dailyuse/contracts';
import { GoalContracts as GoalContractsEnums } from '@dailyuse/contracts';
import { Goal, type IGoalRepository, KeyResult, GoalRecord, GoalReview } from '@dailyuse/domain-server';

/**
 * Goal 聚合根服务 - 重构版本
 * 核心原则：所有子实体操作都通过Goal聚合根的saveGoal()完成
 */
export class GoalAggregateService {
  constructor(private goalRepository: IGoalRepository) {}

  /**
   * 通过聚合根创建关键结果
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
    // 1. 获取聚合根实体
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根创建关键结果（业务规则验证在这里）
    const keyResultUuid = goalEntity.createKeyResult({
      name: request.name,
      description: request.description,
      startValue: request.startValue,
      targetValue: request.targetValue,
      currentValue: request.currentValue,
      unit: request.unit,
      weight: request.weight,
      calculationMethod: request.calculationMethod,
    });

    // 3. 保存整个聚合根（包括新的关键结果）
    const savedGoal = await this.goalRepository.saveGoal(accountUuid, goalEntity);

    // 4. 从保存后的聚合中获取关键结果
    const savedKeyResult = savedGoal.getKeyResult(keyResultUuid);
    if (!savedKeyResult) {
      throw new Error('Failed to retrieve saved key result');
    }

    // 5. 返回响应
    return {
      uuid: savedKeyResult.uuid,
      goalUuid: savedKeyResult.goalUuid,
      name: savedKeyResult.name,
      description: savedKeyResult.description,
      startValue: savedKeyResult.startValue,
      targetValue: savedKeyResult.targetValue,
      currentValue: savedKeyResult.currentValue,
      unit: savedKeyResult.unit,
      weight: savedKeyResult.weight,
      calculationMethod: savedKeyResult.calculationMethod,
      progress: savedKeyResult.progress,
      isCompleted: savedKeyResult.isCompleted,
      remaining: savedKeyResult.remaining,
      lifecycle: {
        createdAt: savedKeyResult.lifecycle.createdAt.getTime(),
        updatedAt: savedKeyResult.lifecycle.updatedAt.getTime(),
        status: savedKeyResult.lifecycle.status,
      },
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
    },
  ): Promise<GoalContracts.KeyResultResponse> {
    // 1. 获取聚合根实体
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根更新 KeyResult
    const updates: any = {};
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.currentValue !== undefined) updates.currentValue = request.currentValue;
    if (request.weight !== undefined) updates.weight = request.weight;

    goalEntity.updateKeyResult(keyResultUuid, updates);

    // 3. 保存整个聚合根
    const savedGoal = await this.goalRepository.saveGoal(accountUuid, goalEntity);

    // 4. 获取更新后的关键结果
    const updatedKeyResult = savedGoal.getKeyResult(keyResultUuid);
    if (!updatedKeyResult) {
      throw new Error('KeyResult not found after update');
    }

    // 5. 返回响应
    return {
      uuid: updatedKeyResult.uuid,
      goalUuid: updatedKeyResult.goalUuid,
      name: updatedKeyResult.name,
      description: updatedKeyResult.description,
      startValue: updatedKeyResult.startValue,
      targetValue: updatedKeyResult.targetValue,
      currentValue: updatedKeyResult.currentValue,
      unit: updatedKeyResult.unit,
      weight: updatedKeyResult.weight,
      calculationMethod: updatedKeyResult.calculationMethod,
      progress: updatedKeyResult.progress,
      isCompleted: updatedKeyResult.isCompleted,
      remaining: updatedKeyResult.remaining,
      lifecycle: {
        createdAt: updatedKeyResult.lifecycle.createdAt.getTime(),
        updatedAt: updatedKeyResult.lifecycle.updatedAt.getTime(),
        status: updatedKeyResult.lifecycle.status,
      },
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
    // 1. 获取聚合根实体
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根删除 KeyResult（会自动处理关联的 Records）
    goalEntity.removeKeyResult(keyResultUuid);

    // 3. 保存整个聚合根
    await this.goalRepository.saveGoal(accountUuid, goalEntity);
  }

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
  ): Promise<GoalContracts.GoalRecordClientDTO> {
    // 1. 获取聚合根实体
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根创建记录
    const recordUuid = goalEntity.createRecord({
      keyResultUuid: request.keyResultUuid,
      value: request.value,
      note: request.note,
    });

    // 3. 保存整个聚合根
    const savedGoal = await this.goalRepository.saveGoal(accountUuid, goalEntity);

    // 4. 从保存后的聚合中获取记录
    const savedRecord = savedGoal.records.find(r => r.uuid === recordUuid);
    if (!savedRecord) {
      throw new Error('Failed to retrieve saved record');
    }

    // 5. 返回响应
    return {
      uuid: savedRecord.uuid,
      goalUuid: savedGoal.uuid,
      keyResultUuid: savedRecord.keyResultUuid,
      value: savedRecord.value,
      note: savedRecord.note,
      createdAt: savedRecord.createdAt.getTime(),
    };
  }

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
  ): Promise<GoalContracts.GoalReviewClientDTO> {
    // 1. 获取聚合根实体
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根创建复盘
    const reviewUuid = goalEntity.createReview({
      title: request.title,
      type: request.type as GoalContractsEnums.GoalReviewType,
      content: request.content,
      rating: request.rating,
      reviewDate: request.reviewDate,
    });

    // 3. 保存整个聚合根
    const savedGoal = await this.goalRepository.saveGoal(accountUuid, goalEntity);

    // 4. 获取生成的复盘
    const savedReview = savedGoal.reviews.find(r => r.uuid === reviewUuid);
    if (!savedReview) {
      throw new Error('Failed to retrieve saved review');
    }

    // 5. 计算评分
    const overallRating =
      (savedReview.rating.progressSatisfaction +
        savedReview.rating.executionEfficiency +
        savedReview.rating.goalReasonableness) / 3;

    // 6. 返回响应
    return {
      uuid: savedReview.uuid,
      goalUuid: savedGoal.uuid,
      title: savedReview.title,
      type: savedReview.type,
      reviewDate: savedReview.reviewDate.getTime(),
      content: savedReview.content,
      snapshot: {
        ...savedReview.snapshot,
        snapshotDate: savedReview.snapshot.snapshotDate.getTime(),
      },
      rating: savedReview.rating,
      overallRating,
      isPositiveReview: overallRating >= 7,
      createdAt: savedReview.createdAt.getTime(),
      updatedAt: savedReview.updatedAt.getTime(),
    };
  }

  /**
   * 获取聚合根的完整视图
   */
  async getGoalAggregateView(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalAggregateViewResponse> {
    // 1. 获取聚合根实体（包含所有子实体）
    const goalEntity = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 转换为客户端响应格式
    return {
      goal: goalEntity.toClient(),
      keyResults: goalEntity.keyResults.map((kr) => ({
        uuid: kr.uuid,
        goalUuid: kr.goalUuid,
        name: kr.name,
        description: kr.description,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        weight: kr.weight,
        calculationMethod: kr.calculationMethod,
        progress: kr.progress,
        isCompleted: kr.isCompleted,
        remaining: kr.remaining,
        lifecycle: {
          createdAt: kr.lifecycle.createdAt.getTime(),
          updatedAt: kr.lifecycle.updatedAt.getTime(),
          status: kr.lifecycle.status,
        },
      })),
      recentRecords: goalEntity.records.slice(0, 5).map((record) => ({
        uuid: record.uuid,
        goalUuid: goalEntity.uuid,
        keyResultUuid: record.keyResultUuid,
        value: record.value,
        note: record.note,
        createdAt: record.createdAt.getTime(),
      })),
      reviews: goalEntity.reviews.map((review) => {
        const overallRating =
          (review.rating.progressSatisfaction +
            review.rating.executionEfficiency +
            review.rating.goalReasonableness) / 3;

        return {
          uuid: review.uuid,
          goalUuid: goalEntity.uuid,
          title: review.title,
          type: review.type,
          reviewDate: review.reviewDate.getTime(),
          content: review.content,
          snapshot: {
            ...review.snapshot,
            snapshotDate: review.snapshot.snapshotDate.getTime(),
          },
          rating: review.rating,
          overallRating,
          isPositiveReview: overallRating >= 7,
          createdAt: review.createdAt.getTime(),
          updatedAt: review.updatedAt.getTime(),
        };
      }),
    };
  }
}
