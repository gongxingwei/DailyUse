import type { GoalContracts } from '@dailyuse/contracts';
import { GoalDirDomainService } from '../../domain/services/GoalDirDomainService.js';

export class GoalDirApplicationService {
  private goalDirDomainService: GoalDirDomainService;

  constructor() {
    this.goalDirDomainService = new GoalDirDomainService();
  }

  // ===== GoalDir 管理 =====

  async createGoalDir(
    request: GoalContracts.CreateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.createGoalDir(request);
  }

  async getGoalDirs(queryParams: any): Promise<GoalContracts.GoalDirListResponse> {
    return await this.goalDirDomainService.getGoalDirs(queryParams);
  }

  async getGoalDirById(uuid: string): Promise<GoalContracts.GoalDirResponse | null> {
    return await this.goalDirDomainService.getGoalDirById(uuid);
  }

  async updateGoalDir(
    uuid: string,
    request: GoalContracts.UpdateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.updateGoalDir(uuid, request);
  }

  async deleteGoalDir(uuid: string): Promise<void> {
    return await this.goalDirDomainService.deleteGoalDir(uuid);
  }
}
