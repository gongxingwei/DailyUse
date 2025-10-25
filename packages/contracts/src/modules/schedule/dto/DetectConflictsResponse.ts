/**
 * @fileoverview Response DTO for conflict detection
 * @module @dailyuse/contracts/modules/schedule/dto
 */

import type { ConflictDetectionResult } from '../ConflictDetectionResult';

/**
 * Response DTO for conflict detection endpoint
 */
export interface DetectConflictsResponseDTO {
  /**
   * Conflict detection result containing conflicts and suggestions
   */
  result: ConflictDetectionResult;
}
