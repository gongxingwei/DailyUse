/**
 * Schedule Module DTOs
 * @description 任务调度模块的数据传输对象定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

import type {
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
  RecurrenceType,
  AlertMethod,
  IRecurrenceRule,
  IAlertConfig,
  IScheduleTaskPayload,
} from './types';

/**
 * 创建调度任务请求DTO
 */
export interface CreateScheduleTaskRequestDto {
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType: ScheduleTaskType;
  /** 任务载荷 */
  payload: IScheduleTaskPayload;
  /** 计划执行时间 */
  scheduledTime: Date;
  /** 重复规则(可选) */
  recurrence?: IRecurrenceRule;
  /** 优先级 */
  priority: SchedulePriority;
  /** 提醒配置 */
  alertConfig: IAlertConfig;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 超时时间(秒) */
  timeoutSeconds?: number;
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 更新调度任务请求DTO
 */
export interface UpdateScheduleTaskRequestDto {
  /** 任务名称 */
  name?: string;
  /** 任务描述 */
  description?: string;
  /** 计划执行时间 */
  scheduledTime?: Date;
  /** 重复规则 */
  recurrence?: IRecurrenceRule;
  /** 优先级 */
  priority?: SchedulePriority;
  /** 状态 */
  status?: ScheduleStatus;
  /** 提醒配置 */
  alertConfig?: IAlertConfig;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 超时时间(秒) */
  timeoutSeconds?: number;
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 调度任务响应DTO
 */
export interface ScheduleTaskResponseDto {
  /** 唯一标识 */
  uuid: string;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType: ScheduleTaskType;
  /** 任务载荷 */
  payload: IScheduleTaskPayload;
  /** 计划执行时间 */
  scheduledTime: Date;
  /** 重复规则 */
  recurrence?: IRecurrenceRule;
  /** 优先级 */
  priority: SchedulePriority;
  /** 状态 */
  status: ScheduleStatus;
  /** 提醒配置 */
  alertConfig: IAlertConfig;
  /** 创建者 */
  createdBy: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 下次执行时间 */
  nextExecutionTime?: Date;
  /** 执行次数 */
  executionCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 当前重试次数 */
  currentRetries: number;
  /** 超时时间(秒) */
  timeoutSeconds?: number;
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 调度任务列表响应DTO
 */
export interface ScheduleTaskListResponseDto {
  /** 任务列表 */
  tasks: ScheduleTaskResponseDto[];
  /** 总数 */
  total: number;
  /** 分页信息 */
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 执行调度任务请求DTO
 */
export interface ExecuteScheduleTaskRequestDto {
  /** 任务UUID */
  taskUuid: string;
  /** 是否强制执行(忽略状态检查) */
  force?: boolean;
  /** 执行参数覆盖 */
  overrides?: {
    priority?: SchedulePriority;
    timeoutSeconds?: number;
  };
}

/**
 * 调度任务执行结果响应DTO
 */
export interface ScheduleExecutionResultResponseDto {
  /** 任务UUID */
  taskUuid: string;
  /** 执行时间 */
  executedAt: Date;
  /** 执行状态 */
  status: ScheduleStatus;
  /** 执行结果 */
  result?: any;
  /** 错误信息 */
  error?: string;
  /** 执行耗时(毫秒) */
  duration: number;
  /** 下次执行时间 */
  nextExecutionTime?: Date;
}

/**
 * 调度任务统计响应DTO
 */
export interface ScheduleTaskStatisticsResponseDto {
  /** 总任务数 */
  totalTasks: number;
  /** 活跃任务数 */
  activeTasks: number;
  /** 已完成任务数 */
  completedTasks: number;
  /** 失败任务数 */
  failedTasks: number;
  /** 按状态统计 */
  byStatus: Record<ScheduleStatus, number>;
  /** 按类型统计 */
  byType: Record<ScheduleTaskType, number>;
  /** 按优先级统计 */
  byPriority: Record<SchedulePriority, number>;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 成功率 */
  successRate: number;
}

/**
 * 批量操作请求DTO
 */
export interface BatchScheduleTaskOperationRequestDto {
  /** 任务UUID列表 */
  taskUuids: string[];
  /** 操作类型 */
  operation: 'enable' | 'disable' | 'cancel' | 'delete' | 'pause' | 'resume';
}

/**
 * 批量操作响应DTO
 */
export interface BatchScheduleTaskOperationResponseDto {
  /** 成功的任务UUID */
  success: string[];
  /** 失败的任务UUID和错误信息 */
  failed: Array<{
    taskUuid: string;
    error: string;
  }>;
  /** 操作统计 */
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

/**
 * 快速创建提醒任务请求DTO
 */
export interface QuickReminderRequestDto {
  /** 提醒标题 */
  title: string;
  /** 提醒内容 */
  message: string;
  /** 提醒时间 */
  reminderTime: Date;
  /** 提醒方式 */
  methods?: AlertMethod[];
  /** 优先级 */
  priority?: SchedulePriority;
  /** 是否允许延后 */
  allowSnooze?: boolean;
  /** 标签 */
  tags?: string[];
}

/**
 * 延后提醒请求DTO
 */
export interface SnoozeReminderRequestDto {
  /** 任务UUID */
  taskUuid: string;
  /** 延后时间(分钟) */
  snoozeMinutes: number;
  /** 延后原因 */
  reason?: string;
}

/**
 * 调度任务日志响应DTO
 */
export interface ScheduleTaskLogResponseDto {
  /** 日志ID */
  id: string;
  /** 任务UUID */
  taskUuid: string;
  /** 执行时间 */
  executedAt: Date;
  /** 状态 */
  status: ScheduleStatus;
  /** 执行结果 */
  result?: any;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 */
  duration: number;
  /** 重试次数 */
  retryCount: number;
}

/**
 * 即将到来的任务响应DTO
 */
export interface UpcomingTasksResponseDto {
  /** 即将执行的任务 */
  tasks: Array<{
    uuid: string;
    name: string;
    taskType: ScheduleTaskType;
    scheduledTime: Date;
    priority: SchedulePriority;
    alertConfig: IAlertConfig;
    minutesUntil: number;
  }>;
  /** 时间范围(小时) */
  withinHours: number;
  /** 查询时间 */
  queryTime: Date;
}
