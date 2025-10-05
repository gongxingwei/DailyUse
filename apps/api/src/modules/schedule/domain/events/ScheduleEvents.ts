import { DomainEvent } from '@dailyuse/domain-core';

/**
 * 任务触发事件
 * 当 Schedule 任务时间到达时发布此事件
 */
export class TaskTriggeredEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'schedule.task.triggered';

  constructor(
    taskUuid: string,
    public readonly sourceType: string, // 'reminder', 'task', 'goal' 等
    public readonly sourceId: string, // 源对象的 UUID
    public readonly accountUuid: string,
    public readonly payload: Record<string, any>,
  ) {
    super(taskUuid, TaskTriggeredEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      taskUuid: this.aggregateId,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}
