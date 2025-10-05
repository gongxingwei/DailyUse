import { DomainEvent } from '@dailyuse/domain-core';

/**
 * Reminder 实例创建事件
 * 当创建新的提醒实例时发布此事件
 */
export class ReminderInstanceCreatedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'reminder.instance.created';

  constructor(
    instanceUuid: string,
    public readonly templateUuid: string,
    public readonly accountUuid: string,
    public readonly scheduledTime: Date,
    public readonly title: string,
    public readonly message: string,
    public readonly priority: string,
    public readonly category: string,
    public readonly metadata: Record<string, any> = {},
  ) {
    super(instanceUuid, ReminderInstanceCreatedEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      instanceUuid: this.aggregateId,
      templateUuid: this.templateUuid,
      accountUuid: this.accountUuid,
      scheduledTime: this.scheduledTime.toISOString(),
      title: this.title,
      message: this.message,
      priority: this.priority,
      category: this.category,
      metadata: this.metadata,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * Reminder 实例触发事件
 * 当提醒时间到达，需要触发通知时发布此事件
 */
export class ReminderInstanceTriggeredEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'reminder.instance.triggered';

  constructor(
    instanceUuid: string,
    public readonly templateUuid: string,
    public readonly accountUuid: string,
    public readonly title: string,
    public readonly message: string,
    public readonly priority: string,
    public readonly scheduledTime: Date,
    public readonly metadata: Record<string, any> = {},
  ) {
    super(instanceUuid, ReminderInstanceTriggeredEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      instanceUuid: this.aggregateId,
      templateUuid: this.templateUuid,
      accountUuid: this.accountUuid,
      title: this.title,
      message: this.message,
      priority: this.priority,
      scheduledTime: this.scheduledTime.toISOString(),
      metadata: this.metadata,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}
