import { GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IGoalReview = GoalContracts.IGoalReview;
type GoalReviewType = GoalContracts.GoalReviewType;
const GoalReviewTypeEnum = GoalContracts.GoalReviewType;

/**
 * GoalReview 核心基类 - 目标复盘实体
 */
export class GoalReview extends Entity implements IGoalReview {
  goalUuid: string;
  title: string;
  type: GoalReviewType;
  reviewDate: Date;
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  snapshot: {
    snapshotDate: Date;
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
    keyResultsSnapshot: Array<{
      uuid: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
    }>;
  };
  rating: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(params: IGoalReview) {
    super(params.uuid);
    this.goalUuid = params.goalUuid;
    this.title = params.title;
    this.type = params.type as GoalReviewType;
    this.reviewDate = params.reviewDate;
    this.content = params.content;
    this.snapshot = params.snapshot;
    this.rating = params.rating;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
