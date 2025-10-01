/**
 * Reminder 模块枚举定义
 */

export enum ReminderType {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  LOCATION_BASED = 'location_based',
  EVENT_BASED = 'event_based',
}

export enum ReminderStatus {
  PENDING = 'pending',
  TRIGGERED = 'triggered',
  ACKNOWLEDGED = 'acknowledged',
  DISMISSED = 'dismissed',
  SNOOZED = 'snoozed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ReminderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum SnoozeType {
  FIVE_MINUTES = '5_minutes',
  TEN_MINUTES = '10_minutes',
  THIRTY_MINUTES = '30_minutes',
  ONE_HOUR = '1_hour',
  TOMORROW = 'tomorrow',
  CUSTOM = 'custom',
}

export enum ReminderTemplateEnableMode {
  GROUP = 'group',
  INDIVIDUAL = 'individual',
}

export enum ReminderTimeConfigType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
}

export enum ReminderDurationUnit {
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
}

export enum ReminderSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SCHEDULED_TIME = 'scheduledTime',
  PRIORITY = 'priority',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
