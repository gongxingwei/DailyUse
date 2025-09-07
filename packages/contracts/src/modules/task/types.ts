import { ImportanceLevel, UrgencyLevel } from '../../core';

/**
 * 关键结果关联
 */
export interface KeyResultLink {
  goalUuid: string;
  keyResultId: string;
  incrementValue: number;
}

/**
 * 任务提醒配置
 */
export interface TaskReminderConfig {
  enabled: boolean;
  alerts: Array<{
    uuid: string;
    timing: {
      type: 'relative' | 'absolute';
      minutesBefore?: number;
      absoluteTime?: Date;
    };
    type: 'notification' | 'email' | 'sound';
    message?: string;
  }>;
  snooze: {
    enabled: boolean;
    interval: number;
    maxCount: number;
  };
}

/**
 * 重复规则
 */
export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  endCondition?: {
    type: 'never' | 'date' | 'count';
    endDate?: Date;
    count?: number;
  };
  config?: {
    weekdays?: number[];
    monthDays?: number[];
    monthWeekdays?: Array<{
      week: number;
      weekday: number;
    }>;
    months?: number[];
  };
}

/**
 * 任务时间配置
 */
export interface TaskTimeConfig {
  type: 'allDay' | 'timed' | 'timeRange';
  baseTime: {
    start: Date;
    end?: Date;
    duration?: number;
  };
  recurrence: RecurrenceRule;
  timezone: string;
  dstHandling?: 'auto' | 'ignore';
}

/**
 * 任务实例时间配置
 */
export interface TaskInstanceTimeConfig {
  type: 'allDay' | 'timed' | 'timeRange';
  scheduledTime: Date;
  endTime?: Date;
  estimatedDuration?: number;
  timezone: string;
  allowReschedule: boolean;
  maxDelayDays?: number;
}

/**
 * 任务实例提醒状态
 */
export interface TaskInstanceReminderStatus {
  enabled: boolean;
  alerts: Array<{
    uuid: string;
    alertConfig: TaskReminderConfig['alerts'][number];
    status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
    scheduledTime: Date;
    triggeredAt?: Date;
    dismissedAt?: Date;
    snoozeHistory: Array<{
      snoozedAt: Date;
      snoozeUntil: Date;
      reason?: string;
    }>;
  }>;
  globalSnoozeCount: number;
  lastTriggeredAt?: Date;
}

/**
 * 任务实例生命周期事件
 */
export interface TaskInstanceLifecycleEvent {
  type:
    | 'reminder_scheduled'
    | 'reminder_triggered'
    | 'reminder_dismissed'
    | 'reminder_snoozed'
    | 'reminder_cancelled'
    | 'task_started'
    | 'task_completed'
    | 'task_undo'
    | 'task_cancelled'
    | 'task_rescheduled'
    | 'task_overdue'
    | 'task_title_updated';
  timestamp: Date;
  alertId?: string;
  details?: Record<string, any>;
}

/**
 * 任务模板接口
 */
export interface ITaskTemplate {
  uuid: string;
  title: string;
  description?: string;
  timeConfig: TaskTimeConfig;
  reminderConfig: TaskReminderConfig;
  schedulingPolicy: {
    allowReschedule: boolean;
    maxDelayDays: number;
    skipWeekends: boolean;
    skipHolidays: boolean;
    workingHoursOnly: boolean;
  };
  metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
  };
  lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    pausedAt?: Date;
  };
  analytics: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime?: number;
    successRate: number;
    lastInstanceDate?: Date;
  };
  keyResultLinks?: KeyResultLink[];
  version: number;
}

/**
 * 任务实例接口
 */
export interface ITaskInstance {
  uuid: string;
  templateUuid: string;
  title: string;
  description?: string;
  timeConfig: TaskInstanceTimeConfig;
  reminderStatus: TaskInstanceReminderStatus;
  lifecycle: {
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    events: TaskInstanceLifecycleEvent[];
  };
  metadata: {
    estimatedDuration?: number;
    actualDuration?: number;
    category: string;
    tags: string[];
    location?: string;
    urgency: UrgencyLevel;
    importance: ImportanceLevel;
  };
  keyResultLinks?: KeyResultLink[];
  version: number;
}

/**
 * 任务元模板接口
 */
export interface ITaskMetaTemplate {
  uuid: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  defaultTimeConfig: TaskTimeConfig;
  defaultReminderConfig: TaskReminderConfig;
  defaultMetadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    location?: string;
  };
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  goalUuid?: string;
  keyResultId?: string;
  category?: string;
  tags?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  overall: {
    total: number;
    completed: number;
    incomplete: number;
    completionRate: number;
    missedTasks: number;
  };
  taskDetails: Array<{
    templateId: string;
    title: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
}
