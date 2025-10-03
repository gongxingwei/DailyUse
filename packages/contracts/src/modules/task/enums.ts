/**
 * Task 模块枚举定义
 * 参考 Goal 模块的 enums.ts 设计
 *
 * @module TaskEnums
 */

/**
 * 任务执行时间类型
 */
export enum TaskTimeType {
  /** 全天任务 - 不指定具体时间 */
  ALL_DAY = 'allDay',
  /** 指定时间点 - 在某个具体时间执行 */
  SPECIFIC_TIME = 'specificTime',
  /** 时间范围 - 在某个时间段内执行 */
  TIME_RANGE = 'timeRange',
}

/**
 * 任务调度模式
 */
export enum TaskScheduleMode {
  /** 单次任务 - 只执行一次 */
  ONCE = 'once',
  /** 每日重复 */
  DAILY = 'daily',
  /** 每周重复 */
  WEEKLY = 'weekly',
  /** 每月重复 */
  MONTHLY = 'monthly',
  /** 自定义间隔天数 */
  INTERVAL_DAYS = 'intervalDays',
}

/**
 * 任务模板状态
 */
export enum TaskTemplateStatus {
  /** 草稿 - 尚未激活 */
  DRAFT = 'draft',
  /** 激活 - 正在使用中 */
  ACTIVE = 'active',
  /** 暂停 - 临时停止生成实例 */
  PAUSED = 'paused',
  /** 已完成 - 已达到结束日期 */
  COMPLETED = 'completed',
  /** 已归档 - 不再使用 */
  ARCHIVED = 'archived',
}

/**
 * 任务实例状态
 */
export enum TaskInstanceStatus {
  /** 待处理 - 尚未开始 */
  PENDING = 'pending',
  /** 进行中 - 已开始但未完成 */
  IN_PROGRESS = 'inProgress',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已过期 - 超过计划时间未完成 */
  OVERDUE = 'overdue',
}

/**
 * 提醒状态
 */
export enum ReminderStatus {
  /** 待触发 - 等待到达提醒时间 */
  PENDING = 'pending',
  /** 已触发 - 提醒已发送 */
  TRIGGERED = 'triggered',
  /** 已忽略 - 用户主动忽略提醒 */
  DISMISSED = 'dismissed',
  /** 已稍后提醒 - 用户选择稍后提醒 */
  SNOOZED = 'snoozed',
  /** 已取消 - 提醒被取消 */
  CANCELLED = 'cancelled',
}

/**
 * 提醒类型
 */
export enum ReminderType {
  /** 系统通知 */
  NOTIFICATION = 'notification',
  /** 邮件提醒 */
  EMAIL = 'email',
  /** 声音提醒 */
  SOUND = 'sound',
}

/**
 * 提醒时间类型
 */
export enum ReminderTimingType {
  /** 相对时间 - 提前 N 分钟 */
  RELATIVE = 'relative',
  /** 绝对时间 - 指定具体时间 */
  ABSOLUTE = 'absolute',
}

/**
 * 任务实例生命周期事件类型
 */
export enum TaskLifecycleEventType {
  /** 实例创建 */
  CREATED = 'created',
  /** 任务开始 */
  STARTED = 'started',
  /** 任务暂停 */
  PAUSED = 'paused',
  /** 任务恢复 */
  RESUMED = 'resumed',
  /** 任务完成 */
  COMPLETED = 'completed',
  /** 任务取消 */
  CANCELLED = 'cancelled',
  /** 任务重新调度 */
  RESCHEDULED = 'rescheduled',
  /** 任务过期 */
  OVERDUE = 'overdue',
  /** 标题更新 */
  TITLE_UPDATED = 'title_updated',
  /** 提醒调度 */
  REMINDER_SCHEDULED = 'reminder_scheduled',
  /** 提醒触发 */
  REMINDER_TRIGGERED = 'reminder_triggered',
  /** 提醒忽略 */
  REMINDER_DISMISSED = 'reminder_dismissed',
  /** 稍后提醒 */
  REMINDER_SNOOZED = 'reminder_snoozed',
  /** 提醒取消 */
  REMINDER_CANCELLED = 'reminder_cancelled',
}

/**
 * 元模板分类
 */
export enum MetaTemplateCategory {
  /** 工作相关 */
  WORK = 'work',
  /** 个人生活 */
  PERSONAL = 'personal',
  /** 学习提升 */
  LEARNING = 'learning',
  /** 健康运动 */
  HEALTH = 'health',
  /** 社交娱乐 */
  SOCIAL = 'social',
  /** 家务琐事 */
  CHORES = 'chores',
  /** 其他 */
  OTHER = 'other',
}
