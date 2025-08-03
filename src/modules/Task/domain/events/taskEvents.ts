import type { DomainEvent } from "@common/shared/domain/domainEvent";
import type { KeyResultLink } from '@common/modules/task/types/task';
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
/**
 * 渲染进程
 * 任务完成事件
 * 用于在状态管理工具中更新数据/或者拿来触发重新获取数据？
 */
export interface TaskCompletedEvent extends DomainEvent<TaskCompletedEventPayload> {
  eventType: 'TaskCompleted';
  payload: TaskCompletedEventPayload;
}

/**
 * 渲染进程
 * 任务取消完成事件
 * 用于在状态管理工具中更新数据/或者拿来触发重新获取数据？
 */
export interface TaskUndoCompletedEvent extends DomainEvent<TaskUndoCompletedEventPayload> {
  eventType: 'TaskUndoCompleted';
  payload: TaskUndoCompletedEventPayload;
}