import type { GoalContracts } from '@dailyuse/contracts';
import {
  ImportanceLevel,
  UrgencyLevel,
  GoalContracts as GoalContractsEnums,
} from '@dailyuse/contracts';
import type {
  IGoalAggregateRepository,
  Goal,
  KeyResult,
  GoalRecord,
  GoalReview,
} from '@dailyuse/domain-server';

/**
 * Goal 领域服务
 *
 * 职责：
 * - 处理 Goal 聚合根的核心业务逻辑
 * - 通过 IGoalAggregateRepository 接口操作数据
 * - 验证业务规则
 * - 管理 Goal 及其子实体（KeyResult、GoalRecord、GoalReview）
 *
 * 设计原则：
 * - 依赖倒置：只依赖 IGoalAggregateRepository 接口
 * - 单一职责：只处理 Goal 相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 * - 可移植：可安全移动到 @dailyuse/domain-server 包
 */
export class GoalDomainService {
  constructor(private readonly goalAggregateRepository: IGoalAggregateRepository) {}

  // ==================== Goal CRUD 操作 ====================

  /**
   * 创建目标聚合根
   * 业务规则：
   * 1. UUID 格式必须有效
   * 2. 名称必填
   * 3. 时间范围合理（结束时间 > 开始时间）
   * 4. 关键结果的 UUID 必须有效
   * 5. 在事务中创建目标及其所有子实体
   */
  async createGoal(
    accountUuid: string,
    request: GoalContracts.CreateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 验证 UUID 格式
    this.validateUUID(request.uuid, 'Goal UUID');

    // 构建目标数据
    const goalData: Omit<GoalContracts.GoalDTO, 'lifecycle'> = {
      uuid: request.uuid!,
      name: request.name,
      description: request.description,
      color: request.color || '#2196F3',
      dirUuid: request.dirUuid,
      startTime: request.startTime ? new Date(request.startTime).getTime() : Date.now(),
      endTime: request.endTime
        ? new Date(request.endTime).getTime()
        : Date.now() + 30 * 24 * 60 * 60 * 1000,
      note: request.note,
      analysis: {
        motive: request.analysis?.motive || '',
        feasibility: request.analysis?.feasibility || '',
        importanceLevel: request.analysis?.importanceLevel || ImportanceLevel.Moderate,
        urgencyLevel: request.analysis?.urgencyLevel || UrgencyLevel.Medium,
      },
      metadata: {
        tags: request.metadata?.tags || [],
        category: request.metadata?.category || '',
      },
      version: 1,
      keyResults: [],
      records: [],
      reviews: [],
    };

    // 验证时间范围
    this.validateTimeRange(goalData.startTime, goalData.endTime);

    // 创建聚合根（包含子实体）
    return await this.createGoalAggregate(accountUuid, goalData, {
      keyResults: request.keyResults || [],
      records: request.records || [],
      reviews: request.reviews || [],
    });
  }

  /**
   * 获取目标详情
   */
  async getGoalById(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalResponse | null> {
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      return null;
    }

    return goalEntity.toClient();
  }

  /**
   * 获取目标列表
   */
  async getGoals(
    accountUuid: string,
    queryParams?: {
      dirUuid?: string;
      status?: GoalContracts.GoalStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<GoalContracts.GoalListResponse> {
    const result = await this.goalAggregateRepository.getAllGoals(accountUuid, queryParams);

    const goals = result.goals.map((goalEntity) => goalEntity.toClient());

    return {
      data: goals,
      total: result.total,
      page: Math.floor((queryParams?.offset || 0) / (queryParams?.limit || 20)) + 1,
      limit: queryParams?.limit || 20,
      hasMore: result.total > (queryParams?.offset || 0) + goals.length,
    };
  }

  /**
   * 更新目标
   * 业务规则：
   * 1. 目标必须存在
   * 2. 更新后的时间范围合理
   * 3. 状态变更符合状态机规则
   */
  async updateGoal(
    accountUuid: string,
    goalUuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 获取现有目标
    const existingGoal = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!existingGoal) {
      throw new Error('Goal not found');
    }

    // 构建更新数据
    const goalDTO = existingGoal.toDTO();
    const updatedGoalDTO: GoalContracts.GoalDTO = {
      ...goalDTO,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.description !== undefined && { description: request.description }),
      ...(request.color !== undefined && { color: request.color }),
      ...(request.dirUuid !== undefined && { dirUuid: request.dirUuid }),
      ...(request.startTime !== undefined && { startTime: new Date(request.startTime).getTime() }),
      ...(request.endTime !== undefined && { endTime: new Date(request.endTime).getTime() }),
      ...(request.note !== undefined && { note: request.note }),
      ...(request.analysis !== undefined && {
        analysis: { ...goalDTO.analysis, ...request.analysis },
      }),
      ...(request.metadata !== undefined && {
        metadata: { ...goalDTO.metadata, ...request.metadata },
      }),
      lifecycle: {
        ...goalDTO.lifecycle,
        updatedAt: Date.now(),
      },
    };

    // 验证更新后的时间范围
    if (request.startTime !== undefined || request.endTime !== undefined) {
      this.validateTimeRange(updatedGoalDTO.startTime, updatedGoalDTO.endTime);
    }

    // 创建更新后的实体并保存
    const updatedGoalEntity = await this.createEntityFromDTO(updatedGoalDTO);
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, updatedGoalEntity);

    return savedGoal.toClient();
  }

  /**
   * 删除目标
   * 业务规则：
   * 1. 目标必须存在
   * 2. 级联删除所有子实体
   */
  async deleteGoal(accountUuid: string, goalUuid: string): Promise<void> {
    const existingGoal = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!existingGoal) {
      throw new Error('Goal not found');
    }

    const deleted = await this.goalAggregateRepository.deleteGoal(accountUuid, goalUuid);
    if (!deleted) {
      throw new Error('Failed to delete goal');
    }
  }

  // ==================== Goal 状态管理 ====================

  /**
   * 激活目标
   */
  async activateGoal(accountUuid: string, goalUuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.updateGoalStatus(accountUuid, goalUuid, GoalContractsEnums.GoalStatus.ACTIVE);
  }

  /**
   * 暂停目标
   */
  async pauseGoal(accountUuid: string, goalUuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.updateGoalStatus(accountUuid, goalUuid, GoalContractsEnums.GoalStatus.PAUSED);
  }

  /**
   * 完成目标
   */
  async completeGoal(accountUuid: string, goalUuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.updateGoalStatus(
      accountUuid,
      goalUuid,
      GoalContractsEnums.GoalStatus.COMPLETED,
    );
  }

  /**
   * 归档目标
   */
  async archiveGoal(accountUuid: string, goalUuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.updateGoalStatus(
      accountUuid,
      goalUuid,
      GoalContractsEnums.GoalStatus.ARCHIVED,
    );
  }

  // ==================== KeyResult 管理 ====================

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
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
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
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);

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
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
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
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);

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
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goalEntity) {
      throw new Error('Goal not found');
    }

    // 2. 通过聚合根删除 KeyResult（会自动处理关联的 Records）
    goalEntity.removeKeyResult(keyResultUuid);

    // 3. 保存整个聚合根
    await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);
  }

  // ==================== GoalRecord 管理 ====================

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
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
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
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);

    // 4. 从保存后的聚合中获取记录
    const savedRecord = savedGoal.records.find((r) => r.uuid === recordUuid);
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

  // ==================== GoalReview 管理 ====================

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
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
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
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);

    // 4. 获取生成的复盘
    const savedReview = savedGoal.reviews.find((r) => r.uuid === reviewUuid);
    if (!savedReview) {
      throw new Error('Failed to retrieve saved review');
    }

    // 5. 计算评分
    const overallRating =
      (savedReview.rating.progressSatisfaction +
        savedReview.rating.executionEfficiency +
        savedReview.rating.goalReasonableness) /
      3;

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

  // ==================== 聚合视图 ====================

  /**
   * 获取聚合根的完整视图
   */
  async getGoalAggregateView(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalAggregateViewResponse> {
    // 1. 获取聚合根实体（包含所有子实体）
    const goalEntity = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
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
            review.rating.goalReasonableness) /
          3;

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

  // ==================== 查询和统计 ====================

  /**
   * 获取活跃目标
   */
  async getActiveGoals(
    accountUuid: string,
    queryParams?: { limit?: number; offset?: number },
  ): Promise<GoalContracts.GoalListResponse> {
    return await this.getGoals(accountUuid, {
      ...queryParams,
      status: GoalContractsEnums.GoalStatus.ACTIVE,
    });
  }

  /**
   * 获取已完成目标
   */
  async getCompletedGoals(
    accountUuid: string,
    queryParams?: { from?: number; to?: number; limit?: number; offset?: number },
  ): Promise<GoalContracts.GoalListResponse> {
    return await this.getGoals(accountUuid, {
      limit: queryParams?.limit,
      offset: queryParams?.offset,
      status: GoalContractsEnums.GoalStatus.COMPLETED,
    });
  }

  /**
   * 获取目标统计信息
   */
  async getGoalStats(accountUuid: string): Promise<any> {
    // TODO: 将 repository 返回的统计数据转换为完整的 GoalStatsResponse
    const stats = await this.goalAggregateRepository.getGoalStats(accountUuid);
    return {
      ...stats,
      progressTrend: [],
      upcomingDeadlines: [],
    };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 创建目标聚合根（包含子实体）
   */
  private async createGoalAggregate(
    accountUuid: string,
    goalData: Omit<GoalContracts.GoalDTO, 'lifecycle'>,
    subEntities: {
      keyResults: GoalContracts.CreateKeyResultRequest[];
      records: GoalContracts.CreateGoalRecordRequest[];
      reviews: GoalContracts.CreateGoalReviewRequest[];
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    // 动态导入实体类
    const { Goal, KeyResult, GoalRecord } = await import('@dailyuse/domain-server');

    // 创建目标实体
    const goalDTO: GoalContracts.GoalDTO = {
      ...goalData,
      lifecycle: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active' as GoalContracts.GoalStatus,
      },
    };
    const goalEntity = Goal.fromDTO(goalDTO);

    // 添加关键结果
    for (const krRequest of subEntities.keyResults) {
      this.validateUUID(krRequest.uuid, 'KeyResult UUID');

      const keyResultDTO: GoalContracts.KeyResultDTO = {
        uuid: krRequest.uuid!,
        goalUuid: goalEntity.uuid,
        name: krRequest.name,
        description: krRequest.description || '',
        startValue: krRequest.startValue,
        targetValue: krRequest.targetValue,
        currentValue: krRequest.currentValue || krRequest.startValue,
        unit: krRequest.unit,
        weight: krRequest.weight,
        calculationMethod:
          krRequest.calculationMethod || GoalContractsEnums.KeyResultCalculationMethod.SUM,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active' as GoalContracts.KeyResultStatus,
        },
      };

      const keyResultEntity = KeyResult.fromDTO(keyResultDTO);
      goalEntity.addKeyResult(keyResultEntity);
    }

    // 添加目标记录
    for (const recordRequest of subEntities.records) {
      const keyResultUuid = recordRequest.keyResultUuid;
      if (!keyResultUuid) {
        throw new Error('keyResultUuid is required for GoalRecord');
      }

      const recordDTO: GoalContracts.GoalRecordDTO = {
        uuid: recordRequest.uuid || '',
        goalUuid: goalEntity.uuid,
        keyResultUuid,
        value: recordRequest.value,
        note: recordRequest.note || '',
        createdAt: Date.now(),
      };

      const recordEntity = GoalRecord.fromDTO(recordDTO);
      goalEntity.addRecord(recordEntity);
    }

    // 保存聚合根
    const savedGoalEntity = await this.goalAggregateRepository.saveGoal(accountUuid, goalEntity);

    // 处理 reviews（需要特殊的 snapshot 计算）
    for (const reviewRequest of subEntities.reviews) {
      const reviewDTO: GoalContracts.GoalReviewDTO = {
        uuid: reviewRequest.uuid || '',
        goalUuid: savedGoalEntity.uuid,
        title: reviewRequest.title,
        type: reviewRequest.type,
        reviewDate: reviewRequest.reviewDate || Date.now(),
        content: reviewRequest.content,
        snapshot: {
          snapshotDate: Date.now(),
          overallProgress: savedGoalEntity.calculatedProgress,
          weightedProgress: savedGoalEntity.calculatedProgress,
          completedKeyResults: 0,
          totalKeyResults: savedGoalEntity.keyResults.length,
          keyResultsSnapshot: savedGoalEntity.keyResults.map((kr) => ({
            uuid: kr.uuid,
            name: kr.name,
            progress: kr.calculatedProgress,
            currentValue: kr.currentValue,
            targetValue: kr.targetValue,
          })),
        },
        rating: reviewRequest.rating,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { GoalReview } = await import('@dailyuse/domain-server');
      const reviewEntity = GoalReview.fromDTO(reviewDTO);
      // 注意：reviews 在 Goal 实体中是直接通过属性访问，不是通过方法添加
      savedGoalEntity.reviews.push(reviewEntity);
    }

    // 如果有 reviews，需要再次保存
    if (subEntities.reviews.length > 0) {
      const finalSavedGoal = await this.goalAggregateRepository.saveGoal(
        accountUuid,
        savedGoalEntity,
      );
      return finalSavedGoal.toClient();
    }

    return savedGoalEntity.toClient();
  }

  /**
   * 更新目标状态
   */
  private async updateGoalStatus(
    accountUuid: string,
    goalUuid: string,
    status: GoalContracts.GoalStatus,
  ): Promise<GoalContracts.GoalResponse> {
    const existingGoal = await this.goalAggregateRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!existingGoal) {
      throw new Error('Goal not found');
    }

    const goalDTO = existingGoal.toDTO();
    const updatedGoalDTO: GoalContracts.GoalDTO = {
      ...goalDTO,
      lifecycle: {
        ...goalDTO.lifecycle,
        status,
        updatedAt: Date.now(),
      },
    };

    const updatedGoalEntity = await this.createEntityFromDTO(updatedGoalDTO);
    const savedGoal = await this.goalAggregateRepository.saveGoal(accountUuid, updatedGoalEntity);

    return savedGoal.toClient();
  }

  /**
   * 验证 UUID 格式
   */
  private validateUUID(uuid: string | undefined, fieldName: string): void {
    if (uuid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        throw new Error(`Invalid ${fieldName} format`);
      }
    }
  }

  /**
   * 验证时间范围
   */
  private validateTimeRange(startTime: number, endTime: number): void {
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
  }

  /**
   * 从 DTO 创建实体
   */
  private async createEntityFromDTO(dto: GoalContracts.GoalDTO): Promise<Goal> {
    const { Goal } = await import('@dailyuse/domain-server');
    return Goal.fromDTO(dto);
  }
}
