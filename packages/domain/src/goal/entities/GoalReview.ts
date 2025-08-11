import { Entity } from '@dailyuse/utils';
import { GoalReviewType } from '../types';

interface GoalReviewContent {
  achievements: string;
  challenges: string;
  learnings: string;
  nextSteps: string;
  adjustments?: string;
}

interface GoalReviewSnapshot {
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
}

interface GoalReviewRating {
  progressSatisfaction: number;
  executionEfficiency: number;
  goalReasonableness: number;
}

export class GoalReview extends Entity {
  private _goalUuid: string;
  private _title: string;
  private _type: GoalReviewType;
  private _reviewDate: Date;
  private _content: GoalReviewContent;
  private _snapshot: GoalReviewSnapshot;
  private _rating: GoalReviewRating;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    type: GoalReviewType;
    reviewDate: Date;
    content: GoalReviewContent;
    snapshot: GoalReviewSnapshot;
    rating: GoalReviewRating;
  }) {
    super(params.uuid);
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._type = params.type;
    this._reviewDate = params.reviewDate;
    this._content = params.content;
    this._snapshot = params.snapshot;
    this._rating = params.rating;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get goalUuid(): string {
    return this._goalUuid;
  }

  get title(): string {
    return this._title;
  }

  get type(): GoalReviewType {
    return this._type;
  }

  get reviewDate(): Date {
    return this._reviewDate;
  }

  get content(): GoalReviewContent {
    return { ...this._content };
  }

  get snapshot(): GoalReviewSnapshot {
    return { ...this._snapshot };
  }

  get rating(): GoalReviewRating {
    return { ...this._rating };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lifecycle() {
    return {
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = new Date();
  }

  updateContent(content: Partial<GoalReviewContent>): void {
    this._content = { ...this._content, ...content };
    this._updatedAt = new Date();
  }

  updateRating(rating: Partial<GoalReviewRating>): void {
    this._rating = { ...this._rating, ...rating };
    this._updatedAt = new Date();
  }
}
