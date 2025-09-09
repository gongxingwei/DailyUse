import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, type IGoalRepository } from '@dailyuse/domain-server';

export class GoalApplicationService {
  constructor(private goalRepository: IGoalRepository) {}

  // ===== Goal 管理 =====

  async createGoal(
    accountUuid: string,
    request: GoalContracts.CreateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    // 构建目标数据
    const goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'> = {
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
        importanceLevel: request.analysis?.importanceLevel || 'moderate',
        urgencyLevel: request.analysis?.urgencyLevel || 'medium',
      },
      metadata: {
        tags: request.metadata?.tags || [],
        category: request.metadata?.category || '',
      },
      version: 1,
    };

    // 创建目标
    const created = await this.goalRepository.createGoal(accountUuid, goalData);

    // 转换为领域实体以获取响应格式
    const goal = Goal.fromDTO(created);
    return goal.toResponse();
  }

  async getGoals(
    accountUuid: string,
    queryParams: GoalContracts.GoalQueryParams,
  ): Promise<GoalContracts.GoalListResponse> {
    const result = await this.goalRepository.getAllGoals(accountUuid, queryParams);

    const goals = result.goals.map((goalDTO) => {
      const goal = Goal.fromDTO(goalDTO);
      return goal.toResponse();
    });

    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;

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
    // 构建更新数据
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
        importanceLevel: request.analysis.importanceLevel || 'moderate',
        urgencyLevel: request.analysis.urgencyLevel || 'medium',
      };
    }

    if (request.metadata?.tags || request.metadata?.category) {
      updateData.metadata = {
        tags: request.metadata?.tags || [],
        category: request.metadata?.category || '',
      };
    }

    const updated = await this.goalRepository.updateGoal(accountUuid, uuid, updateData);
    const goal = Goal.fromDTO(updated);
    return goal.toResponse();
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
    queryParams: GoalContracts.GoalQueryParams,
  ): Promise<GoalContracts.GoalListResponse> {
    return this.getGoals(accountUuid, queryParams);
  }
}
