import type { GoalContracts } from '@dailyuse/contracts';
import { GoalDomainService } from '../../domain/index.js';

type CreateGoalRequest = GoalContracts.CreateGoalRequest;
type UpdateGoalRequest = GoalContracts.UpdateGoalRequest;
type GoalResponse = GoalContracts.GoalResponse;
type GoalListResponse = GoalContracts.GoalListResponse;

export class GoalApplicationService {
  private goalDomainService: GoalDomainService;

  constructor() {
    this.goalDomainService = new GoalDomainService();
  }

  // 目标相关方法
  async createGoal(request: CreateGoalRequest): Promise<GoalResponse> {
    return this.goalDomainService.createGoal(request);
  }

  async getGoals(queryParams: any): Promise<GoalListResponse> {
    return this.goalDomainService.getGoals(queryParams);
  }

  async getGoalById(id: string): Promise<GoalResponse | null> {
    return this.goalDomainService.getGoalById(id);
  }

  async updateGoal(id: string, request: UpdateGoalRequest): Promise<GoalResponse> {
    return this.goalDomainService.updateGoal(id, request);
  }

  async deleteGoal(id: string): Promise<void> {
    return this.goalDomainService.deleteGoal(id);
  }

  async activateGoal(id: string): Promise<GoalResponse> {
    return this.goalDomainService.activateGoal(id);
  }

  async pauseGoal(id: string): Promise<GoalResponse> {
    return this.goalDomainService.pauseGoal(id);
  }

  async completeGoal(id: string): Promise<GoalResponse> {
    return this.goalDomainService.completeGoal(id);
  }

  async archiveGoal(id: string): Promise<GoalResponse> {
    return this.goalDomainService.archiveGoal(id);
  }

  // 进度相关方法
  async updateProgress(id: string, progress: number): Promise<GoalResponse> {
    return this.goalDomainService.updateProgress(id, progress);
  }

  async recordMilestone(goalId: string, milestoneData: any): Promise<GoalResponse> {
    return this.goalDomainService.recordMilestone(goalId, milestoneData);
  }

  // 统计和查询方法
  async getGoalStats(queryParams: any): Promise<any> {
    return this.goalDomainService.getGoalStats(queryParams);
  }

  async getGoalTimeline(goalId: string): Promise<any> {
    return this.goalDomainService.getGoalTimeline(goalId);
  }

  async searchGoals(queryParams: any): Promise<GoalListResponse> {
    return this.goalDomainService.searchGoals(queryParams);
  }

  async getActiveGoals(accountUuid: string): Promise<GoalListResponse> {
    return this.goalDomainService.getActiveGoals(accountUuid);
  }

  async getCompletedGoals(accountUuid: string, from?: Date, to?: Date): Promise<GoalListResponse> {
    return this.goalDomainService.getCompletedGoals(accountUuid, from, to);
  }
}
