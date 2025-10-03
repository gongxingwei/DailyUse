import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import { TaskTimeType, TaskScheduleMode } from './enums';

/**
 * 任务时间配置 - 简化版
 */
export interface TaskTimeConfig {
  /** 具体时间设置 */
  time: {
    /** 任务时间类型 */
    timeType: TaskTimeType;
    /** 开始时间 (对于 specificTime 和 timeRange) */
    startTime?: string; // HH:mm 格式
    /** 结束时间 (仅对于 timeRange) */
    endTime?: string; // HH:mm 格式
  };
  date: {
    /** 开始日期 */
    startDate: Date;
    /** 结束日期 (可选，无限期则不设置) */
    endDate?: Date;
  };
  /** 调度配置 */
  schedule: {
    /** 调度模式 */
    mode: TaskScheduleMode;
    /** 间隔天数 (当 mode 为 INTERVAL_DAYS 时) */
    intervalDays?: number;
    /** 每周的哪些天 (当 mode 为 WEEKLY 时) 0=周日, 1=周一, ... */
    weekdays?: number[];
    /** 每月的哪些天 (当 mode 为 MONTHLY 时) 1-31 */
    monthDays?: number[];
  };
  /** 时区 */
  timezone: string;
}

/**
 * 任务模板接口 - 优化版
 */
export interface ITaskTemplate {
  /** 模板ID */
  uuid: string;
  accountUuid: string;

  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 时间配置 */
  timeConfig: TaskTimeConfig;

  /** 提醒配置 */
  reminderConfig: {
    /** 是否启用提醒 */
    enabled: boolean;
    /** 提前多少分钟提醒 */
    minutesBefore: number;
    /** 提醒方式 */
    methods: ('notification' | 'sound')[];
  };

  /** 基本属性 */
  properties: {
    /** 重要性 */
    importance: ImportanceLevel;
    /** 紧急性 */
    urgency: UrgencyLevel;
    /** 地点 */
    location?: string;
    /** 标签 */
    tags: string[];
  };

  /** 生命周期 */
  lifecycle: {
    /** 状态 */
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
  };

  /** 统计信息 */
  stats: {
    /** 总生成实例数 */
    totalInstances: number;
    /** 已完成实例数 */
    completedInstances: number;
    /** 完成率 */
    completionRate: number;
    /** 最后生成实例时间 */
    lastInstanceDate?: Date;
  };

  /** 关联目标 (可选) */
  goalLinks?: KeyResultLink[];
}

/**
 * 关键结果关联
 */
export interface KeyResultLink {
  goalUuid: string;
  keyResultId: string;
  incrementValue: number;
}

/**
 * 任务提醒配置
 */
export interface TaskReminderConfig {
  enabled: boolean;
  alerts: Array<{
    uuid: string;
    timing: {
      type: 'relative' | 'absolute';
      minutesBefore?: number;
      absoluteTime?: Date;
    };
    type: 'notification' | 'email' | 'sound';
    message?: string;
  }>;
  snooze: {
    enabled: boolean;
    interval: number;
    maxCount: number;
  };
}

/**
 * 任务实例时间配置 - 简化版
 */
export interface TaskInstanceTimeConfig {
  /** 任务时间类型 */
  timeType: TaskTimeType;
  /** 计划执行日期 */
  scheduledDate: Date;
  /** 开始时间 (HH:mm 格式，对于 specificTime 和 timeRange) */
  startTime?: string;
  /** 结束时间 (HH:mm 格式，仅对于 timeRange) */
  endTime?: string;
  /** 预估时长(分钟) */
  estimatedDuration?: number;
  /** 时区 */
  timezone: string;
}

/**
 * 任务实例提醒状态 - 简化版
 */
export interface TaskInstanceReminderStatus {
  /** 是否启用提醒 */
  enabled: boolean;
  /** 提醒状态 */
  status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
  /** 计划提醒时间 */
  scheduledTime?: Date;
  /** 实际触发时间 */
  triggeredAt?: Date;
  /** 稍后提醒次数 */
  snoozeCount: number;
  /** 稍后提醒到期时间 */
  snoozeUntil?: Date;
}

/**
 * 任务实例生命周期事件
 */
export interface TaskInstanceLifecycleEvent {
  type:
    | 'reminder_scheduled'
    | 'reminder_triggered'
    | 'reminder_dismissed'
    | 'reminder_snoozed'
    | 'reminder_cancelled'
    | 'task_started'
    | 'task_completed'
    | 'task_undo'
    | 'task_cancelled'
    | 'task_rescheduled'
    | 'task_overdue'
    | 'task_title_updated';
  timestamp: Date;
  alertId?: string;
  details?: Record<string, any>;
}

/**
 * 任务实例接口 - 优化版
 */
export interface ITaskInstance {
  /** 实例ID */
  uuid: string;
  /** 关联的模板ID */
  templateUuid: string;
  /** 所属账户 */
  accountUuid: string;

  /** 任务标题 (可以修改，不一定和模板一致) */
  title: string;
  /** 任务描述 (可以修改) */
  description?: string;

  /** 时间配置 */
  timeConfig: TaskInstanceTimeConfig;

  /** 提醒状态 */
  reminderStatus: TaskInstanceReminderStatus;

  /** 执行状态 */
  execution: {
    /** 任务状态 */
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
    /** 实际开始时间 */
    actualStartTime?: Date;
    /** 实际完成时间 */
    actualEndTime?: Date;
    /** 实际耗时(分钟) */
    actualDuration?: number;
    /** 完成度百分比 (0-100) */
    progressPercentage: number;
    /** 执行备注 */
    notes?: string;
  };

  /** 基本属性 (继承自模板，但可以调整) */
  properties: {
    /** 重要性 */
    importance: ImportanceLevel;
    /** 紧急性 */
    urgency: UrgencyLevel;
    /** 地点 */
    location?: string;
    /** 标签 */
    tags: string[];
  };

  /** 生命周期 */
  lifecycle: {
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
    /** 关键事件记录 */
    events: Array<{
      type:
        | 'created'
        | 'started'
        | 'paused'
        | 'resumed'
        | 'completed'
        | 'cancelled'
        | 'rescheduled';
      timestamp: Date;
      note?: string;
    }>;
  };

  /** 关联目标 (继承自模板) */
  goalLinks?: KeyResultLink[];
} /**
 * 任务元模板接口 - 优化版
 */
export interface ITaskMetaTemplate {
  /** 元模板ID */
  uuid: string;
  /** 所属账户 */
  accountUuid: string;

  /** 元模板名称 */
  name: string;
  /** 元模板描述 */
  description?: string;

  /** 外观设置 */
  appearance: {
    /** 图标 */
    icon?: string;
    /** 颜色 */
    color?: string;
    /** 分类标签 */
    category: string;
  };

  /** 默认时间配置模板 */
  defaultTimeConfig: {
    /** 默认时间类型 */
    timeType: TaskTimeType;
    /** 默认调度模式 */
    scheduleMode: TaskScheduleMode;
    /** 默认时区 */
    timezone: string;
    /** 常用时间设置 */
    commonTimeSettings?: {
      startTime?: string;
      endTime?: string;
    };
  };

  /** 默认提醒配置 */
  defaultReminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };

  /** 默认属性配置 */
  defaultProperties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    tags: string[];
    location?: string;
  };

  /** 使用统计 */
  usage: {
    /** 使用次数 */
    usageCount: number;
    /** 最后使用时间 */
    lastUsedAt?: Date;
    /** 是否为常用模板 */
    isFavorite: boolean;
  };

  /** 生命周期 */
  lifecycle: {
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
    /** 是否激活 */
    isActive: boolean;
  };
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  goalUuid?: string;
  keyResultId?: string;
  category?: string;
  tags?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
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
