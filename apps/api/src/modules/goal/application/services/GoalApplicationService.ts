import type { GoalContracts } from '@dailyuse/contracts';
import { type IGoalRepository, UserDataInitializationService } from '@dailyuse/domain-server';
import { GoalDomainService } from '../../domain/services/GoalDomainService';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';

export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private domainService: GoalDomainService;
  private userInitService: UserDataInitializationService;
  private goalRepository: IGoalRepository;

  constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService(goalRepository);
    this.userInitService = new UserDataInitializationService(goalRepository);
    this.goalRepository = goalRepository;
  }

  static async createInstance(goalRepository?: IGoalRepository): Promise<GoalApplicationService> {
    const goalContainer = GoalContainer.getInstance();
    goalRepository = goalRepository || (await goalContainer.getPrismaGoalRepository());
    this.instance = new GoalApplicationService(goalRepository);
    return this.instance;
  }

  static async getInstance(): Promise<GoalApplicationService> {
    if (!this.instance) {
      GoalApplicationService.instance = await GoalApplicationService.createInstance();
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
    // 委托给领域服务处理业务逻辑
    return await this.domainService.createGoal(accountUuid, request);
  }

  // 注意：createGoalAggregate 私有方法已移至 GoalDomainService

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

    // 委托给领域服务处理
    return await this.domainService.getGoals(accountUuid, parsedParams);
  }

  async getGoalById(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalClientDTO | null> {
    // 委托给领域服务处理
    return await this.domainService.getGoalById(accountUuid, uuid);
  }

  async updateGoal(
    accountUuid: string,
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalClientDTO> {
    // 委托给领域服务处理业务逻辑
    return await this.domainService.updateGoal(accountUuid, uuid, request);
  }

  // 注意：updateGoalAggregate 私有方法已移至 GoalDomainService

  async deleteGoal(accountUuid: string, uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteGoal(accountUuid, uuid);
  }

  // ===== Goal 状态管理 =====

  async activateGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.activateGoal(accountUuid, uuid);
  }

  async pauseGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.pauseGoal(accountUuid, uuid);
  }

  async completeGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.completeGoal(accountUuid, uuid);
  }

  async archiveGoal(accountUuid: string, uuid: string): Promise<GoalContracts.GoalClientDTO> {
    // 委托给领域服务处理
    return await this.domainService.archiveGoal(accountUuid, uuid);
  }

  // 注意：updateGoalStatus 私有方法已移至 GoalDomainService

  // ===== 搜索和过滤 =====

  async searchGoals(
    accountUuid: string,
    queryParams: any, // Use any since req.query provides strings
  ): Promise<GoalContracts.GoalListResponse> {
    // 委托给 getGoals（它会委托给领域服务）
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
  ): Promise<GoalContracts.KeyResultClientDTO> {
    return this.domainService.createKeyResultForGoal(accountUuid, goalUuid, request);
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
  ): Promise<GoalContracts.KeyResultClientDTO> {
    return this.domainService.updateKeyResultForGoal(accountUuid, goalUuid, keyResultUuid, request);
  }

  /**
   * 通过聚合根删除关键结果
   */
  async removeKeyResultFromGoal(
    accountUuid: string,
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<void> {
    return this.domainService.removeKeyResultFromGoal(accountUuid, goalUuid, keyResultUuid);
  }

  // ===== DDD 聚合根控制方法 - 目标记录管理 =====

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
    return this.domainService.createRecordForGoal(accountUuid, goalUuid, request);
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
  ): Promise<GoalContracts.GoalReviewClientDTO> {
    return this.domainService.createReviewForGoal(accountUuid, goalUuid, request);
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
    return this.domainService.getGoalAggregateView(accountUuid, goalUuid);
  }
}
