/**
 * Schedule Module Types
 * @description 任务调度模块的核心类型定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

import {
  AlertActionStyle,
  AlertMethod,
  RecurrenceType,
  SchedulePriority,
  ScheduleStatus,
  ScheduleTaskType,
} from './enums';

/**
 * 重复规则接口
 */
export interface IRecurrenceRule {
  /** 重复类型 */
  type: RecurrenceType;
  /** 间隔 */
  interval: number;
  /** 结束日期(可选) */
  endDate?: Date;
  /** 最大执行次数(可选) */
  maxOccurrences?: number;
  /** 星期几(仅周重复时) */
  daysOfWeek?: number[];
  /** 月份中的天数(仅月重复时) */
  dayOfMonth?: number;
  /** Cron表达式(自定义重复时) */
  cronExpression?: string;
}

/**
 * 任务载荷接口 - 泛型设计支持不同类型的任务
 */
export interface IScheduleTaskPayload<T = any> {
  /** 任务类型 */
  type: ScheduleTaskType;
  /** 载荷数据 */
  data: T;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 提醒配置接口
 */
export interface IAlertConfig {
  /** 提醒方式 */
  methods: AlertMethod[];
  /** 声音文件路径(可选) */
  soundFile?: string;
  /** 声音音量(0-100) */
  soundVolume?: number;
  /** 弹窗持续时间(秒) */
  popupDuration?: number;
  /** 是否可延后 */
  allowSnooze?: boolean;
  /** 延后选项(分钟) */
  snoozeOptions?: number[];
  /** 自定义操作按钮 */
  customActions?: {
    label: string;
    action: string;
    style?: AlertActionStyle;
  }[];
}

/**
 * 调度任务基本信息
 */
export interface IScheduleTaskBasic {
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType: ScheduleTaskType;
  /** 任务载荷 */
  payload: IScheduleTaskPayload;
  /** 创建者 */
  createdBy: string;
}

/**
 * 调度任务调度信息
 */
export interface IScheduleTaskScheduling {
  /** 计划执行时间 */
  scheduledTime: Date;
  /** 重复规则(可选) */
  recurrence?: IRecurrenceRule;
  /** 优先级 */
  priority: SchedulePriority;
  /** 状态 */
  status: ScheduleStatus;
  /** 下次执行时间 */
  nextExecutionTime?: Date;
}

/**
 * 调度任务执行信息
 */
export interface IScheduleTaskExecution {
  /** 执行次数 */
  executionCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 当前重试次数 */
  currentRetries: number;
  /** 超时时间(秒) */
  timeoutSeconds?: number;
}

/**
 * 调度任务生命周期信息
 */
export interface IScheduleTaskLifecycle {
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 调度任务元数据
 */
export interface IScheduleTaskMetadata {
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled: boolean;
  /** 版本号 */
  version?: number;
}

/**
 * 调度任务接口 - 层级结构
 */
export interface IScheduleTask {
  /** 唯一标识 */
  uuid: string;

  /** 基本信息 */
  basic: IScheduleTaskBasic;

  /** 调度信息 */
  scheduling: IScheduleTaskScheduling;

  /** 执行信息 */
  execution: IScheduleTaskExecution;

  /** 提醒配置 */
  alertConfig: IAlertConfig;

  /** 生命周期信息 */
  lifecycle: IScheduleTaskLifecycle;

  /** 元数据 */
  metadata: IScheduleTaskMetadata;
}

/**
 * 调度任务执行结果接口
 */
export interface IScheduleExecutionResult {
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
 * 调度任务查询参数接口
 */
export interface IScheduleTaskQuery {
  /** 任务类型 */
  taskType?: ScheduleTaskType[];
  /** 状态 */
  status?: ScheduleStatus[];
  /** 优先级 */
  priority?: SchedulePriority[];
  /** 创建者 */
  createdBy?: string;
  /** 时间范围 */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled?: boolean;
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
  /** 排序 */
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * 调度任务统计接口
 */
export interface IScheduleTaskStatistics {
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

// ========================= API 请求响应类型 =========================

/**
 * 创建调度任务请求
 */
export interface CreateScheduleTaskRequest {
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType: string;
  /** Cron表达式 */
  cronExpression: string;
  /** 任务载荷 */
  payload?: any;
  /** 优先级 */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 状态 */
  status?: 'ACTIVE' | 'PAUSED';
  /** 配置 */
  config?: any;
  /** 元数据 */
  metadata?: any;
}

/**
 * 更新调度任务请求
 */
export interface UpdateScheduleTaskRequest {
  /** 任务名称 */
  name?: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType?: string;
  /** Cron表达式 */
  cronExpression?: string;
  /** 任务载荷 */
  payload?: any;
  /** 优先级 */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 状态 */
  status?: 'ACTIVE' | 'PAUSED';
  /** 配置 */
  config?: any;
  /** 元数据 */
  metadata?: any;
}

/**
 * 调度任务响应 (简化版本，适配前端显示)
 */
export interface ScheduleTask {
  /** 任务ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  taskType: string;
  /** Cron表达式 */
  cronExpression: string;
  /** 状态 */
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  /** 任务载荷 */
  payload?: any;
  /** 优先级 */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 下次执行时间 */
  nextExecutionTime?: string;
  /** 配置 */
  config?: any;
  /** 元数据 */
  metadata?: any;
}

/**
 * 调度执行记录
 */
export interface ScheduleExecution {
  /** 执行记录ID */
  id: string;
  /** 任务ID */
  taskId: string;
  /** 任务名称 */
  taskName: string;
  /** 任务类型 */
  taskType: string;
  /** 执行状态 */
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'CANCELLED';
  /** 执行时间 */
  executedAt: string;
  /** 执行结果 */
  result?: any;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 */
  duration?: number;
}

/**
 * SSE连接信息
 */
export interface SSEConnectionInfo {
  /** SSE连接URL */
  url: string;
  /** 连接令牌 */
  token?: string;
  /** 连接ID */
  connectionId?: string;
}

/**
 * 调度任务列表响应
 */
export interface ScheduleTaskListResponse {
  /** 任务列表 */
  tasks: ScheduleTask[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页限制 */
  limit: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 调度执行记录列表响应
 */
export interface ScheduleExecutionListResponse {
  /** 执行记录列表 */
  executions: ScheduleExecution[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页限制 */
  limit: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 调度任务统计响应
 */
export interface ScheduleStatisticsResponse {
  /** 总任务数 */
  totalTasks: number;
  /** 活跃任务数 */
  activeTasks: number;
  /** 暂停任务数 */
  pausedTasks: number;
  /** 今日执行次数 */
  todayExecutions: number;
  /** 成功执行次数 */
  successExecutions: number;
  /** 失败执行次数 */
  failedExecutions: number;
  /** 按类型统计 */
  byType?: Record<string, number>;
  /** 按状态统计 */
  byStatus?: Record<string, number>;
}

/**
 * 单个调度任务响应
 */
export interface ScheduleTaskResponse {
  /** 调度任务 */
  task: ScheduleTask;
}

/**
 * 调度任务操作响应
 */
export interface ScheduleTaskActionResponse {
  /** 操作成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 任务信息 */
  task?: ScheduleTask;
}
