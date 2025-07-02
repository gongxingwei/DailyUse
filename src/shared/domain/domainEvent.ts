import type { KeyResultLink } from '@/modules/Task/domain/types/task';

export interface DomainEvent<T = any> {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  payload: T;
}

export abstract class BaseDomainEvent<T = any> implements DomainEvent<T> {
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: T
  ) {
    this.occurredOn = new Date();
  }
}

// 具体事件接口
export interface TaskCompletedEventPayload {
  taskId: string;
  keyResultLinks: KeyResultLink[];
  completedAt: Date;
}

export interface TaskUndoCompletedEventPayload {
  taskId: string;
  keyResultLinks: KeyResultLink[];
  undoAt: Date;
}

export interface TaskCompletedEvent extends DomainEvent<TaskCompletedEventPayload> {
  eventType: 'TaskCompleted';
  payload: TaskCompletedEventPayload;
}

export interface TaskUndoCompletedEvent extends DomainEvent<TaskUndoCompletedEventPayload> {
  eventType: 'TaskUndoCompleted';
  payload: TaskUndoCompletedEventPayload;
}