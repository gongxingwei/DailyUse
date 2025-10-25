/**
 * @fileoverview Request DTO for resolving schedule conflicts
 * @module @dailyuse/contracts/modules/schedule/dto
 */

/**
 * Resolution strategies for schedule conflicts
 */
export enum ResolutionStrategy {
  /** Move schedule to a suggested time */
  RESCHEDULE = 'RESCHEDULE',
  /** Delete the schedule */
  CANCEL = 'CANCEL',
  /** Shorten duration to avoid conflict */
  ADJUST_DURATION = 'ADJUST_DURATION',
  /** Manual override - keep conflicts */
  IGNORE = 'IGNORE',
}

/**
 * Request DTO for resolving a schedule conflict
 */
export interface ResolveConflictRequestDTO {
  /**
   * Resolution strategy to apply
   */
  resolution: ResolutionStrategy;

  /**
   * New start time (required for RESCHEDULE strategy)
   * Unix timestamp in milliseconds
   */
  newStartTime?: number;

  /**
   * New end time (required for RESCHEDULE strategy)
   * Unix timestamp in milliseconds
   */
  newEndTime?: number;

  /**
   * New duration in minutes (required for ADJUST_DURATION strategy)
   */
  newDuration?: number;
}
