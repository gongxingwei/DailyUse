/**
 * @fileoverview Request DTO for detecting schedule conflicts
 * @module @dailyuse/contracts/modules/schedule/dto
 */

/**
 * Request DTO for detecting schedule conflicts for a given time range
 */
export interface DetectConflictsRequestDTO {
  /**
   * User ID to check conflicts for
   */
  userId: string;

  /**
   * Start time of the schedule (Unix timestamp in milliseconds)
   */
  startTime: number;

  /**
   * End time of the schedule (Unix timestamp in milliseconds)
   */
  endTime: number;

  /**
   * Optional: Exclude a specific schedule UUID from conflict detection
   * Used when editing an existing schedule
   */
  excludeUuid?: string;
}
