import type { GoalContracts } from '@dailyuse/contracts';
import { GoalReview, type IGoalRepository } from '@dailyuse/domain-server';

export class GoalReviewApplicationService {
  constructor(private goalRepository: IGoalRepository) {}

  // ===== GoalReview 管理 =====

  async createGoalReview(
    accountUuid: string,
    goalUuid: string,
    request: GoalContracts.CreateGoalReviewRequest,
  ): Promise<GoalContracts.GoalReviewResponse> {
    // 获取目标信息来生成快照数据
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // 获取关键结果数据用于快照
    const keyResults = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);

    // 计算关键结果统计
    const completedKeyResults = keyResults.filter(
      (kr: GoalContracts.KeyResultDTO) => kr.currentValue >= kr.targetValue,
    ).length;
    const overallProgress =
      keyResults.length > 0
        ? keyResults.reduce(
            (sum: number, kr: GoalContracts.KeyResultDTO) =>
              sum + (kr.currentValue / kr.targetValue) * 100,
            0,
          ) / keyResults.length
        : 0;
    const weightedProgress =
      keyResults.length > 0
        ? keyResults.reduce(
            (sum: number, kr: GoalContracts.KeyResultDTO) =>
              sum + (kr.currentValue / kr.targetValue) * 100 * kr.weight,
            0,
          ) / keyResults.reduce((sum: number, kr: GoalContracts.KeyResultDTO) => sum + kr.weight, 0)
        : 0;

    // 构建目标复盘数据
    const goalReviewData: Omit<GoalContracts.GoalReviewDTO, 'uuid' | 'createdAt' | 'updatedAt'> = {
      goalUuid,
      title: request.title,
      type: request.type,
      reviewDate: request.reviewDate ? new Date(request.reviewDate).getTime() : Date.now(),
      content: request.content,
      rating: request.rating,
      snapshot: {
        snapshotDate: Date.now(),
        overallProgress: Math.min(100, Math.max(0, overallProgress)),
        weightedProgress: Math.min(100, Math.max(0, weightedProgress)),
        completedKeyResults,
        totalKeyResults: keyResults.length,
        keyResultsSnapshot: keyResults.map((kr: GoalContracts.KeyResultDTO) => ({
          uuid: kr.uuid,
          name: kr.name,
          progress: Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100)),
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
        })),
      },
    };

    // 创建目标复盘
    const created = await this.goalRepository.createGoalReview(accountUuid, goalReviewData);

    // 转换为领域实体以获取响应格式
    const goalReview = GoalReview.fromDTO(created);
    return goalReview.toResponse();
  }

  async getGoalReviewsByGoal(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalReviewListResponse> {
    const goalReviewDTOs = await this.goalRepository.getGoalReviewsByGoalUuid(
      accountUuid,
      goalUuid,
    );

    const goalReviews = goalReviewDTOs.map((dto: GoalContracts.GoalReviewDTO) => {
      const goalReview = GoalReview.fromDTO(dto);
      return goalReview.toResponse();
    });

    return {
      reviews: goalReviews,
      total: goalReviews.length,
    };
  }

  async getGoalReviewById(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalReviewResponse | null> {
    const goalReviewDTO = await this.goalRepository.getGoalReviewByUuid(accountUuid, uuid);

    if (!goalReviewDTO) {
      return null;
    }

    const goalReview = GoalReview.fromDTO(goalReviewDTO);
    return goalReview.toResponse();
  }

  async updateGoalReview(
    accountUuid: string,
    uuid: string,
    request: Partial<GoalContracts.CreateGoalReviewRequest>,
  ): Promise<GoalContracts.GoalReviewResponse> {
    // 构建更新数据
    const updateData: Partial<GoalContracts.GoalReviewDTO> = {};

    if (request.title !== undefined) updateData.title = request.title;
    if (request.type !== undefined) updateData.type = request.type;
    if (request.content !== undefined) updateData.content = request.content;
    if (request.rating !== undefined) updateData.rating = request.rating;
    if (request.reviewDate !== undefined) {
      updateData.reviewDate = new Date(request.reviewDate).getTime();
    }

    const updated = await this.goalRepository.updateGoalReview(accountUuid, uuid, updateData);

    // 转换为领域实体以获取响应格式
    const goalReview = GoalReview.fromDTO(updated);
    return goalReview.toResponse();
  }

  async deleteGoalReview(accountUuid: string, uuid: string): Promise<void> {
    await this.goalRepository.deleteGoalReview(accountUuid, uuid);
  }
}
