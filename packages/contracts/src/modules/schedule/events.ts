/**
 * Schedule Module Events
 * @description 任务调度模块的领域事件定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { SchedulePriority, ScheduleStatus, ScheduleTaskType } from './enums';
import type { IScheduleExecutionResult, IScheduleTask } from './types';

/**
 * 基础调度事件接口
 */
export interface BaseScheduleEvent {
  /** 事件ID */
  eventId: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 事件来源 */
  source: string;
  /** 用户ID */
  userId: string;
}

/**
 * 调度任务创建事件
 */
export interface ScheduleTaskCreatedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_CREATED';
  data: {
    task: IScheduleTask;
  };
}

/**
 * 调度任务更新事件
 */
export interface ScheduleTaskUpdatedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_UPDATED';
  data: {
    taskUuid: string;
    previousTask: Partial<IScheduleTask>;
    updatedTask: IScheduleTask;
    changes: string[];
  };
}

/**
 * 调度任务删除事件
 */
export interface ScheduleTaskDeletedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_DELETED';
  data: {
    taskUuid: string;
    deletedTask: IScheduleTask;
  };
}

/**
 * 调度任务执行开始事件
 */
export interface ScheduleTaskExecutionStartedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_EXECUTION_STARTED';
  data: {
    taskUuid: string;
    task: IScheduleTask;
    executionId: string;
    startTime: Date;
  };
}

/**
 * 调度任务执行完成事件
 */
export interface ScheduleTaskExecutionCompletedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_EXECUTION_COMPLETED';
  data: {
    taskUuid: string;
    executionResult: IScheduleExecutionResult;
  };
}

/**
 * 调度任务执行失败事件
 */
export interface ScheduleTaskExecutionFailedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_EXECUTION_FAILED';
  data: {
    taskUuid: string;
    task: IScheduleTask;
    error: string;
    executionId: string;
    retryCount: number;
    willRetry: boolean;
  };
}

/**
 * 调度任务状态变更事件
 */
export interface ScheduleTaskStatusChangedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_STATUS_CHANGED';
  data: {
    taskUuid: string;
    previousStatus: ScheduleStatus;
    newStatus: ScheduleStatus;
    reason?: string;
  };
}

/**
 * 提醒触发事件
 */
export interface ReminderTriggeredEvent extends BaseScheduleEvent {
  type: 'REMINDER_TRIGGERED';
  data: {
    taskUuid: string;
    reminderType: ScheduleTaskType;
    title: string;
    message: string;
    alertMethods: string[];
    scheduledTime: Date;
    actualTime: Date;
  };
}

/**
 * 提醒延后事件
 */
export interface ReminderSnoozedEvent extends BaseScheduleEvent {
  type: 'REMINDER_SNOOZED';
  data: {
    taskUuid: string;
    originalTime: Date;
    snoozeMinutes: number;
    newTime: Date;
    reason?: string;
  };
}

/**
 * 提醒确认事件
 */
export interface ReminderAcknowledgedEvent extends BaseScheduleEvent {
  type: 'REMINDER_ACKNOWLEDGED';
  data: {
    taskUuid: string;
    acknowledgedAt: Date;
    action: string;
  };
}

/**
 * 提醒忽略事件
 */
export interface ReminderDismissedEvent extends BaseScheduleEvent {
  type: 'REMINDER_DISMISSED';
  data: {
    taskUuid: string;
    dismissedAt: Date;
    reason?: string;
  };
}

/**
 * 调度任务启用事件
 */
export interface ScheduleTaskEnabledEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_ENABLED';
  data: {
    taskUuid: string;
    enabledBy: string;
  };
}

/**
 * 调度任务禁用事件
 */
export interface ScheduleTaskDisabledEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_DISABLED';
  data: {
    taskUuid: string;
    disabledBy: string;
    reason?: string;
  };
}

/**
 * 调度任务暂停事件
 */
export interface ScheduleTaskPausedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_PAUSED';
  data: {
    taskUuid: string;
    pausedBy: string;
    reason?: string;
    pausedAt: Date;
  };
}

/**
 * 调度任务恢复事件
 */
export interface ScheduleTaskResumedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_RESUMED';
  data: {
    taskUuid: string;
    resumedBy: string;
    resumedAt: Date;
    nextExecutionTime?: Date;
  };
}

/**
 * 调度任务超时事件
 */
export interface ScheduleTaskTimeoutEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_TIMEOUT';
  data: {
    taskUuid: string;
    timeoutSeconds: number;
    executionId: string;
    startTime: Date;
    timeoutTime: Date;
  };
}

/**
 * 调度任务重试事件
 */
export interface ScheduleTaskRetryEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_TASK_RETRY';
  data: {
    taskUuid: string;
    retryCount: number;
    maxRetries: number;
    previousError: string;
    nextRetryTime: Date;
  };
}

/**
 * 调度队列满载事件
 */
export interface ScheduleQueueOverloadEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_QUEUE_OVERLOAD';
  data: {
    queueSize: number;
    maxQueueSize: number;
    overloadLevel: 'warning' | 'critical';
    rejectedTasks: string[];
  };
}

/**
 * 调度系统启动事件
 */
export interface ScheduleSystemStartedEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_SYSTEM_STARTED';
  data: {
    systemVersion: string;
    startTime: Date;
    loadedTasks: number;
    activeSchedulers: number;
  };
}

/**
 * 调度系统关闭事件
 */
export interface ScheduleSystemShutdownEvent extends BaseScheduleEvent {
  type: 'SCHEDULE_SYSTEM_SHUTDOWN';
  data: {
    shutdownTime: Date;
    reason: string;
    pendingTasks: number;
    gracefulShutdown: boolean;
  };
}

/**
 * 所有调度事件的联合类型
 */
export type ScheduleEvent =
  | ScheduleTaskCreatedEvent
  | ScheduleTaskUpdatedEvent
  | ScheduleTaskDeletedEvent
  | ScheduleTaskExecutionStartedEvent
  | ScheduleTaskExecutionCompletedEvent
  | ScheduleTaskExecutionFailedEvent
  | ScheduleTaskStatusChangedEvent
  | ReminderTriggeredEvent
  | ReminderSnoozedEvent
  | ReminderAcknowledgedEvent
  | ReminderDismissedEvent
  | ScheduleTaskEnabledEvent
  | ScheduleTaskDisabledEvent
  | ScheduleTaskPausedEvent
  | ScheduleTaskResumedEvent
  | ScheduleTaskTimeoutEvent
  | ScheduleTaskRetryEvent
  | ScheduleQueueOverloadEvent
  | ScheduleSystemStartedEvent
  | ScheduleSystemShutdownEvent;

/**
 * 事件类型枚举
 */
export enum ScheduleEventType {
  SCHEDULE_TASK_CREATED = 'SCHEDULE_TASK_CREATED',
  SCHEDULE_TASK_UPDATED = 'SCHEDULE_TASK_UPDATED',
  SCHEDULE_TASK_DELETED = 'SCHEDULE_TASK_DELETED',
  SCHEDULE_TASK_EXECUTION_STARTED = 'SCHEDULE_TASK_EXECUTION_STARTED',
  SCHEDULE_TASK_EXECUTION_COMPLETED = 'SCHEDULE_TASK_EXECUTION_COMPLETED',
  SCHEDULE_TASK_EXECUTION_FAILED = 'SCHEDULE_TASK_EXECUTION_FAILED',
  SCHEDULE_TASK_STATUS_CHANGED = 'SCHEDULE_TASK_STATUS_CHANGED',
  REMINDER_TRIGGERED = 'REMINDER_TRIGGERED',
  REMINDER_SNOOZED = 'REMINDER_SNOOZED',
  REMINDER_ACKNOWLEDGED = 'REMINDER_ACKNOWLEDGED',
  REMINDER_DISMISSED = 'REMINDER_DISMISSED',
  SCHEDULE_TASK_ENABLED = 'SCHEDULE_TASK_ENABLED',
  SCHEDULE_TASK_DISABLED = 'SCHEDULE_TASK_DISABLED',
  SCHEDULE_TASK_PAUSED = 'SCHEDULE_TASK_PAUSED',
  SCHEDULE_TASK_RESUMED = 'SCHEDULE_TASK_RESUMED',
  SCHEDULE_TASK_TIMEOUT = 'SCHEDULE_TASK_TIMEOUT',
  SCHEDULE_TASK_RETRY = 'SCHEDULE_TASK_RETRY',
  SCHEDULE_QUEUE_OVERLOAD = 'SCHEDULE_QUEUE_OVERLOAD',
  SCHEDULE_SYSTEM_STARTED = 'SCHEDULE_SYSTEM_STARTED',
  SCHEDULE_SYSTEM_SHUTDOWN = 'SCHEDULE_SYSTEM_SHUTDOWN',
}

// ========== RecurringScheduleTask Events ==========

/**
 * 定时任务触发事件
 */
export interface ScheduleTaskTriggeredEvent {
  /** 任务 UUID */
  taskUuid: string;
  /** 任务名称 */
  taskName: string;
  /** 触发时间 */
  triggeredAt: Date;
  /** 关联的源模块 */
  sourceModule: string;
  /** 关联的源实体 ID */
  sourceEntityId: string;
  /** 任务元数据 */
  metadata?: Record<string, any>;
}

/**
 * 定时任务执行完成事件
 */
export interface ScheduleTaskCompletedEvent {
  /** 任务 UUID */
  taskUuid: string;
  /** 执行是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 执行耗时（毫秒） */
  durationMs: number;
  /** 完成时间 */
  completedAt: Date;
}
