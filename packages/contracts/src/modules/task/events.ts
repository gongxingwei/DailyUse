import type { KeyResultLink } from './types';

/**
 * 任务模板事件基础接口
 */
interface TaskTemplateEventBase {
  aggregateId: string; // TaskTemplate UUID
  occurredOn: Date;
  accountUuid: string;
}

/**
 * 任务实例事件基础接口
 */
interface TaskInstanceEventBase {
  aggregateId: string; // TaskInstance UUID
  occurredOn: Date;
  accountUuid: string;
  templateUuid: string;
}

/**
 * 任务元模板事件基础接口
 */
interface TaskMetaTemplateEventBase {
  aggregateId: string; // TaskMetaTemplate UUID
  occurredOn: Date;
  accountUuid: string;
}

// =============== 任务模板事件 ===============

/**
 * 任务模板创建事件
 */
export interface TaskTemplateCreatedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplateCreated';
  payload: {
    title: string;
    timeConfig: {
      scheduleMode: string;
      timezone: string;
    };
  };
}

/**
 * 任务模板更新事件
 */
export interface TaskTemplateUpdatedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplateUpdated';
  payload: {
    updatedFields: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  };
}

/**
 * 任务模板激活事件
 */
export interface TaskTemplateActivatedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplateActivated';
  payload: {
    activatedAt: Date;
  };
}

/**
 * 任务模板暂停事件
 */
export interface TaskTemplatePausedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplatePaused';
  payload: {
    pausedAt: Date;
    reason?: string;
  };
}

/**
 * 任务模板完成事件
 */
export interface TaskTemplateCompletedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplateCompleted';
  payload: {
    completedAt: Date;
    totalInstances: number;
    completedInstances: number;
  };
}

/**
 * 任务模板归档事件
 */
export interface TaskTemplateArchivedEvent extends TaskTemplateEventBase {
  eventType: 'TaskTemplateArchived';
  payload: {
    archivedAt: Date;
    reason?: string;
  };
}

// =============== 任务实例事件 ===============

/**
 * 任务实例创建事件
 */
export interface TaskInstanceCreatedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceCreated';
  payload: {
    title: string;
    scheduledDate: Date;
    importance: string;
    urgency: string;
  };
}

/**
 * 任务实例开始事件
 */
export interface TaskInstanceStartedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceStarted';
  payload: {
    startedAt: Date;
    estimatedDuration?: number;
  };
}

/**
 * 任务实例暂停事件
 */
export interface TaskInstancePausedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstancePaused';
  payload: {
    pausedAt: Date;
    currentProgress: number;
    note?: string;
  };
}

/**
 * 任务实例恢复事件
 */
export interface TaskInstanceResumedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceResumed';
  payload: {
    resumedAt: Date;
    pauseDuration: number; // 分钟
  };
}

/**
 * 任务实例完成事件
 */
export interface TaskInstanceCompletedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceCompleted';
  payload: {
    completedAt: Date;
    actualDuration?: number;
    progressPercentage: number;
    goalLinks?: KeyResultLink[];
    notes?: string;
  };
}

/**
 * 任务实例取消完成事件
 */
export interface TaskInstanceUndoCompletedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceUndoCompleted';
  payload: {
    undoAt: Date;
    goalLinks?: KeyResultLink[];
    reason?: string;
  };
}

/**
 * 任务实例取消事件
 */
export interface TaskInstanceCancelledEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceCancelled';
  payload: {
    cancelledAt: Date;
    reason?: string;
    progress: number;
  };
}

/**
 * 任务实例重新调度事件
 */
export interface TaskInstanceRescheduledEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceRescheduled';
  payload: {
    oldScheduledDate: Date;
    newScheduledDate: Date;
    oldStartTime?: string;
    newStartTime?: string;
    reason?: string;
    rescheduledAt: Date;
  };
}

/**
 * 任务实例逾期事件
 */
export interface TaskInstanceOverdueEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceOverdue';
  payload: {
    overdueAt: Date;
    originalScheduledDate: Date;
    daysPastDue: number;
  };
}

/**
 * 任务实例进度更新事件
 */
export interface TaskInstanceProgressUpdatedEvent extends TaskInstanceEventBase {
  eventType: 'TaskInstanceProgressUpdated';
  payload: {
    oldProgress: number;
    newProgress: number;
    updatedAt: Date;
    note?: string;
  };
}

// =============== 任务提醒事件 ===============

/**
 * 任务提醒调度事件
 */
export interface TaskReminderScheduledEvent extends TaskInstanceEventBase {
  eventType: 'TaskReminderScheduled';
  payload: {
    reminderTime: Date;
    method: 'notification' | 'sound';
    minutesBefore: number;
  };
}

/**
 * 任务提醒触发事件
 */
export interface TaskReminderTriggeredEvent extends TaskInstanceEventBase {
  eventType: 'TaskReminderTriggered';
  payload: {
    triggeredAt: Date;
    method: 'notification' | 'sound';
    message?: string;
  };
}

/**
 * 任务提醒忽略事件
 */
export interface TaskReminderDismissedEvent extends TaskInstanceEventBase {
  eventType: 'TaskReminderDismissed';
  payload: {
    dismissedAt: Date;
    method: 'notification' | 'sound';
  };
}

/**
 * 任务提醒稍后提醒事件
 */
export interface TaskReminderSnoozedEvent extends TaskInstanceEventBase {
  eventType: 'TaskReminderSnoozed';
  payload: {
    snoozedAt: Date;
    snoozeUntil: Date;
    snoozeCount: number;
    method: 'notification' | 'sound';
  };
}

/**
 * 任务提醒取消事件
 */
export interface TaskReminderCancelledEvent extends TaskInstanceEventBase {
  eventType: 'TaskReminderCancelled';
  payload: {
    cancelledAt: Date;
    reason: 'task_completed' | 'task_cancelled' | 'task_rescheduled' | 'manual';
  };
}

// =============== 任务元模板事件 ===============

/**
 * 任务元模板创建事件
 */
export interface TaskMetaTemplateCreatedEvent extends TaskMetaTemplateEventBase {
  eventType: 'TaskMetaTemplateCreated';
  payload: {
    name: string;
    category: string;
  };
}

/**
 * 任务元模板更新事件
 */
export interface TaskMetaTemplateUpdatedEvent extends TaskMetaTemplateEventBase {
  eventType: 'TaskMetaTemplateUpdated';
  payload: {
    updatedFields: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  };
}

/**
 * 任务元模板使用事件
 */
export interface TaskMetaTemplateUsedEvent extends TaskMetaTemplateEventBase {
  eventType: 'TaskMetaTemplateUsed';
  payload: {
    usedAt: Date;
    createdTemplateUuid: string;
    previousUsageCount: number;
  };
}

/**
 * 任务元模板收藏事件
 */
export interface TaskMetaTemplateFavoritedEvent extends TaskMetaTemplateEventBase {
  eventType: 'TaskMetaTemplateFavorited';
  payload: {
    favoritedAt: Date;
    isFavorite: boolean;
  };
}

/**
 * 任务元模板激活状态变更事件
 */
export interface TaskMetaTemplateActivationChangedEvent extends TaskMetaTemplateEventBase {
  eventType: 'TaskMetaTemplateActivationChanged';
  payload: {
    isActive: boolean;
    changedAt: Date;
    reason?: string;
  };
}

// =============== 联合类型 ===============

/**
 * 所有任务模板事件
 */
export type TaskTemplateEvent =
  | TaskTemplateCreatedEvent
  | TaskTemplateUpdatedEvent
  | TaskTemplateActivatedEvent
  | TaskTemplatePausedEvent
  | TaskTemplateCompletedEvent
  | TaskTemplateArchivedEvent;

/**
 * 所有任务实例事件
 */
export type TaskInstanceEvent =
  | TaskInstanceCreatedEvent
  | TaskInstanceStartedEvent
  | TaskInstancePausedEvent
  | TaskInstanceResumedEvent
  | TaskInstanceCompletedEvent
  | TaskInstanceUndoCompletedEvent
  | TaskInstanceCancelledEvent
  | TaskInstanceRescheduledEvent
  | TaskInstanceOverdueEvent
  | TaskInstanceProgressUpdatedEvent;

/**
 * 所有任务提醒事件
 */
export type TaskReminderEvent =
  | TaskReminderScheduledEvent
  | TaskReminderTriggeredEvent
  | TaskReminderDismissedEvent
  | TaskReminderSnoozedEvent
  | TaskReminderCancelledEvent;

/**
 * 所有任务元模板事件
 */
export type TaskMetaTemplateEvent =
  | TaskMetaTemplateCreatedEvent
  | TaskMetaTemplateUpdatedEvent
  | TaskMetaTemplateUsedEvent
  | TaskMetaTemplateFavoritedEvent
  | TaskMetaTemplateActivationChangedEvent;

/**
 * 所有任务相关事件
 */
export type TaskEvent =
  | TaskTemplateEvent
  | TaskInstanceEvent
  | TaskReminderEvent
  | TaskMetaTemplateEvent;
