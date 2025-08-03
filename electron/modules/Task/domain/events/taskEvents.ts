import type { DomainEvent } from "@common/shared/domain/domainEvent";
import type { KeyResultLink } from "@common/modules/task/types/task";
export interface TaskCompletedEventPayload {
  accountUuid: string;
  taskId: string;
  keyResultLinks: KeyResultLink[];
  completedAt: Date;
}

export interface TaskUndoCompletedEventPayload {
  accountUuid: string;
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