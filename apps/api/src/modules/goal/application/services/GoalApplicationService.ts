import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { Goal, type IGoalRepository, UserDataInitializationService } from '@dailyuse/domain-server';
import { GoalAggregateService } from './goalAggregateService';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';

export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private aggregateService: GoalAggregateService;
  private userInitService: UserDataInitializationService;
  private goalRepository: IGoalRepository;
  constructor(goalRepository: IGoalRepository) {
    this.aggregateService = new GoalAggregateService(goalRepository);
    this.userInitService = new UserDataInitializationService(goalRepository);
    this.goalRepository = goalRepository;
  }

  static async createInstance(
    goalRepository?: IGoalRepository
  ): Promise<GoalApplicationService> {
    const goalContainer = GoalContainer.getInstance();
    goalRepository =
      goalRepository || (await goalContainer.getPrismaGoalRepository());
    this.instance = new GoalApplicationService(goalRepository);
    return this.instance;
  }

  static async getInstance(): Promise<GoalApplicationService> {
    if (!this.instance) {
      GoalApplicationService.instance =
        await GoalApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===== 用户数据初始化 =====

  /**
   * 初始化用户目标模块数据
   * 在用户首次登录或访问目标模块时调用
   */
  async initializeUserData(accountUuid: string): Promise<void> {
    await this.userInitService.initializeUserGoalData(accountUuid);
  }

  /**
   * 确保默认目录存在
   * 用于修复缺失的系统目录
   */
  async ensureDefaultDirectories(accountUuid: string): Promise<void> {
    await this.userInitService.ensureDefaultDirectories(accountUuid);
  }

  /**
   * 获取用户的默认目录（全部目标）
   */
  async getDefaultDirectory(accountUuid: string): Promise<GoalContracts.GoalDirDTO> {
    return await this.userInitService.getDefaultDirectory(accountUuid);
  }

  // ===== Goal 管理 =====

  async createGoal(
    accountUuid: string,
    request: GoalContracts.CreateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 构建目标数据
    const goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'> = {
      accountUuid,
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
      // 初始时这些数组为空，将在聚合根创建过程中填充
      keyResults: [],
      records: [],
      reviews: [],
    };

    // 使用事务方式创建聚合根
    return await this.createGoalAggregate(accountUuid, goalData, {
      keyResults: request.keyResults || [],
      records: request.records || [],
      reviews: request.reviews || [],
    });
  }

  /**
   * 聚合根式创建目标
   * 在一个事务中创建目标及其所有子实体
   */
  private async createGoalAggregate(
    accountUuid: string,
    goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'>,
    subEntities: {
      keyResults: GoalContracts.CreateKeyResultRequest[];
      records: GoalContracts.CreateGoalRecordRequest[];
      reviews: GoalContracts.CreateGoalReviewRequest[];
    },
  ): Promise<GoalContracts.GoalResponse> {
    // 第一步：创建目标
    const createdGoal = await this.goalRepository.createGoal(accountUuid, goalData);

    // 第二步：创建关键结果
    const createdKeyResults: GoalContracts.KeyResultDTO[] = [];
    for (const krRequest of subEntities.keyResults) {
      const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
        accountUuid,
        goalUuid: createdGoal.uuid,
        name: krRequest.name,
        description: krRequest.description || '',
        startValue: krRequest.startValue,
        targetValue: krRequest.targetValue,
        currentValue: krRequest.currentValue || krRequest.startValue,
        unit: krRequest.unit,
        weight: krRequest.weight,
        calculationMethod: krRequest.calculationMethod || 'sum',
      };

      const createdKR = await this.goalRepository.createKeyResult(accountUuid, keyResultData);
      createdKeyResults.push(createdKR);
    }

    // 第三步：创建目标记录
    for (const recordRequest of subEntities.records) {
      let keyResultUuid: string;

      if (recordRequest.keyResultUuid) {
        keyResultUuid = recordRequest.keyResultUuid;
      } else if (recordRequest.keyResultIndex !== undefined) {
        if (recordRequest.keyResultIndex >= createdKeyResults.length) {
          throw new Error(`KeyResult index ${recordRequest.keyResultIndex} is out of bounds`);
        }
        keyResultUuid = createdKeyResults[recordRequest.keyResultIndex].uuid;
      } else {
        throw new Error('Either keyResultUuid or keyResultIndex must be provided for GoalRecord');
      }

      const recordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'> = {
        accountUuid,
        goalUuid: createdGoal.uuid,
        keyResultUuid,
        value: recordRequest.value,
        note: recordRequest.note || '',
      };

      await this.goalRepository.createGoalRecord(accountUuid, recordData);
    }

    // 第四步：创建目标复盘
    for (const reviewRequest of subEntities.reviews) {
      const reviewData: Omit<GoalContracts.GoalReviewDTO, 'uuid' | 'createdAt' | 'updatedAt'> = {
        goalUuid: createdGoal.uuid,
        title: reviewRequest.title,
        type: reviewRequest.type,
        reviewDate: reviewRequest.reviewDate || Date.now(),
        content: reviewRequest.content,
        snapshot: {
          snapshotDate: Date.now(),
          overallProgress: 0, // 新创建的目标进度为0
          weightedProgress: 0,
          completedKeyResults: 0,
          totalKeyResults: createdKeyResults.length,
          keyResultsSnapshot: createdKeyResults.map((kr) => ({
            uuid: kr.uuid,
            name: kr.name,
            progress: ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100,
            currentValue: kr.currentValue,
            targetValue: kr.targetValue,
          })),
        },
        rating: reviewRequest.rating,
      };

      await this.goalRepository.createGoalReview(accountUuid, reviewData);
    }

    // 第五步：重新获取完整的聚合根数据并返回
    const completeGoal = await this.goalRepository.getGoalByUuid(accountUuid, createdGoal.uuid);
    if (!completeGoal) {
      throw new Error('Failed to retrieve created goal aggregate');
    }

    const goal = Goal.fromDTO(completeGoal);
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
      const goal = Goal.createFromGoalDTO(goalDTO);
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
    try {
      console.log('[GoalApplicationService.updateGoal] Starting update for goal:', uuid);
      console.log(
        '[GoalApplicationService.updateGoal] Request data:',
        JSON.stringify(request, null, 2),
      );

      // 构建基本目标更新数据
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
          importanceLevel: request.analysis.importanceLevel || ImportanceLevel.Moderate,
          urgencyLevel: request.analysis.urgencyLevel || UrgencyLevel.Medium,
        };
      }

      if (request.metadata?.tags || request.metadata?.category) {
        updateData.metadata = {
          tags: request.metadata?.tags || [],
          category: request.metadata?.category || '',
        };
      }

      console.log(
        '[GoalApplicationService.updateGoal] Processed update data:',
        JSON.stringify(updateData, null, 2),
      );
      console.log('[GoalApplicationService.updateGoal] Sub-entity operations:', {
        keyResults: request.keyResults?.length || 0,
        records: request.records?.length || 0,
        reviews: request.reviews?.length || 0,
      });

      // 使用聚合根式更新
      const result = await this.updateGoalAggregate(accountUuid, uuid, updateData, {
        keyResults: request.keyResults || [],
        records: request.records || [],
        reviews: request.reviews || [],
      });

      console.log('[GoalApplicationService.updateGoal] Update completed successfully');
      return result;
    } catch (error) {
      console.error('[GoalApplicationService.updateGoal] Error updating goal:', error);
      console.error(
        '[GoalApplicationService.updateGoal] Error stack:',
        error instanceof Error ? error.stack : 'No stack trace',
      );
      console.error(
        '[GoalApplicationService.updateGoal] Request that failed:',
        JSON.stringify(request, null, 2),
      );
      throw error;
    }
  }

  /**
   * 聚合根式更新目标
   * 在一个事务中更新目标及其所有子实体
   */
  private async updateGoalAggregate(
    accountUuid: string,
    goalUuid: string,
    goalUpdateData: Partial<GoalContracts.GoalDTO>,
    subEntityOperations: {
      keyResults: Array<{
        action: 'create' | 'update' | 'delete';
        uuid?: string;
        data?: GoalContracts.CreateKeyResultRequest | Partial<GoalContracts.CreateKeyResultRequest>;
      }>;
      records: Array<{
        action: 'create' | 'update' | 'delete';
        uuid?: string;
        data?:
          | GoalContracts.CreateGoalRecordRequest
          | Partial<GoalContracts.CreateGoalRecordRequest>;
      }>;
      reviews: Array<{
        action: 'create' | 'update' | 'delete';
        uuid?: string;
        data?:
          | GoalContracts.CreateGoalReviewRequest
          | Partial<GoalContracts.CreateGoalReviewRequest>;
      }>;
    },
  ): Promise<GoalContracts.GoalResponse> {
    // 第一步：更新基本目标信息（如果有更新数据）
    let updatedGoal: GoalContracts.GoalDTO;
    if (Object.keys(goalUpdateData).length > 0) {
      updatedGoal = await this.goalRepository.updateGoal(accountUuid, goalUuid, goalUpdateData);
    } else {
      // 如果没有基本信息更新，获取当前目标
      const currentGoal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
      if (!currentGoal) {
        throw new Error('Goal not found');
      }
      updatedGoal = currentGoal;
    }

    // 第二步：处理关键结果操作
    const createdKeyResults: GoalContracts.KeyResultDTO[] = [];
    for (const krOperation of subEntityOperations.keyResults) {
      switch (krOperation.action) {
        case 'create':
          if (!krOperation.data) {
            throw new Error('KeyResult data is required for create operation');
          }
          const krData = krOperation.data as GoalContracts.CreateKeyResultRequest;
          const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
            accountUuid,
            goalUuid: updatedGoal.uuid,
            name: krData.name!,
            description: krData.description || '',
            startValue: krData.startValue!,
            targetValue: krData.targetValue!,
            currentValue: krData.currentValue || krData.startValue!,
            unit: krData.unit!,
            weight: krData.weight!,
            calculationMethod: krData.calculationMethod || 'sum',
          };
          const createdKR = await this.goalRepository.createKeyResult(accountUuid, keyResultData);
          createdKeyResults.push(createdKR);
          break;

        case 'update':
          if (!krOperation.uuid) {
            throw new Error('KeyResult UUID is required for update operation');
          }
          if (!krOperation.data) {
            throw new Error('KeyResult data is required for update operation');
          }
          await this.goalRepository.updateKeyResult(
            accountUuid,
            krOperation.uuid,
            krOperation.data as Partial<GoalContracts.KeyResultDTO>,
          );
          break;

        case 'delete':
          if (!krOperation.uuid) {
            throw new Error('KeyResult UUID is required for delete operation');
          }
          await this.goalRepository.deleteKeyResult(accountUuid, krOperation.uuid);
          break;
      }
    }

    // 第三步：处理目标记录操作
    for (const recordOperation of subEntityOperations.records) {
      switch (recordOperation.action) {
        case 'create':
          if (!recordOperation.data) {
            throw new Error('GoalRecord data is required for create operation');
          }
          const recordData = recordOperation.data as GoalContracts.CreateGoalRecordRequest;

          let keyResultUuid: string;
          if (recordData.keyResultUuid) {
            keyResultUuid = recordData.keyResultUuid;
          } else if (recordData.keyResultIndex !== undefined) {
            if (recordData.keyResultIndex >= createdKeyResults.length) {
              throw new Error(`KeyResult index ${recordData.keyResultIndex} is out of bounds`);
            }
            keyResultUuid = createdKeyResults[recordData.keyResultIndex].uuid;
          } else {
            throw new Error(
              'Either keyResultUuid or keyResultIndex must be provided for GoalRecord',
            );
          }

          const goalRecordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'> = {
            accountUuid,
            goalUuid: updatedGoal.uuid,
            keyResultUuid,
            value: recordData.value!,
            note: recordData.note || '',
          };
          await this.goalRepository.createGoalRecord(accountUuid, goalRecordData);
          break;

        case 'update':
          if (!recordOperation.uuid) {
            throw new Error('GoalRecord UUID is required for update operation');
          }
          if (!recordOperation.data) {
            throw new Error('GoalRecord data is required for update operation');
          }
          await this.goalRepository.updateGoalRecord(
            accountUuid,
            recordOperation.uuid,
            recordOperation.data as Partial<GoalContracts.GoalRecordDTO>,
          );
          break;

        case 'delete':
          if (!recordOperation.uuid) {
            throw new Error('GoalRecord UUID is required for delete operation');
          }
          await this.goalRepository.deleteGoalRecord(accountUuid, recordOperation.uuid);
          break;
      }
    }

    // 第四步：处理目标复盘操作
    for (const reviewOperation of subEntityOperations.reviews) {
      switch (reviewOperation.action) {
        case 'create':
          if (!reviewOperation.data) {
            throw new Error('GoalReview data is required for create operation');
          }
          const reviewData = reviewOperation.data as GoalContracts.CreateGoalReviewRequest;

          // 获取当前所有关键结果以生成快照
          const currentKeyResults = await this.goalRepository.getKeyResultsByGoalUuid(
            accountUuid,
            goalUuid,
          );

          const goalReviewData: Omit<
            GoalContracts.GoalReviewDTO,
            'uuid' | 'createdAt' | 'updatedAt'
          > = {
            goalUuid: updatedGoal.uuid,
            title: reviewData.title!,
            type: reviewData.type!,
            reviewDate: reviewData.reviewDate || Date.now(),
            content: reviewData.content!,
            snapshot: {
              snapshotDate: Date.now(),
              overallProgress: updatedGoal.version || 0, // 可以用其他进度计算逻辑
              weightedProgress: 0, // 可以根据关键结果计算
              completedKeyResults: currentKeyResults.filter(
                (kr) => (kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue) >= 1,
              ).length,
              totalKeyResults: currentKeyResults.length,
              keyResultsSnapshot: currentKeyResults.map((kr) => ({
                uuid: kr.uuid,
                name: kr.name,
                progress:
                  ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100,
                currentValue: kr.currentValue,
                targetValue: kr.targetValue,
              })),
            },
            rating: reviewData.rating!,
          };
          await this.goalRepository.createGoalReview(accountUuid, goalReviewData);
          break;

        case 'update':
          if (!reviewOperation.uuid) {
            throw new Error('GoalReview UUID is required for update operation');
          }
          if (!reviewOperation.data) {
            throw new Error('GoalReview data is required for update operation');
          }
          await this.goalRepository.updateGoalReview(
            accountUuid,
            reviewOperation.uuid,
            reviewOperation.data as Partial<GoalContracts.GoalReviewDTO>,
          );
          break;

        case 'delete':
          if (!reviewOperation.uuid) {
            throw new Error('GoalReview UUID is required for delete operation');
          }
          await this.goalRepository.deleteGoalReview(accountUuid, reviewOperation.uuid);
          break;
      }
    }

    // 第五步：重新获取完整的聚合根数据并返回
    console.log('[updateGoalAggregate] Retrieving complete goal data for uuid:', goalUuid);
    const completeGoal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!completeGoal) {
      throw new Error('Failed to retrieve updated goal aggregate');
    }

    console.log('[updateGoalAggregate] Complete goal DTO retrieved:', {
      uuid: completeGoal.uuid,
      name: completeGoal.name,
      keyResultsCount: completeGoal.keyResults?.length || 0,
      recordsCount: completeGoal.records?.length || 0,
      reviewsCount: completeGoal.reviews?.length || 0,
    });

    try {
      console.log('[updateGoalAggregate] Converting DTO to domain entity...');
      const goal = Goal.fromDTO(completeGoal);
      console.log('[updateGoalAggregate] Successfully created domain entity');

      console.log('[updateGoalAggregate] Converting to response...');
      const response = goal.toResponse();
      console.log('[updateGoalAggregate] Successfully converted to response');

      return response;
    } catch (error) {
      console.error('[updateGoalAggregate] Error in Goal.fromDTO() or toResponse():', error);
      console.error(
        '[updateGoalAggregate] Complete goal DTO that failed:',
        JSON.stringify(completeGoal, null, 2),
      );
      throw error;
    }
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
