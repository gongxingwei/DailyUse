import type { IGoalStatisticsRepository, IGoalRepository } from '@dailyuse/domain-server';
import { GoalStatisticsDomainService } from '@dailyuse/domain-server';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import type { GoalContracts } from '@dailyuse/contracts';

/**
 * GoalStatistics 应用服务
 * 负责协调统计相关的领域服务，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class GoalStatisticsApplicationService {
  private static instance: GoalStatisticsApplicationService;
  private domainService: GoalStatisticsDomainService;

  private constructor(
    statisticsRepository: IGoalStatisticsRepository,
    goalRepository: IGoalRepository,
  ) {
    this.domainService = new GoalStatisticsDomainService(statisticsRepository, goalRepository);
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: IGoalStatisticsRepository,
    goalRepository?: IGoalRepository,
  ): Promise<GoalStatisticsApplicationService> {
    const container = GoalContainer.getInstance();
    const statsRepo = statisticsRepository || container.getGoalStatisticsRepository();
    const goalRepo = goalRepository || container.getGoalRepository();

    GoalStatisticsApplicationService.instance = new GoalStatisticsApplicationService(
      statsRepo,
      goalRepo,
    );
    return GoalStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalStatisticsApplicationService> {
    if (!GoalStatisticsApplicationService.instance) {
      GoalStatisticsApplicationService.instance =
        await GoalStatisticsApplicationService.createInstance();
    }
    return GoalStatisticsApplicationService.instance;
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(accountUuid: string): Promise<GoalContracts.GoalStatisticsClientDTO> {
    // 委托给领域服务处理
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);

    // 转换为 ClientDTO
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(accountUuid: string): Promise<GoalContracts.GoalStatisticsClientDTO | null> {
    // 委托给领域服务处理
    const statistics = await this.domainService.getStatistics(accountUuid);

    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 初始化统计信息（从现有Goal数据计算）
   */
  async initializeStatistics(
    request: GoalContracts.InitializeGoalStatisticsRequest,
  ): Promise<GoalContracts.InitializeGoalStatisticsResponse> {
    try {
      // 委托给领域服务处理
      const statistics = await this.domainService.initializeStatistics(request.accountUuid);

      return {
        success: true,
        message: 'Goal statistics initialized successfully.',
        statistics: statistics.toServerDTO(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics: {
          accountUuid: request.accountUuid,
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
        },
      };
    }
  }

  /**
   * 重新计算统计信息（修复数据不一致）
   */
  async recalculateStatistics(
    request: GoalContracts.RecalculateGoalStatisticsRequest,
  ): Promise<GoalContracts.RecalculateGoalStatisticsResponse> {
    // 委托给领域服务处理（Response 已经是 DTO 格式）
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 处理统计更新事件（增量更新）
   */
  async handleStatisticsUpdateEvent(event: GoalContracts.GoalStatisticsUpdateEvent): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(accountUuid: string): Promise<boolean> {
    return await this.domainService.deleteStatistics(accountUuid);
  }
}
