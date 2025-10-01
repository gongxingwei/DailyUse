/**
 * Schedule Module Exports
 * @description 统一导出调度模块的所有类型定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

// Types
export * from './types';

// DTOs
export * from './dtos';

// Events
export * from './events';

// Enums
export * from './enums';

// Persistence DTOs
export * from './persistence-dtos';

// 类型简化别名
export type {
  IScheduleTask as ScheduleTask,
  IScheduleTaskBasic as ScheduleTaskBasic,
  IScheduleTaskScheduling as ScheduleTaskScheduling,
  IScheduleTaskExecution as ScheduleTaskExecution,
  IScheduleTaskLifecycle as ScheduleTaskLifecycle,
  IScheduleTaskMetadata as ScheduleTaskMetadata,
  IScheduleTaskPayload as ScheduleTaskPayload,
  IRecurrenceRule as RecurrenceRule,
  IAlertConfig as AlertConfig,
  IScheduleExecutionResult as ScheduleExecutionResult,
  IScheduleTaskQuery as ScheduleTaskQuery,
  IScheduleTaskStatistics as ScheduleTaskStatistics,
} from './types';

export type {
  CreateScheduleTaskRequestDto as CreateScheduleTaskRequest,
  UpdateScheduleTaskRequestDto as UpdateScheduleTaskRequest,
  ScheduleTaskResponseDto as ScheduleTaskResponse,
  ScheduleTaskListResponseDto as ScheduleTaskListResponse,
  QuickReminderRequestDto as QuickReminderRequest,
  SnoozeReminderRequestDto as SnoozeReminderRequest,
  UpcomingTasksResponseDto as UpcomingTasksResponse,
} from './dtos';

// 额外的API类型 (从types.ts导出)
export type {
  CreateScheduleTaskRequest as CreateScheduleTaskRequestApi,
  UpdateScheduleTaskRequest as UpdateScheduleTaskRequestApi,
  ScheduleTask as ScheduleTaskApi,
  ScheduleExecution as ScheduleExecutionApi,
  SSEConnectionInfo,
  ScheduleTaskListResponse as ScheduleTaskListResponseApi,
  ScheduleExecutionListResponse,
  ScheduleStatisticsResponse,
  ScheduleTaskResponse as ScheduleTaskResponseApi,
  ScheduleTaskActionResponse,
} from './types';
