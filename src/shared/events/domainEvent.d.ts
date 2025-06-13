import { KeyResultLink } from '@/modules/Task/types/task';

export interface DomainEvent {
    eventType: string;
    aggregateId: string;
    occurredOn: Date;
    data: any;
  }
  
  export interface TaskCompletedEvent extends DomainEvent {
    eventType: 'TaskCompleted';
    data: {
      taskId: string;
      keyResultLinks: KeyResultLink[];
      completedAt: Date;
    };
  }
  
  export interface TaskUndoCompletedEvent extends DomainEvent {
    eventType: 'TaskUndoCompleted';
    data: {
      taskId: string;
      keyResultLinks: KeyResultLink[];
      undoAt: Date;
    };
  }