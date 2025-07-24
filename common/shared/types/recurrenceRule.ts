export type Timezone = string;

export type Range = {
  start?: number;
  end?: number;
  step?: number;
};

export type Recurrence = number | Range | string;
export type RecurrenceSegment = Recurrence | Recurrence[];
export interface RecurrenceRule {
  /**
   * Day of the month.
   */
  date?: RecurrenceSegment | undefined;
  dayOfWeek?: RecurrenceSegment | undefined;
  hour?: RecurrenceSegment | undefined;
  minute?: RecurrenceSegment | undefined;
  month?: RecurrenceSegment | undefined;
  second?: RecurrenceSegment | undefined;
  year?: RecurrenceSegment | undefined;
  /**
   * Timezone
   */
  tz?: Timezone | undefined;
}

export interface RecurrenceSpecDateRange {
  /**
   * Starting date in date range.
   */
  start?: Date | string | number | undefined;
  /**
   * Ending date in date range.
   */
  end?: Date | string | number | undefined;
  /**
   * Cron expression string.
   */
  rule: string;
  /**
   * Timezone
   */
  tz?: Timezone | undefined;
}
