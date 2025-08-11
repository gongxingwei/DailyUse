// 从 common 中复制并简化的 Task 类型

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum TaskType {
  ALL_DAY = 'allDay',
  TIMED = 'timed',
  TIME_RANGE = 'timeRange',
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum EndConditionType {
  NEVER = 'never',
  DATE = 'date',
  COUNT = 'count',
}

export enum ReminderType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  SOUND = 'sound',
}

export enum ReminderTimingType {
  RELATIVE = 'relative',
  ABSOLUTE = 'absolute',
}

export enum ImportanceLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 关键结果关联（用于任务关联）
 */
export interface KeyResultLink {
  goalUuid: string;
  keyResultId: string;
  incrementValue: number;
}

/**
 * 重复规则结束条件
 */
export interface EndCondition {
  type: EndConditionType;
  endDate?: Date;
  count?: number;
}

/**
 * 重复规则配置
 */
export interface RecurrenceConfig {
  weekdays?: number[];
  monthDays?: number[];
  monthWeekdays?: Array<{
    week: number;
    weekday: number;
  }>;
  months?: number[];
}

/**
 * 重复规则
 */
export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number;
  endCondition?: EndCondition;
  config?: RecurrenceConfig;
}

/**
 * 任务时间配置
 */
export interface TaskTimeConfig {
  type: TaskType;
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
 * 提醒时机配置
 */
export interface ReminderTiming {
  type: ReminderTimingType;
  minutesBefore?: number;
  absoluteTime?: Date;
}

/**
 * 提醒项
 */
export interface ReminderAlert {
  uuid: string;
  timing: ReminderTiming;
  type: ReminderType;
  message?: string;
}

/**
 * 稍后提醒配置
 */
export interface SnoozeConfig {
  enabled: boolean;
  interval: number;
  maxCount: number;
}

/**
 * 任务提醒配置
 */
export interface TaskReminderConfig {
  enabled: boolean;
  alerts: ReminderAlert[];
  snooze: SnoozeConfig;
}

/**
 * 调度策略
 */
export interface SchedulingPolicy {
  allowReschedule: boolean;
  maxDelayDays: number;
  skipWeekends: boolean;
  skipHolidays: boolean;
  workingHoursOnly: boolean;
}

/**
 * 任务元数据
 */
export interface TaskMetadata {
  category: string;
  tags: string[];
  estimatedDuration?: number;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  location?: string;
}

/**
 * 任务分析数据
 */
export interface TaskAnalytics {
  totalInstances: number;
  completedInstances: number;
  averageCompletionTime?: number;
  successRate: number;
  lastInstanceDate?: Date;
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
  schedulingPolicy: SchedulingPolicy;
  metadata: TaskMetadata;
  lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    pausedAt?: Date;
  };
  analytics: TaskAnalytics;
  keyResultLinks?: KeyResultLink[];
  version: number;
}

/**
 * 任务实例时间配置
 */
export interface TaskInstanceTimeConfig {
  type: TaskType;
  scheduledTime: Date;
  endTime?: Date;
  estimatedDuration?: number;
  timezone: string;
  allowReschedule: boolean;
  maxDelayDays?: number;
}

/**
 * 提醒状态项
 */
export interface ReminderStatusAlert {
  uuid: string;
  alertConfig: ReminderAlert;
  status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
  scheduledTime: Date;
  triggeredAt?: Date;
  dismissedAt?: Date;
  snoozeHistory: Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    reason?: string;
  }>;
}

/**
 * 任务实例提醒状态
 */
export interface TaskInstanceReminderStatus {
  enabled: boolean;
  alerts: ReminderStatusAlert[];
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
    status: TaskStatus;
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
