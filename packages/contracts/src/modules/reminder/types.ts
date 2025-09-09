import { ImportanceLevel } from '../../core';

// ========== 枚举类型 ==========

/**
 * 提醒类型枚举
 */
export enum ReminderType {
  /** 绝对时间提醒 */
  ABSOLUTE = 'absolute',
  /** 相对时间提醒 */
  RELATIVE = 'relative',
  /** 基于位置的提醒 */
  LOCATION_BASED = 'location_based',
  /** 基于事件的提醒 */
  EVENT_BASED = 'event_based',
}

/**
 * 提醒状态枚举
 */
export enum ReminderStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 已触发 */
  TRIGGERED = 'triggered',
  /** 已确认 */
  ACKNOWLEDGED = 'acknowledged',
  /** 已忽略 */
  DISMISSED = 'dismissed',
  /** 已稍后提醒 */
  SNOOZED = 'snoozed',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 提醒优先级枚举
 */
export enum ReminderPriority {
  /** 低优先级 */
  LOW = 'low',
  /** 普通优先级 */
  NORMAL = 'normal',
  /** 高优先级 */
  HIGH = 'high',
  /** 紧急 */
  URGENT = 'urgent',
}

/**
 * 重复模式枚举
 */
export enum RecurrencePattern {
  /** 不重复 */
  NONE = 'none',
  /** 每日 */
  DAILY = 'daily',
  /** 每周 */
  WEEKLY = 'weekly',
  /** 每月 */
  MONTHLY = 'monthly',
  /** 每年 */
  YEARLY = 'yearly',
  /** 自定义 */
  CUSTOM = 'custom',
}

/**
 * 稍后提醒类型枚举
 */
export enum SnoozeType {
  /** 5分钟后 */
  FIVE_MINUTES = '5_minutes',
  /** 10分钟后 */
  TEN_MINUTES = '10_minutes',
  /** 30分钟后 */
  THIRTY_MINUTES = '30_minutes',
  /** 1小时后 */
  ONE_HOUR = '1_hour',
  /** 明天 */
  TOMORROW = 'tomorrow',
  /** 自定义时间 */
  CUSTOM = 'custom',
}

/**
 * 提醒模板启用模式
 */
export enum ReminderTemplateEnableMode {
  /** 按组启用 */
  GROUP = 'group',
  /** 单独启用 */
  INDIVIDUAL = 'individual',
}

// ========== 接口定义 ==========

/**
 * 时间范围接口
 */
export interface TimeRange {
  /** 最小值（秒） */
  min: number;
  /** 最大值（秒） */
  max: number;
}

/**
 * 重复规则接口
 */
export interface RecurrenceRule {
  /** 重复模式 */
  pattern: RecurrencePattern;
  /** 重复间隔 */
  interval?: number;
  /** 结束条件 */
  endCondition?: {
    /** 结束类型 */
    type: 'never' | 'date' | 'count';
    /** 结束日期 */
    endDate?: Date;
    /** 重复次数 */
    count?: number;
  };
  /** 自定义配置 */
  customConfig?: {
    /** 指定星期几（0-6，0为周日） */
    weekdays?: number[];
    /** 指定月份中的天数 */
    monthDays?: number[];
    /** 指定年份中的月份 */
    months?: number[];
  };
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  /** 是否启用声音 */
  sound: boolean;
  /** 是否启用震动 */
  vibration: boolean;
  /** 是否启用弹窗 */
  popup: boolean;
  /** 声音文件路径 */
  soundFile?: string;
  /** 自定义通知图标 */
  customIcon?: string;
}

/**
 * 相对时间配置接口
 */
export interface RelativeTimeConfig {
  /** 配置名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 时间范围（秒） */
  duration: number | TimeRange;
  /** 重复规则 */
  schedule: RecurrenceRule;
}

/**
 * 绝对时间配置接口
 */
export interface AbsoluteTimeConfig {
  /** 配置名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 重复规则 */
  schedule: RecurrenceRule;
}

/**
 * 提醒时间配置
 */
export interface ReminderTimeConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'absolute' | 'relative';
  times?: string[]; // HH:mm format for daily/weekly/monthly
  weekdays?: number[]; // 0-6, 0=Sunday
  monthDays?: number[]; // 1-31
  customPattern?: {
    interval: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  // 新增的配置选项
  duration?: number | TimeRange; // 用于相对时间
  schedule?: RecurrenceRule; // 用于绝对时间
}

/**
 * 稍后提醒配置接口
 */
export interface SnoozeConfig {
  /** 是否启用稍后提醒 */
  enabled: boolean;
  /** 默认稍后提醒时间（分钟） */
  defaultMinutes: number;
  /** 最大稍后提醒次数 */
  maxCount: number;
  /** 预设稍后提醒选项 */
  presetOptions: Array<{
    label: string;
    minutes: number;
  }>;
}

/**
 * 提醒模板接口
 */
export interface IReminderTemplate {
  /** 模板UUID */
  uuid: string;
  /** 所属组UUID */
  groupUuid?: string;
  /** 模板名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 提醒消息 */
  message: string;
  /** 是否启用 */
  enabled: boolean;
  /** 模板自身的启用状态 */
  selfEnabled: boolean;
  /** 重要性级别 */
  importanceLevel?: ImportanceLevel;
  /** 时间配置 */
  timeConfig: ReminderTimeConfig;
  /** 提醒优先级 */
  priority: ReminderPriority;
  /** 分类 */
  category: string;
  /** 标签 */
  tags: string[];
  /** 通知设置 */
  notificationSettings?: NotificationSettings;
  /** 稍后提醒配置 */
  snoozeConfig?: SnoozeConfig;
  /** 生命周期信息 */
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
  };
  /** 统计信息 */
  analytics: {
    totalTriggers: number;
    acknowledgedCount: number;
    dismissedCount: number;
    snoozeCount: number;
    avgResponseTime?: number;
  };
  /** 版本号 */
  version: number;
}

/**
 * 提醒模板分组接口
 */
export interface IReminderTemplateGroup {
  /** 组UUID */
  uuid: string;
  /** 组名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 启用模式 */
  enableMode: ReminderTemplateEnableMode;
  /** 包含的模板 */
  templates: IReminderTemplate[];
  /** 父级组UUID */
  parentUuid?: string;
  /** 组图标 */
  icon?: string;
  /** 组颜色 */
  color?: string;
  /** 排序权重 */
  sortOrder?: number;
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
}

/**
 * 提醒实例接口
 */
export interface IReminderInstance {
  /** 实例UUID */
  uuid: string;
  /** 模板UUID */
  templateUuid: string;
  /** 提醒标题 */
  title?: string;
  /** 提醒消息 */
  message: string;
  /** 计划触发时间 */
  scheduledTime: Date;
  /** 实际触发时间 */
  triggeredTime?: Date;
  /** 确认时间 */
  acknowledgedTime?: Date;
  /** 忽略时间 */
  dismissedTime?: Date;
  /** 稍后提醒到期时间 */
  snoozedUntil?: Date;
  /** 提醒状态 */
  status: ReminderStatus;
  /** 提醒优先级 */
  priority: ReminderPriority;
  /** 元数据 */
  metadata: {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
  /** 稍后提醒历史 */
  snoozeHistory: Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    snoozeType?: SnoozeType;
    customMinutes?: number;
    reason?: string;
  }>;
  /** 当前稍后提醒次数 */
  currentSnoozeCount?: number;
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 版本号 */
  version: number;
}

/**
 * 提醒调度规则
 */
export interface ReminderScheduleRule {
  /** 规则UUID */
  uuid?: string;
  /** 模板UUID */
  templateUuid: string;
  /** 下次触发时间 */
  nextTriggerTime: Date;
  /** 重复模式 */
  recurrencePattern: ReminderTimeConfig;
  /** 是否激活 */
  isActive: boolean;
  /** 最后处理时间 */
  lastProcessed?: Date;
  /** 时区 */
  timezone?: string;
  /** 执行次数 */
  executionCount?: number;
  /** 最大执行次数 */
  maxExecutions?: number;
}

/**
 * 提醒计划接口
 */
export interface IReminderSchedule {
  /** 计划UUID */
  uuid: string;
  /** 模板UUID */
  templateUuid: string;
  /** 计划名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 下次执行时间 */
  nextExecutionTime: Date;
  /** 最后执行时间 */
  lastExecutionTime?: Date;
  /** 执行次数 */
  executionCount: number;
  /** 最大执行次数 */
  maxExecutions?: number;
  /** 重复规则 */
  recurrenceRule: RecurrenceRule;
  /** 时区 */
  timezone: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 提醒查询参数
 */
export interface ReminderQueryParams {
  /** 状态筛选 */
  status?: ReminderStatus[];
  /** 优先级筛选 */
  priority?: ReminderPriority[];
  /** 分类筛选 */
  category?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 模板UUID */
  templateUuid?: string;
  /** 组UUID */
  groupUuid?: string;
  /** 关键字搜索 */
  keyword?: string;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 提醒统计信息
 */
export interface ReminderStats {
  /** 总数 */
  total: number;
  /** 待处理 */
  pending: number;
  /** 已触发 */
  triggered: number;
  /** 已确认 */
  acknowledged: number;
  /** 已忽略 */
  dismissed: number;
  /** 已稍后提醒 */
  snoozed: number;
  /** 已过期 */
  expired: number;
  /** 平均响应时间 */
  avgResponseTime: number;
  /** 确认率 */
  acknowledgmentRate: number;
  /** 按优先级统计 */
  byPriority?: Record<ReminderPriority, number>;
  /** 按状态统计 */
  byStatus?: Record<ReminderStatus, number>;
  /** 按类型统计 */
  byType?: Record<ReminderType, number>;
}

/**
 * 网格项类型（提醒模板或提醒组）
 */
export type GridItem = IReminderTemplate | IReminderTemplateGroup;

/**
 * 系统根组ID常量
 */
export const SYSTEM_GROUP_ID = 'system-root';
