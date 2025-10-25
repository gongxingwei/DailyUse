/**
 * @fileoverview Request DTO for creating a new schedule
 * @module @dailyuse/contracts/modules/schedule/dto
 */

/**
 * Request DTO for creating a new schedule with automatic conflict detection
 */
export interface CreateScheduleRequestDTO {
  /**
   * Account UUID (user ID)
   */
  accountUuid: string;

  /**
   * Schedule title
   */
  title: string;

  /**
   * Schedule description (optional)
   */
  description?: string;

  /**
   * Start time (Unix timestamp in milliseconds)
   */
  startTime: number;

  /**
   * End time (Unix timestamp in milliseconds)
   */
  endTime: number;

  /**
   * Duration in minutes
   */
  duration: number;

  /**
   * Priority level (optional)
   */
  priority?: number;

  /**
   * Location (optional)
   */
  location?: string;

  /**
   * Attendees as JSON array (optional)
   */
  attendees?: string[];

  /**
   * Whether to automatically detect conflicts (default: true)
   */
  autoDetectConflicts?: boolean;
}
