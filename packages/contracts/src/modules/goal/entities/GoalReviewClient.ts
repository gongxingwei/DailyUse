/**
 * GoalReview Entity - Client Interface
 */

import type { ReviewType } from '../enums';
import type { GoalReviewServerDTO } from './GoalReviewServer';
import type { KeyResultSnapshotClientDTO } from '../value-objects';

export interface GoalReviewClientDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotClientDTO[];
  reviewedAt: number;
  createdAt: number;
  typeText: string;
  ratingText: string;
  formattedReviewedAt: string;
  formattedCreatedAt: string;
  ratingStars: string;
  displaySummary: string;
}

export interface GoalReviewClient {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotClientDTO[];
  reviewedAt: number;
  createdAt: number;
  typeText: string;
  ratingText: string;
  formattedReviewedAt: string;
  formattedCreatedAt: string;
  ratingStars: string;
  displaySummary: string;

  getRatingColor(): string;
  getRatingIcon(): string;
  hasAchievements(): boolean;
  hasChallenges(): boolean;
  hasImprovements(): boolean;
  getSnapshotCount(): number;

  toClientDTO(): GoalReviewClientDTO;
  toServerDTO(): GoalReviewServerDTO;
}

export interface GoalReviewClientStatic {
  fromClientDTO(dto: GoalReviewClientDTO): GoalReviewClient;
  fromServerDTO(dto: GoalReviewServerDTO): GoalReviewClient;
  forCreate(goalUuid: string): GoalReviewClient;
}

export interface GoalReviewClientInstance extends GoalReviewClient {
  clone(): GoalReviewClient;
}
