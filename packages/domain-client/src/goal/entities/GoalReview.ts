import { GoalReview as GoalReviewCore } from '@dailyuse/domain-core';
import { type IGoalReview, type GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

export class GoalReview extends GoalReviewCore {
  constructor(params: IGoalReview) {
    super(params);
  }

  /**
   * 转换为 DTO
   */
  toDTO(): GoalContracts.GoalReviewDTO {
    return {
      uuid: this.uuid,
      goalUuid: this.goalUuid,
      title: this.title,
      type: this.type,
      reviewDate: this.reviewDate.getTime(),
      content: {
        achievements: this.content.achievements,
        challenges: this.content.challenges,
        learnings: this.content.learnings,
        nextSteps: this.content.nextSteps,
        adjustments: this.content.adjustments,
      },
      snapshot: {
        snapshotDate: this.snapshot.snapshotDate.getTime(),
        overallProgress: this.snapshot.overallProgress,
        weightedProgress: this.snapshot.weightedProgress,
        completedKeyResults: this.snapshot.completedKeyResults,
        totalKeyResults: this.snapshot.totalKeyResults,
        keyResultsSnapshot: this.snapshot.keyResultsSnapshot.map((kr) => ({
          uuid: kr.uuid,
          name: kr.name,
          progress: kr.progress,
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
        })),
      },
      rating: this.rating,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): GoalReview {
    return new GoalReview({
      uuid: this.uuid,
      goalUuid: this.goalUuid,
      title: this.title,
      type: this.type,
      reviewDate: new Date(this.reviewDate.getTime()),
      content: { ...this.content },
      snapshot: {
        ...this.snapshot,
        snapshotDate: new Date(this.snapshot.snapshotDate.getTime()),
        keyResultsSnapshot: this.snapshot.keyResultsSnapshot.map((kr) => ({ ...kr })),
      },
      rating: this.rating,
      createdAt: new Date(this.createdAt.getTime()),
      updatedAt: new Date(this.updatedAt.getTime()),
    });
  }
}
