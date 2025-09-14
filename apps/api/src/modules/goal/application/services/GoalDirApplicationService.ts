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
    accountUuid?: string,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.createGoalDir(request, accountUuid);
  }

  async getGoalDirs(
    queryParams: any,
    accountUuid?: string,
  ): Promise<GoalContracts.GoalDirListResponse> {
    return await this.goalDirDomainService.getGoalDirs(queryParams, accountUuid);
  }

  async getGoalDirById(
    uuid: string,
    accountUuid?: string,
  ): Promise<GoalContracts.GoalDirResponse | null> {
    return await this.goalDirDomainService.getGoalDirById(uuid, accountUuid);
  }

  async updateGoalDir(
    uuid: string,
    request: GoalContracts.UpdateGoalDirRequest,
    accountUuid?: string,
  ): Promise<GoalContracts.GoalDirResponse> {
    return await this.goalDirDomainService.updateGoalDir(uuid, request, accountUuid);
  }

  async deleteGoalDir(uuid: string, accountUuid?: string): Promise<void> {
    return await this.goalDirDomainService.deleteGoalDir(uuid, accountUuid);
  }
}
