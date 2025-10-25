/**
 * Schedule Aggregate Client DTO
 * 
 * Client-side representation of a user-facing calendar event/meeting.
 * This is the DTO sent to web/desktop clients.
 * 
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

export interface ScheduleClientDTO {
  /**
   * Unique identifier for the schedule
   */
  readonly uuid: string;

  /**
   * Account that owns this schedule
   */
  readonly accountUuid: string;

  /**
   * Schedule title/summary (e.g., "Team Meeting", "Dentist Appointment")
   */
  readonly title: string;

  /**
   * Optional detailed description
   */
  readonly description?: string | null;

  /**
   * Start time (Unix timestamp in milliseconds)
   */
  readonly startTime: number;

  /**
   * End time (Unix timestamp in milliseconds)
   */
  readonly endTime: number;

  /**
   * Duration in minutes (calculated: (endTime - startTime) / 60000)
   */
  readonly duration: number;

  /**
   * Whether this schedule has conflicts with other schedules
   */
  readonly hasConflict: boolean;

  /**
   * Array of UUIDs of conflicting schedules (if hasConflict is true)
   */
  readonly conflictingSchedules?: readonly string[] | null;

  /**
   * Priority level (1-5, where 5 is highest)
   */
  readonly priority?: number | null;

  /**
   * Location (e.g., "Conference Room A", "Zoom Link")
   */
  readonly location?: string | null;

  /**
   * List of attendee email addresses or user UUIDs
   */
  readonly attendees?: readonly string[] | null;

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  readonly createdAt: number;

  /**
   * Last update timestamp (Unix timestamp in milliseconds)
   */
  readonly updatedAt: number;
}
