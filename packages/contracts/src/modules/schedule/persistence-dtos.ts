/**
 * Schedule 模块持久化 DTO 定义
 */

import {
  AlertMethod,
  RecurrenceType,
  SchedulePriority,
  ScheduleStatus,
  ScheduleTaskType,
} from './enums';

/**
 * 调度任务持久化结构
 */
export interface ScheduleTaskPersistenceDTO {
  uuid: string;
  name: string;
  description?: string;
  taskType: ScheduleTaskType;
  payload: string; // JSON string of IScheduleTaskPayload
  priority: SchedulePriority;
  status: ScheduleStatus;
  scheduledTime: Date;
  nextExecutionTime?: Date;
  recurrence?: string; // JSON string of IRecurrenceRule
  createdBy: string;
  executionCount: number;
  maxRetries: number;
  currentRetries: number;
  timeoutSeconds?: number;
  alertConfig: string; // JSON string of IAlertConfig
  tags?: string[];
  metadata?: string; // JSON string of IScheduleTaskMetadata
  enabled: number; // 0 or 1
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 调度任务执行记录持久化结构
 */
export interface ScheduleExecutionPersistenceDTO {
  uuid: string;
  taskUuid: string;
  executedAt: Date;
  status: ScheduleStatus;
  result?: string; // JSON string
  error?: string;
  duration: number;
  nextExecutionTime?: Date;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
}

/**
 * 调度提醒配置持久化结构
 */
export interface ScheduleAlertConfigPersistenceDTO {
  taskUuid: string;
  methods: AlertMethod[];
  soundFile?: string;
  soundVolume?: number;
  popupDuration?: number;
  allowSnooze?: number; // 0 or 1
  snoozeOptions?: number[];
  customActions?: string; // JSON string of custom actions
  updatedAt: Date;
}

/**
 * 调度重复规则持久化结构
 */
export interface ScheduleRecurrenceRulePersistenceDTO {
  taskUuid: string;
  type: RecurrenceType;
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
  daysOfWeek?: string; // JSON array
  dayOfMonth?: number;
  cronExpression?: string;
  metadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 调度任务统计持久化结构
 */
export interface ScheduleStatisticsPersistenceDTO {
  uuid: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  byStatus: string; // JSON string keyed by ScheduleStatus
  byType: string; // JSON string keyed by ScheduleTaskType
  byPriority: string; // JSON string keyed by SchedulePriority
  averageExecutionTime: number;
  successRate: number;
  calculatedAt: Date;
}

/**
 * 调度批量操作记录持久化结构
 */
export interface ScheduleBatchOperationLogPersistenceDTO {
  uuid: string;
  operatorId: string;
  operation: string; // ScheduleBatchOperationType stored as string
  taskUuids: string[];
  resultSummary: string; // JSON string summarizing success/failure
  createdAt: Date;
}
