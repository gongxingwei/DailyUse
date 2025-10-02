// ============ 目标领域事件 ============

/**
 * 目标创建事件
 */
export interface GoalCreatedEvent {
  eventType: 'GoalCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    name: string;
    startTime: Date;
    endTime: Date;
    dirUuid?: string;
  };
}

/**
 * 目标更新事件
 */
export interface GoalUpdatedEvent {
  eventType: 'GoalUpdated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    changes: {
      name?: string;
      description?: string;
      color?: string;
      dirUuid?: string;
      startTime?: Date;
      endTime?: Date;
      note?: string;
    };
  };
}

/**
 * 目标状态变更事件
 */
export interface GoalStatusChangedEvent {
  eventType: 'GoalStatusChanged';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    oldStatus: 'active' | 'completed' | 'paused' | 'archived';
    newStatus: 'active' | 'completed' | 'paused' | 'archived';
  };
}

/**
 * 目标完成事件
 */
export interface GoalCompletedEvent {
  eventType: 'GoalCompleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    completedAt: Date;
    finalProgress: number;
    keyResultsCompleted: number;
    totalKeyResults: number;
  };
}

/**
 * 目标删除事件
 */
export interface GoalDeletedEvent {
  eventType: 'GoalDeleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    name: string;
  };
}

// ============ 关键结果事件 ============

/**
 * 关键结果创建事件
 */
export interface KeyResultCreatedEvent {
  eventType: 'KeyResultCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    keyResultId: string;
    name: string;
    targetValue: number;
    weight: number;
  };
}

/**
 * 关键结果进度更新事件
 */
export interface KeyResultProgressUpdatedEvent {
  eventType: 'KeyResultProgressUpdated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    keyResultId: string;
    oldValue: number;
    newValue: number;
    increment: number;
    triggeredByTask?: boolean;
    taskId?: string;
  };
}

/**
 * 关键结果完成事件
 */
export interface KeyResultCompletedEvent {
  eventType: 'KeyResultCompleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    keyResultId: string;
    name: string;
    finalValue: number;
    targetValue: number;
    completedAt: Date;
  };
}

// ============ 目标记录事件 ============

/**
 * 目标记录添加事件
 */
export interface GoalRecordAddedEvent {
  eventType: 'GoalRecordAdded';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    keyResultId: string;
    recordId: string;
    value: number;
    recordDate: Date;
    note?: string;
  };
}

// ============ 目标复盘事件 ============

/**
 * 目标复盘创建事件
 */
export interface GoalReviewCreatedEvent {
  eventType: 'GoalReviewCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    reviewId: string;
    title: string;
    type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
    reviewDate: Date;
    rating: {
      progressSatisfaction: number;
      executionEfficiency: number;
      goalReasonableness: number;
    };
  };
}

// ============ 目标目录事件 ============

/**
 * 目标目录创建事件
 */
export interface GoalDirCreatedEvent {
  eventType: 'GoalDirCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalDirId: string;
    name: string;
    parentUuid?: string;
  };
}

/**
 * 目标目录更新事件
 */
export interface GoalDirUpdatedEvent {
  eventType: 'GoalDirUpdated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalDirId: string;
    changes: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      parentUuid?: string;
    };
  };
}

/**
 * 目标目录删除事件
 */
export interface GoalDirDeletedEvent {
  eventType: 'GoalDirDeleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalDirId: string;
    name: string;
  };
}

/**
 * 目标移动到目录事件
 */
export interface GoalMovedToDirEvent {
  eventType: 'GoalMovedToDir';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    oldDirUuid?: string;
    newDirUuid?: string;
  };
}

// ============ 联合类型 ============

/**
 * 所有目标相关事件的联合类型
 */
export type GoalDomainEvent =
  | GoalCreatedEvent
  | GoalUpdatedEvent
  | GoalStatusChangedEvent
  | GoalCompletedEvent
  | GoalDeletedEvent
  | KeyResultCreatedEvent
  | KeyResultProgressUpdatedEvent
  | KeyResultCompletedEvent
  | GoalRecordAddedEvent
  | GoalReviewCreatedEvent
  | GoalDirCreatedEvent
  | GoalDirUpdatedEvent
  | GoalDirDeletedEvent
  | GoalMovedToDirEvent;
