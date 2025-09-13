import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, type IGoalRepository } from '@dailyuse/domain-server';
import { GoalAggregateService } from './goalAggregateService';

export class GoalApplicationService {
  private aggregateService: GoalAggregateService;

  constructor(private goalRepository: IGoalRepository) {
    this.aggregateService = new GoalAggregateService(goalRepository);
  }

  // ===== Goal 管理 =====

  async createGoal(
    accountUuid: string,
    request: GoalContracts.CreateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 构建目标数据
    const goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'> = {
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
        importanceLevel: request.analysis?.importanceLevel || 'moderate',
        urgencyLevel: request.analysis?.urgencyLevel || 'medium',
      },
      metadata: {
        tags: request.metadata?.tags || [],
        category: request.metadata?.category || '',
      },
      version: 1,
    };

    // 创建目标
    const created = await this.goalRepository.createGoal(accountUuid, goalData);

    // 转换为领域实体以获取响应格式
    const goal = Goal.fromDTO(created);
    return goal.toResponse();
  }

  async getGoals(
    accountUuid: string,
    queryParams: any, // Use any since req.query provides strings
  ): Promise<GoalContracts.GoalListResponse> {
    // Parse query parameters properly
    const parsedParams: GoalContracts.GoalQueryParams = {
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 10,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : undefined,
      search: queryParams.search,
      status: queryParams.status,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
      dirUuid: queryParams.dirUuid,
      tags: queryParams.tags
        ? Array.isArray(queryParams.tags)
          ? queryParams.tags
          : [queryParams.tags]
        : undefined,
      category: queryParams.category,
      importanceLevel: queryParams.importanceLevel,
      urgencyLevel: queryParams.urgencyLevel,
      startTime: queryParams.startTime ? parseInt(queryParams.startTime, 10) : undefined,
      endTime: queryParams.endTime ? parseInt(queryParams.endTime, 10) : undefined,
    };

    const result = await this.goalRepository.getAllGoals(accountUuid, parsedParams);

    const goals = result.goals.map((goalDTO) => {
      const goal = Goal.fromDTO(goalDTO);
      return goal.toResponse();
    });

    const page = parsedParams.page || 1;
    const limit = parsedParams.limit || 10;

    return {
      goals,
      total: result.total,
      page,
      limit,
      hasMore: page * limit < result.total,
    };
  }

  async getGoalById(accountUuid: string, uuid: string): Promise<GoalContracts.GoalResponse | null> {
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, uuid);
    if (!goalDTO) return null;

    const goal = Goal.fromDTO(goalDTO);
    return goal.toResponse();
  }

  async updateGoal(
    accountUuid: string,
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 构建更新数据
    const updateData: Partial<GoalContracts.GoalDTO> = {};

    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.color !== undefined) updateData.color = request.color;
    if (request.dirUuid !== undefined) updateData.dirUuid = request.dirUuid;
    if (request.startTime !== undefined)
      updateData.startTime = new Date(request.startTime).getTime();
    if (request.endTime !== undefined) updateData.endTime = new Date(request.endTime).getTime();
    if (request.note !== undefined) updateData.note = request.note;

    if (request.analysis) {
      updateData.analysis = {
        motive: request.analysis.motive || '',
        feasibility: request.analysis.feasibility || '',
        importanceLevel: request.analysis.importanceLevel || 'moderate',
        urgencyLevel: request.analysis.urgencyLevel || 'medium',
      };
    }

    if (request.metadata?.tags || request.metadata?.category) {
      updateData.metadata = {
        tags: request.metadata?.tags || [],
        category: request.metadata?.category || '',
      };
    }

    const updated = await this.goalRepository.updateGoal(accountUuid, uuid, updateData);
    const goal = Goal.fromDTO(updated);
    return goal.toResponse();
  }

  async deleteGoal(accountUuid: string, uuid: string): Promise<void> {
    await this.goalRepository.deleteGoal(accountUuid, uuid);
  }

  // ===== Goal 状态管理 =====

  async activateGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalResponse> {
    return this.updateGoalStatus(accountUuid, uuid, 'active');
  }

  async pauseGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalResponse> {
    return this.updateGoalStatus(accountUuid, uuid, 'paused');
  }

  async completeGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalResponse> {
    return this.updateGoalStatus(accountUuid, uuid, 'completed');
  }

  async archiveGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalResponse> {
    return this.updateGoalStatus(accountUuid, uuid, 'archived');
  }

  private async updateGoalStatus(
    accountUuid: string,
    uuid: string,
    status: 'active' | 'completed' | 'paused' | 'archived',
  ): Promise<GoalContracts.GoalResponse> {
    // 获取当前目标
    const currentGoal = await this.goalRepository.getGoalByUuid(accountUuid, uuid);
    if (!currentGoal) {
      throw new Error('Goal not found');
    }

    // 更新状态
    const updateData: Partial<GoalContracts.GoalDTO> = {
      lifecycle: {
        ...currentGoal.lifecycle,
        status,
        updatedAt: Date.now(),
      },
    };

    const updated = await this.goalRepository.updateGoal(accountUuid, uuid, updateData);
    const goal = Goal.fromDTO(updated);
    return goal.toResponse();
  }

  // ===== 搜索和过滤 =====

  async searchGoals(
    accountUuid: string,
    queryParams: any, // Use any since req.query provides strings
  ): Promise<GoalContracts.GoalListResponse> {
    return this.getGoals(accountUuid, queryParams);
  }

  // ===== DDD 聚合根控制方法 - 关键结果管理 =====

  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：所有子实体操作必须通过聚合根
   */
  async createKeyResult(
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
    return this.aggregateService.createKeyResultForGoal(accountUuid, goalUuid, request);
  }

  /**
   * 通过聚合根更新关键结果
   */
  async updateKeyResult(
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
    return this.aggregateService.updateKeyResultForGoal(
      accountUuid,
      goalUuid,
      keyResultUuid,
      request,
    );
  }

  /**
   * 通过聚合根删除关键结果
   */
  async deleteKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<void> {
    return this.aggregateService.removeKeyResultFromGoal(accountUuid, goalUuid, keyResultUuid);
  }

  // ===== DDD 聚合根控制方法 - 目标记录管理 =====

  /**
   * 通过聚合根创建目标记录
   */
  async createGoalRecord(
    accountUuid: string,
    goalUuid: string,
    request: {
      keyResultUuid: string;
      value: number;
      note?: string;
    },
  ): Promise<GoalContracts.GoalRecordResponse> {
    return this.aggregateService.createRecordForGoal(accountUuid, goalUuid, request);
  }

  // ===== DDD 聚合根控制方法 - 目标复盘管理 =====

  /**
   * 通过聚合根创建目标复盘
   */
  async createGoalReview(
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
    return this.aggregateService.createReviewForGoal(accountUuid, goalUuid, request);
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取完整的聚合根视图
   * 包含目标及所有相关子实体
   */
  async getGoalAggregateView(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalAggregateViewResponse> {
    return this.aggregateService.getGoalAggregateView(accountUuid, goalUuid);
  }
}
