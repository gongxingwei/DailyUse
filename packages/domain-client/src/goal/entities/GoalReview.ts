import { GoalReview as GoalReviewCore } from '@dailyuse/domain-core';
import { type IGoalReview } from "@dailyuse/contracts";
import { Entity } from "@dailyuse/utils";

export class GoalReview extends GoalReviewCore {
  constructor(params: IGoalReview) {
    super(params);
  }
}
