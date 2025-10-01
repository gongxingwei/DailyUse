/**
 * Reminder 模块持久化 DTO 定义
 */

import { ImportanceLevel } from '../../shared/index';
import {
  ReminderPriority,
  ReminderStatus,
  ReminderTemplateEnableMode,
  ReminderTimeConfigType,
  ReminderType,
  RecurrencePattern,
  SnoozeType,
} from './enums';

export interface ReminderTemplatePersistenceDTO {
  uuid: string;
  groupUuid?: string;
  name: string;
  description?: string;
  message: string;
  enabled: number; // 0 or 1
  selfEnabled: number; // 0 or 1
  importanceLevel?: ImportanceLevel;
  timeConfig: string; // JSON string of ReminderTimeConfig
  priority: ReminderPriority;
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
  position?: string; // JSON string { x, y }
  displayOrder: number;
  notificationSettings?: string; // JSON string
  snoozeConfig?: string; // JSON string
  lifecycle: string; // JSON string { createdAt, updatedAt, lastTriggered, triggerCount }
  analytics: string; // JSON string
  version: number;
}

export interface ReminderTemplateGroupPersistenceDTO {
  uuid: string;
  parentUuid?: string;
  name: string;
  description?: string;
  enabled: number; // 0 or 1
  enableMode: ReminderTemplateEnableMode;
  icon?: string;
  color?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderInstancePersistenceDTO {
  uuid: string;
  templateUuid: string;
  title?: string;
  message: string;
  scheduledTime: Date;
  triggeredTime?: Date;
  acknowledgedTime?: Date;
  dismissedTime?: Date;
  snoozedUntil?: Date;
  status: ReminderStatus;
  priority: ReminderPriority;
  type: ReminderType;
  metadata: string; // JSON string
  snoozeHistory: string; // JSON string of Snooze entries
  currentSnoozeCount?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderSchedulePersistenceDTO {
  uuid: string;
  templateUuid: string;
  name: string;
  description?: string;
  enabled: number; // 0 or 1
  nextExecutionTime: Date;
  lastExecutionTime?: Date;
  executionCount: number;
  maxExecutions?: number;
  recurrenceRule: string; // JSON string
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderScheduleRulePersistenceDTO {
  uuid: string;
  templateUuid: string;
  nextTriggerTime: Date;
  recurrencePattern: ReminderTimeConfigType;
  customSchedule?: string; // JSON string for ReminderTimeConfig
  isActive: number; // 0 or 1
  lastProcessed?: Date;
  timezone?: string;
  executionCount?: number;
  maxExecutions?: number;
}

export interface ReminderRecurrenceRulePersistenceDTO {
  pattern: RecurrencePattern;
  interval?: number;
  endCondition?: string; // JSON string
  customConfig?: string; // JSON string
}

export interface ReminderSnoozeHistoryPersistenceDTO {
  reminderUuid: string;
  snoozedAt: Date;
  snoozeUntil: Date;
  snoozeType?: SnoozeType;
  customMinutes?: number;
  reason?: string;
}

export interface ReminderStatisticsPersistenceDTO {
  uuid: string;
  total: number;
  pending: number;
  triggered: number;
  acknowledged: number;
  dismissed: number;
  snoozed: number;
  expired: number;
  avgResponseTime: number;
  acknowledgmentRate: number;
  byPriority: string; // JSON string keyed by ReminderPriority
  byStatus: string; // JSON string keyed by ReminderStatus
  byType: string; // JSON string keyed by ReminderType
  calculatedAt: Date;
}
