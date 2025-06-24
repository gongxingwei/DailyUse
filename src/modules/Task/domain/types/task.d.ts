import type { DateTime, RecurrenceRule, TimePoint, TimeRange } from "@/shared/types/myDateTime";

/**
 * 关键结果关联
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
 * 提醒配置 - 从TaskTimeConfig中独立出来
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
 * 提醒项类型 - 从 ReminderRule 中提取单个提醒项的类型
 */
export type ReminderAlert = TaskReminderConfig['alerts'][number];

/**
 * 提醒时机配置类型 - 从 ReminderAlert 中提取时机配置的类型
 */
export type ReminderTiming = TaskReminderConfig['timing'];



/**
 * 简化的任务时间配置 - 移除reminder
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
 */
export type TaskInstanceLifecycleEvent = {
  type: "reminder_scheduled" | "reminder_triggered" | "reminder_dismissed" | "reminder_snoozed" | "reminder_cancelled" | "task_started" | "task_completed" | "task_undo" | "task_cancelled" | "task_rescheduled" | "task_overdue" | "task_title_updated";
  timestamp: DateTime;
  alertId?: string;
  details?: Record<string, any>;
};

/**
 * 任务实例时间配置 - 简化版，专注于具体执行
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
 * 任务实例接口 - 更新版本
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
  
  /** 时间配置 - 新增 */
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
  /** 增强的提醒状态 */
  reminderStatus: TaskInstanceReminderStatus;
  /** 增强的生命周期 */
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

/**
 * 创建任务模板的选项
 */
export interface CreateTaskTemplateOptions {
  description?: string;
  category?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  estimatedDuration?: number;
  location?: string;
  schedulingPolicy?: Partial<ITaskTemplate['schedulingPolicy']>;
  keyResultLinks?: KeyResultLink[];
}

/**
 * 创建任务实例的选项 - 更新版本
 */
export interface CreateTaskInstanceOptions {
  description?: string;
  keyResultLinks?: KeyResultLink[];
  category?: string;
  tags?: string[];
  estimatedDuration?: number;
  location?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  reminderAlerts?: TaskReminderConfig['alerts'];
  /** 时间配置选项 - 新增 */
  timeConfig?: Partial<TaskInstanceTimeConfig>;
}