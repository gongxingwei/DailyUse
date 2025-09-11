/**
 * Schedule Module Types
 * @description 任务调度模块的核心类型定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

/**
 * 调度任务状态枚举
 */
export enum ScheduleStatus {
  /** 等待中 */
  PENDING = 'PENDING',
  /** 运行中 */
  RUNNING = 'RUNNING',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
  /** 失败 */
  FAILED = 'FAILED',
  /** 已暂停 */
  PAUSED = 'PAUSED',
}

/**
 * 调度任务优先级枚举
 */
export enum SchedulePriority {
  /** 低优先级 */
  LOW = 'LOW',
  /** 正常优先级 */
  NORMAL = 'NORMAL',
  /** 高优先级 */
  HIGH = 'HIGH',
  /** 紧急优先级 */
  URGENT = 'URGENT',
}

/**
 * 调度任务类型枚举
 */
export enum ScheduleTaskType {
  /** 任务提醒 */
  TASK_REMINDER = 'TASK_REMINDER',
  /** 目标提醒 */
  GOAL_REMINDER = 'GOAL_REMINDER',
  /** 通用提醒 */
  GENERAL_REMINDER = 'GENERAL_REMINDER',
  /** 系统维护 */
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  /** 数据备份 */
  DATA_BACKUP = 'DATA_BACKUP',
  /** 清理任务 */
  CLEANUP_TASK = 'CLEANUP_TASK',
}

/**
 * 重复规则类型枚举
 */
export enum RecurrenceType {
  /** 不重复 */
  NONE = 'NONE',
  /** 每天 */
  DAILY = 'DAILY',
  /** 每周 */
  WEEKLY = 'WEEKLY',
  /** 每月 */
  MONTHLY = 'MONTHLY',
  /** 每年 */
  YEARLY = 'YEARLY',
  /** 自定义 */
  CUSTOM = 'CUSTOM',
}

/**
 * 提醒方式枚举
 */
export enum AlertMethod {
  /** 弹窗通知 */
  POPUP = 'POPUP',
  /** 声音提醒 */
  SOUND = 'SOUND',
  /** 系统通知 */
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  /** 邮件提醒 */
  EMAIL = 'EMAIL',
  /** 短信提醒 */
  SMS = 'SMS',
  /** 桌面闪烁 */
  DESKTOP_FLASH = 'DESKTOP_FLASH',
}

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
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }[];
}

/**
 * 调度任务接口
 */
export interface IScheduleTask {
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
  /** 重复规则(可选) */
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
