/**
 * GoalReview Entity - Server Interface
 */

import type { ReviewType } from '../enums';
import type { KeyResultSnapshotServerDTO } from '../value-objects';

export interface GoalReviewServerDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotServerDTO[];
  reviewedAt: number;
  createdAt: number;
}

export interface GoalReviewPersistenceDTO {
  uuid: string;
  goal_uuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  key_result_snapshots: string;
  reviewed_at: number;
  created_at: number;
}

export interface GoalReviewServer {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotServerDTO[];
  reviewedAt: number;
  createdAt: number;

  updateRating(rating: number): void;
  updateSummary(summary: string): void;
  addAchievement(achievement: string): void;
  addChallenge(challenge: string): void;
  addImprovement(improvement: string): void;
  isHighQuality(): boolean;

  toServerDTO(): GoalReviewServerDTO;
  toClientDTO(): GoalReviewClientDTO;
  toPersistenceDTO(): GoalReviewPersistenceDTO;
}

export interface GoalReviewServerStatic {
  create(params: {
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string;
    challenges?: string;
    improvements?: string;
    keyResultSnapshots?: KeyResultSnapshotServerDTO[];
    reviewedAt?: number;
  }): GoalReviewServer;
  fromServerDTO(dto: GoalReviewServerDTO): GoalReviewServer;
  fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReviewServer;
}
