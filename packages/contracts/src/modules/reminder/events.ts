/**
 * 提醒触发事件
 */
export interface ReminderTriggeredEvent {
  eventType: 'ReminderTriggered';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    reminderInstanceId: string;
    templateId: string;
    message: string;
    priority: string;
    scheduledTime: Date;
    triggeredTime: Date;
  };
}

/**
 * 提醒确认事件
 */
export interface ReminderAcknowledgedEvent {
  eventType: 'ReminderAcknowledged';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    reminderInstanceId: string;
    templateId: string;
    acknowledgedTime: Date;
    responseTime: number; // in milliseconds
  };
}

/**
 * 提醒忽略事件
 */
export interface ReminderDismissedEvent {
  eventType: 'ReminderDismissed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    reminderInstanceId: string;
    templateId: string;
    dismissedTime: Date;
    reason?: string;
  };
}

/**
 * 提醒稍后提醒事件
 */
export interface ReminderSnoozedEvent {
  eventType: 'ReminderSnoozed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    reminderInstanceId: string;
    templateId: string;
    snoozedAt: Date;
    snoozeUntil: Date;
    reason?: string;
    snoozeCount: number;
  };
}

/**
 * 提醒模板创建事件
 */
export interface ReminderTemplateCreatedEvent {
  eventType: 'ReminderTemplateCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    name: string;
    groupId?: string;
    category: string;
    priority: string;
  };
}

/**
 * 提醒模板状态变更事件
 */
export interface ReminderTemplateStatusChangedEvent {
  eventType: 'ReminderTemplateStatusChanged';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    oldStatus: boolean;
    newStatus: boolean;
    changedBy: string;
  };
}

/**
 * 提醒调度事件
 */
export interface ReminderScheduledEvent {
  eventType: 'ReminderScheduled';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    reminderInstanceId: string;
    templateId: string;
    scheduledTime: Date;
    message: string;
    priority: string;
  };
}
