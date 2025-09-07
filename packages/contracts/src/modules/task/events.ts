/**
 * 任务完成事件
 */
export interface TaskCompletedEvent {
  eventType: 'TaskCompleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    taskId: string;
    keyResultLinks?: Array<{
      goalUuid: string;
      keyResultId: string;
      incrementValue: number;
    }>;
    completedAt: Date;
  };
}

/**
 * 任务取消完成事件
 */
export interface TaskUndoCompletedEvent {
  eventType: 'TaskUndoCompleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    taskId: string;
    keyResultLinks?: Array<{
      goalUuid: string;
      keyResultId: string;
      incrementValue: number;
    }>;
    undoAt: Date;
  };
}

/**
 * 任务创建事件
 */
export interface TaskCreatedEvent {
  eventType: 'TaskCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    taskId: string;
    templateUuid: string;
    title: string;
    scheduledTime: Date;
  };
}

/**
 * 任务重新调度事件
 */
export interface TaskRescheduledEvent {
  eventType: 'TaskRescheduled';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    taskId: string;
    oldScheduledTime: Date;
    newScheduledTime: Date;
    reason?: string;
  };
}

/**
 * 任务提醒触发事件
 */
export interface TaskReminderTriggeredEvent {
  eventType: 'TaskReminderTriggered';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    taskId: string;
    alertId: string;
    reminderType: 'notification' | 'email' | 'sound';
    message?: string;
  };
}
