import { GoalReview as GoalReviewCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

// 枚举别名
const GoalReviewTypeEnum = GoalContracts.GoalReviewType;

type IGoalReview = GoalContracts.IGoalReview;

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

  static fromDTO(dto: GoalContracts.GoalReviewDTO): GoalReview {
    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      type: dto.type,
      reviewDate: new Date(dto.reviewDate),
      content: {
        achievements: dto.content.achievements,
        challenges: dto.content.challenges,
        learnings: dto.content.learnings,
        nextSteps: dto.content.nextSteps,
        adjustments: dto.content.adjustments,
      },
      snapshot: {
        snapshotDate: new Date(dto.snapshot.snapshotDate),
        overallProgress: dto.snapshot.overallProgress,
        weightedProgress: dto.snapshot.weightedProgress,
        completedKeyResults: dto.snapshot.completedKeyResults,
        totalKeyResults: dto.snapshot.totalKeyResults,
        keyResultsSnapshot: dto.snapshot.keyResultsSnapshot.map((kr) => ({
          uuid: kr.uuid,
          name: kr.name,
          progress: kr.progress,
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
        })),
      },
      rating: dto.rating,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static forCreate(goalUuid: string): GoalReview {
    return new GoalReview({
      uuid: Entity.generateUUID(),
      goalUuid,
      title: '',
      type: GoalReviewTypeEnum.WEEKLY,
      reviewDate: new Date(),
      content: {
        achievements: '',
        challenges: '',
        learnings: '',
        nextSteps: '',
        adjustments: '',
      },
      snapshot: {
        snapshotDate: new Date(),
        overallProgress: 0,
        weightedProgress: 0,
        completedKeyResults: 0,
        totalKeyResults: 0,
        keyResultsSnapshot: [],
      },
      rating: {
        progressSatisfaction: 0,
        executionEfficiency: 0,
        goalReasonableness: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
