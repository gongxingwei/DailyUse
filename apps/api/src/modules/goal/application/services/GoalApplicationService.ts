import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { GoalDomainService, Goal } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';

/**
 * Goal 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private domainService: GoalDomainService;
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService(goalRepository);
    this.goalRepository = goalRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(goalRepository?: IGoalRepository): Promise<GoalApplicationService> {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();

    GoalApplicationService.instance = new GoalApplicationService(repo);
    return GoalApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalApplicationService> {
    if (!GoalApplicationService.instance) {
      GoalApplicationService.instance = await GoalApplicationService.createInstance();
    }
    return GoalApplicationService.instance;
  }

  // ===== Goal 管理 =====

  /**
   * 创建目标
   */
  async createGoal(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: GoalContracts.ImportanceLevel;
    urgency: GoalContracts.UrgencyLevel;
    parentGoalUuid?: string;
    folderUuid?: string;
    startDate?: number;
    deadline?: number;
    tags?: string[];
    metadata?: any;
  }): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.createGoal({
      ...params,
    });
    return goal.toClientDTO();
  }

  /**
   * 获取目标详情
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalContracts.GoalClientDTO | null> {
    const goal = await this.domainService.getGoal(uuid, options);
    return goal ? goal.toClientDTO() : null;
  }

  /**
   * 获取用户的所有目标
   */
  async getUserGoals(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalContracts.GoalClientDTO[]> {
    const goals = await this.domainService.getGoalsForAccount(accountUuid, options);
    return goals.map((g: Goal) => g.toClientDTO());
  }

  /**
   * 更新目标
   */
  async updateGoal(
    uuid: string,
    updates: Partial<{
      name: string;
      description: string;
      importance: GoalContracts.ImportanceLevel;
      urgency: GoalContracts.UrgencyLevel;
      deadline: number;
      tags: string[];
      metadata: any;
    }>,
  ): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.updateGoalBasicInfo(uuid, updates);
    return goal.toClientDTO();
  }

  /**
   * 更新目标状态
   */
  async updateGoalStatus(
    uuid: string,
    status: GoalContracts.GoalStatus,
    reason?: string,
  ): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.changeGoalStatus(uuid, status);
    return goal.toClientDTO();
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    await this.domainService.deleteGoal(uuid);
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.archiveGoal(uuid);
    return goal.toClientDTO();
  }

  /**
   * 添加关键结果
   */
  async addKeyResult(
    goalUuid: string,
    keyResult: {
      title: string;
      valueType: GoalContracts.KeyResultValueType;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.addKeyResultToGoal(goalUuid, keyResult);
    return goal.toClientDTO();
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<GoalContracts.GoalClientDTO> {
    const goal = await this.domainService.updateKeyResultProgress(
      goalUuid,
      keyResultUuid,
      currentValue,
      note,
    );
    return goal.toClientDTO();
  }

  /**
   * 搜索目标
   */
  async searchGoals(accountUuid: string, query: string): Promise<GoalContracts.GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, {});
    return goals
      .filter((g) => g.title.includes(query) || g.description?.includes(query))
      .map((g: Goal) => g.toClientDTO());
  }

  /**
   * 获取目标统计
   */
  async getGoalStatistics(accountUuid: string): Promise<GoalContracts.GoalStatisticsClientDTO> {
    // This should be implemented in the domain service and repository
    // For now, returning a dummy object
    return {
      accountUuid,
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      archivedGoals: 0,
      overdueGoals: 0,
      totalKeyResults: 0,
      completedKeyResults: 0,
      averageProgress: 0,
      goalsByImportance: {},
      goalsByUrgency: {},
      goalsByCategory: {},
      goalsByStatus: {},
      goalsCreatedThisWeek: 0,
      goalsCompletedThisWeek: 0,
      goalsCreatedThisMonth: 0,
      goalsCompletedThisMonth: 0,
      totalReviews: 0,
      averageRating: null,
      lastCalculatedAt: Date.now(),
      completionRate: 0,
      keyResultCompletionRate: 0,
      overdueRate: 0,
      weeklyTrend: 'STABLE',
      monthlyTrend: 'STABLE',
    };
  }
}
