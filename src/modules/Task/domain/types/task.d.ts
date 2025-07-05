import type { DateTime, TimePoint, TimeRange } from "@/shared/types/myDateTime";

/**
 * 关键结果关联
 * 定义任务与目标关键结果的关联关系
 */
export type KeyResultLink = {
  /** 目标ID */
  goalId: string;
  /** 关键结果ID */
  keyResultId: string;
  /** 完成任务时增加的值 */
  incrementValue: number;
};

/**
 * 任务提醒配置
 * 定义任务的提醒规则和设置
 */
export type TaskReminderConfig = {
  /** 是否启用提醒 */
  enabled: boolean;
  /** 多个提醒时间点 */
  alerts: Array<{
    /** 提醒ID */
    id: string;
    /** 提醒时间设置 */
    timing: {
      /** 提醒时间类型 */
      type: "relative" | "absolute";
      /** 相对时间：提前时间 (分钟) */
      minutesBefore?: number;
      /** 绝对时间：具体时间点 */
      absoluteTime?: DateTime;
    };
    /** 提醒类型 */
    type: "notification" | "email" | "sound";
    /** 自定义消息 */
    message?: string;
  }>;
  /** 稍后提醒设置 */
  snooze: {
    /** 是否启用稍后提醒 */
    enabled: boolean;
    /** 稍后提醒间隔 (分钟) */
    interval: number;
    /** 最大重复次数 */
    maxCount: number;
  };
};

/**
 * 提醒项类型
 * 从TaskReminderConfig中提取单个提醒项的类型
 */
export type ReminderAlert = TaskReminderConfig['alerts'][number];

/**
 * 提醒时机配置类型
 * 从ReminderAlert中提取时机配置的类型
 */
export type ReminderTiming = ReminderAlert['timing'];

/**
 * 任务时间配置
 * 定义任务的时间规则和重复模式
 */
export type TaskTimeConfig = {
  /** 任务类型 */
  type: "allDay" | "timed" | "timeRange";
  /** 基础时间信息 */
  baseTime: {
    /** 开始时间 */
    start: DateTime;
    /** 结束时间 (可选) */
    end?: DateTime;
    /** 持续时间 (分钟，用于验证) */
    duration?: number;
  };
  /** 重复规则 */
  recurrence: RecurrenceRule;
  /** 时区信息 */
  timezone: string;
  /** 夏令时处理 */
  dstHandling?: "auto" | "ignore";
};

/**
 * 任务模板接口
 * 定义可重复使用的任务模板结构
 */
export interface ITaskTemplate {
  /** 任务模板ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 时间配置 */
  timeConfig: TaskTimeConfig;
  /** 提醒配置 */
  reminderConfig: TaskReminderConfig;
  /** 调度策略 */
  schedulingPolicy: {
    allowReschedule: boolean;
    maxDelayDays: number;
    skipWeekends: boolean;
    skipHolidays: boolean;
    workingHoursOnly: boolean;
  };
  /** 元数据 */
  metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    priority?: 1 | 2 | 3 | 4 | 5;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    location?: string;
  };
  /** 生命周期 */
  lifecycle: {
    status: "draft" | "active" | "paused" | "archived";
    createdAt: DateTime;
    updatedAt: DateTime;
    activatedAt?: DateTime;
    pausedAt?: DateTime;
  };
  /** 统计数据 */
  analytics: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime?: number;
    successRate: number;
    lastInstanceDate?: DateTime;
  };
  /** 关联的关键结果 */
  keyResultLinks?: KeyResultLink[];
  /** 版本号 */
  version: number;
}

/**
 * 任务实例中的提醒状态
 * 记录任务实例的提醒执行状态
 */
export type TaskInstanceReminderStatus = {
  /** 是否启用提醒 */
  enabled: boolean;
  /** 提醒项状态列表 */
  alerts: Array<{
    /** 提醒ID */
    id: string;
    /** 提醒配置 */
    alertConfig: TaskReminderConfig['alerts'][number];
    /** 提醒状态 */
    status: "pending" | "triggered" | "dismissed" | "snoozed";
    /** 计划触发时间 */
    scheduledTime: DateTime;
    /** 实际触发时间 */
    triggeredAt?: DateTime;
    /** 忽略时间 */
    dismissedAt?: DateTime;
    /** 稍后提醒历史 */
    snoozeHistory: Array<{
      snoozedAt: DateTime;
      snoozeUntil: DateTime;
      reason?: string;
    }>;
  }>;
  /** 全局稍后提醒计数 */
  globalSnoozeCount: number;
  /** 最后触发时间 */
  lastTriggeredAt?: DateTime;
};

/**
 * 任务实例生命周期事件
 * 记录任务实例的重要事件和状态变更
 */
export type TaskInstanceLifecycleEvent = {
  type: "reminder_scheduled" | "reminder_triggered" | "reminder_dismissed" | "reminder_snoozed" | "reminder_cancelled" | "task_started" | "task_completed" | "task_undo" | "task_cancelled" | "task_rescheduled" | "task_overdue" | "task_title_updated";
  timestamp: DateTime;
  alertId?: string;
  details?: Record<string, any>;
};

/**
 * 任务实例时间配置
 * 专注于具体执行的简化时间配置
 */
export type TaskInstanceTimeConfig = {
  /** 任务类型 */
  type: "allDay" | "timed" | "timeRange";
  /** 计划执行时间 */
  scheduledTime: DateTime;
  /** 结束时间 (timeRange类型时必需) */
  endTime?: DateTime;
  /** 预估持续时间 (分钟) */
  estimatedDuration?: number;
  /** 时区信息 */
  timezone: string;
  /** 是否可重新调度 */
  allowReschedule: boolean;
  /** 最大延期天数 */
  maxDelayDays?: number;
};

/**
 * 任务实例接口
 * 定义具体执行的任务实例结构
 */
export interface ITaskInstance {
  /** 任务实例ID */
  id: string;
  /** 关联的任务模板ID */
  templateId: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 时间配置 */
  timeConfig: TaskInstanceTimeConfig;
  /** 实际开始时间 */
  actualStartTime?: DateTime;
  /** 实际结束时间 */
  actualEndTime?: DateTime;
  /** 任务关联的关键结果 */
  keyResultLinks?: KeyResultLink[];
  /** 任务优先级 */
  priority: 1 | 2 | 3 | 4 | 5;
  /** 任务状态 */
  status: "pending" | "inProgress" | "completed" | "cancelled" | "overdue";
  /** 完成时间 */
  completedAt?: DateTime;
  /** 提醒状态 */
  reminderStatus: TaskInstanceReminderStatus;
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    startedAt?: DateTime;
    completedAt?: DateTime;
    cancelledAt?: DateTime;
    /** 生命周期事件记录 */
    events: TaskInstanceLifecycleEvent[];
  };
  /** 元数据 */
  metadata: {
    estimatedDuration?: number;
    actualDuration?: number;
    category: string;
    tags: string[];
    location?: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
  };
  /** 版本号 */
  version: number;
}

export type SnoozeConfig = {
  /** 是否启用稍后提醒 */
  enabled: boolean;
  /** 稍后提醒间隔 (分钟) */
  interval: number;
  /** 最大重复次数 */
  maxCount: number;
};

/**
 * 重复规则 - 更灵活的重复模式
 */
export type RecurrenceRule = {
  /** 重复类型 */
  type: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  /** 重复间隔 (例如：每2天、每3周) */
  interval?: number;
  /** 结束条件 */
  endCondition?: {
    /** 结束类型 */
    type: "never" | "date" | "count";
    /** 结束日期 (当 type 为 'date') */
    endDate?: DateTime;
    /** 重复次数 (当 type 为 'count') */
    count?: number;
  };
  /** 重复的具体配置 */
  config?: {
    /** 周重复：星期几 (0=周日, 1=周一, ...,
    /** 周重复：星期几 (0=周日, 1=周一, ..., 6=周六) */
    weekdays?: number[];
    /** 月重复：每月的第几天 */
    monthDays?: number[];
    /** 月重复：每月的第几个星期几 (如第二个周一) */
    monthWeekdays?: Array<{
      week: number; // 第几周 (1-5, -1表示最后一周)
      weekday: number; // 星期几 (0-6)
    }>;
    /** 年重复：月份 */
    months?: number[];
  };
};

/**
 * 基础响应类型
 */
export interface TaskResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  goalId?: string;
  keyResultId?: string;
  category?: string;
  tags?: string[];
  status?: string[];
  dateRange?: {
    start: DateTime;
    end: DateTime;
  };
  limit?: number;
  offset?: number;
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  overall: {
    total: number;
    completed: number;
    incomplete: number;
    completionRate: number;
    missedTasks: number;
  };
  taskDetails: Array<{
    templateId: string;
    title: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
}

/**
 * 任务时间线
 */
export interface TaskTimeline {
  date: string;
  total: number;
  completed: number;
}

/**
 * 任务元模板接口
 * 定义可重复使用的任务元模板结构
 */
export interface ITaskMetaTemplate {
  /** 元模板ID */
  id: string;
  /** 元模板名称 */
  name: string;
  /** 元模板描述 */
  description?: string;
  /** 元模板分类 */
  category: string;
  /** 默认时间配置 */
  defaultTimeConfig: TaskTimeConfig;
  /** 默认提醒配置 */
  defaultReminderConfig: TaskReminderConfig;
  /** 默认元数据 */
  defaultMetadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    priority?: 1 | 2 | 3 | 4 | 5;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    location?: string;
  };
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "archived";
  };
}
