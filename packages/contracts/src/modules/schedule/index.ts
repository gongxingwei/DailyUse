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

// 类型简化别名
export type {
  IScheduleTask as ScheduleTask,
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
