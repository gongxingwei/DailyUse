/**
 * @fileoverview Response DTO for conflict resolution
 * @module @dailyuse/contracts/modules/schedule/dto
 */

import type { ScheduleClientDTO } from '../aggregates/ScheduleClient';
import type { ConflictDetectionResult } from '../ConflictDetectionResult';
import type { ResolutionStrategy } from './ResolveConflictRequest';

/**
 * Information about the applied resolution
 */
export interface AppliedResolution {
  /**
   * Strategy that was applied
   */
  strategy: ResolutionStrategy;

  /**
   * Previous start time (before resolution)
   */
  previousStartTime?: number;

  /**
   * Previous end time (before resolution)
   */
  previousEndTime?: number;

  /**
   * Human-readable list of changes made
   */
  changes: string[];
}

/**
 * Response DTO for resolving a schedule conflict
 */
export interface ResolveConflictResponseDTO {
  /**
   * Updated schedule after applying resolution
   */
  schedule: ScheduleClientDTO;

  /**
   * Re-detected conflicts (should be empty after successful resolution)
   */
  conflicts: ConflictDetectionResult;

  /**
   * Information about the applied resolution
   */
  applied: AppliedResolution;
}
