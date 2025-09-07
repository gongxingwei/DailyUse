/**
 * 目标创建事件
 */
export interface GoalCreatedEvent {
  eventType: 'GoalCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    goalId: string;
    name: string;
    startTime: Date;
    endTime: Date;
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
    accountUuid: string;
    goalId: string;
    completedAt: Date;
    finalProgress: number;
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
  };
}

/**
 * 目标复盘添加事件
 */
export interface GoalReviewAddedEvent {
  eventType: 'GoalReviewAdded';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    goalId: string;
    reviewId: string;
    rating: number;
    reviewDate: Date;
  };
}
