import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
// import { GoalDomainService } from '@dailyuse/domain-server'; // TODO: 待实现
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
  // private domainService: GoalDomainService; // TODO: 待实现
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    // this.domainService = new GoalDomainService(goalRepository); // TODO: 待实现
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
    name: string;
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
    // TODO: 委托给领域服务处理业务逻辑
    // const goal = await this.domainService.createGoal(params);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.createGoal() not implemented - Domain service required',
    );
  }

  /**
   * 获取目标详情
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalContracts.GoalClientDTO | null> {
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.getGoal(uuid, options);
    // return goal ? goal.toClientDTO() : null;

    throw new Error('GoalApplicationService.getGoal() not implemented - Domain service required');
  }

  /**
   * 获取用户的所有目标
   */
  async getUserGoals(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalContracts.GoalClientDTO[]> {
    // TODO: 委托给领域服务处理
    // const goals = await this.domainService.getUserGoals(accountUuid, options);
    // return goals.map((g) => g.toClientDTO());

    throw new Error(
      'GoalApplicationService.getUserGoals() not implemented - Domain service required',
    );
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
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.updateGoal(uuid, updates);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.updateGoal() not implemented - Domain service required',
    );
  }

  /**
   * 更新目标状态
   */
  async updateGoalStatus(
    uuid: string,
    status: GoalContracts.GoalStatus,
    reason?: string,
  ): Promise<GoalContracts.GoalClientDTO> {
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.updateGoalStatus(uuid, status, reason);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.updateGoalStatus() not implemented - Domain service required',
    );
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    // TODO: 委托给领域服务处理
    // await this.domainService.deleteGoal(uuid);

    throw new Error(
      'GoalApplicationService.deleteGoal() not implemented - Domain service required',
    );
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.archiveGoal(uuid);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.archiveGoal() not implemented - Domain service required',
    );
  }

  /**
   * 添加关键结果
   */
  async addKeyResult(
    goalUuid: string,
    keyResult: {
      name: string;
      valueType: GoalContracts.KeyResultValueType;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight?: number;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.addKeyResult(goalUuid, keyResult);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.addKeyResult() not implemented - Domain service required',
    );
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
    // TODO: 委托给领域服务处理
    // const goal = await this.domainService.updateKeyResultProgress(goalUuid, keyResultUuid, currentValue, note);
    // return goal.toClientDTO();

    throw new Error(
      'GoalApplicationService.updateKeyResultProgress() not implemented - Domain service required',
    );
  }

  /**
   * 搜索目标
   */
  async searchGoals(accountUuid: string, query: string): Promise<GoalContracts.GoalClientDTO[]> {
    // TODO: 委托给领域服务处理
    // const goals = await this.domainService.searchGoals(accountUuid, query);
    // return goals.map((g) => g.toClientDTO());

    throw new Error(
      'GoalApplicationService.searchGoals() not implemented - Domain service required',
    );
  }

  /**
   * 获取目标统计
   */
  async getGoalStatistics(accountUuid: string): Promise<GoalContracts.GoalStatisticsClientDTO> {
    // TODO: 委托给领域服务处理
    // const stats = await this.domainService.getGoalStatistics(accountUuid);
    // return stats.toClientDTO();

    throw new Error(
      'GoalApplicationService.getGoalStatistics() not implemented - Domain service required',
    );
  }
}
