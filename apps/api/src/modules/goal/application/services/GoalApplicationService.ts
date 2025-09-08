import type { GoalContracts } from '@dailyuse/contracts';
import { GoalDomainService } from '../../domain/index.js';

export class GoalApplicationService {
  private goalDomainService: GoalDomainService;

  constructor() {
    this.goalDomainService = new GoalDomainService();
  }

  // ===== Goal 管理 =====

  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.createGoal(request);
  }

  async getGoals(queryParams: any): Promise<GoalContracts.GoalListResponse> {
    return await this.goalDomainService.getGoals(queryParams);
  }

  async getGoalById(uuid: string): Promise<GoalContracts.GoalResponse | null> {
    return await this.goalDomainService.getGoalById(uuid);
  }

  async updateGoal(
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.updateGoal(uuid, request);
  }

  async deleteGoal(uuid: string): Promise<void> {
    return await this.goalDomainService.deleteGoal(uuid);
  }

  // ===== Goal 状态管理 =====

  async activateGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.activateGoal(uuid);
  }

  async pauseGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.pauseGoal(uuid);
  }

  async completeGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.completeGoal(uuid);
  }

  async archiveGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    return await this.goalDomainService.archiveGoal(uuid);
  }

  // ===== 搜索和过滤 =====

  async searchGoals(queryParams: any): Promise<GoalContracts.GoalListResponse> {
    return await this.goalDomainService.searchGoals(queryParams);
  }
}
