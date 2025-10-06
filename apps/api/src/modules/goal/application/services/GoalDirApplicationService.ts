import type { GoalContracts } from '@dailyuse/contracts';
import type { IGoalDirRepository, IGoalAggregateRepository } from '@dailyuse/domain-server';
import { GoalDirDomainService } from '../../domain/services/GoalDirDomainService.js';

/**
 * GoalDir 应用服务
 * 负责：
 * 1. 注入具体的 Repository 实现
 * 2. 协调领域服务
 * 3. 处理跨聚合根的操作
 */
export class GoalDirApplicationService {
  private goalDirDomainService: GoalDirDomainService;

  constructor(
    goalDirRepository: IGoalDirRepository,
    goalAggregateRepository: IGoalAggregateRepository,
  ) {
    // 注入 Repository 到领域服务
    this.goalDirDomainService = new GoalDirDomainService(
      goalDirRepository,
      goalAggregateRepository,
    );
  }

  // ===== GoalDir 管理 =====

  async createGoalDir(
    request: GoalContracts.CreateGoalDirRequest,
    accountUuid: string,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.createGoalDir(request, accountUuid);
  }

  async getGoalDirs(
    queryParams: any,
    accountUuid: string,
  ): Promise<GoalContracts.GoalDirListResponse> {
    return await this.goalDirDomainService.getGoalDirs(queryParams, accountUuid);
  }

  async getGoalDirById(
    uuid: string,
    accountUuid: string,
  ): Promise<GoalContracts.GoalDirResponse | null> {
    return await this.goalDirDomainService.getGoalDirById(uuid, accountUuid);
  }

  async updateGoalDir(
    uuid: string,
    request: GoalContracts.UpdateGoalDirRequest,
    accountUuid: string,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.updateGoalDir(uuid, request, accountUuid);
  }

  async deleteGoalDir(uuid: string, accountUuid: string): Promise<void> {
    return await this.goalDirDomainService.deleteGoalDir(uuid, accountUuid);
  }
}
