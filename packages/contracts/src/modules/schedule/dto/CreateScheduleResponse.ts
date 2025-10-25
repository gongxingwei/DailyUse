/**
 * @fileoverview Response DTO for schedule creation
 * @module @dailyuse/contracts/modules/schedule/dto
 */

import type { ScheduleClientDTO } from '../aggregates/ScheduleClient';
import type { ConflictDetectionResult } from '../ConflictDetectionResult';

/**
 * Response DTO for creating a schedule
 */
export interface CreateScheduleResponseDTO {
  /**
   * Created schedule
   */
  schedule: ScheduleClientDTO;

  /**
   * Conflict detection result (only present if autoDetectConflicts=true)
   */
  conflicts?: ConflictDetectionResult;
}
