/**
 * Schedule 模块枚举定义
 */

/**
 * 调度任务状态
 */
export enum ScheduleStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

/**
 * 调度任务优先级
 */
export enum SchedulePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * 调度任务类型
 */
export enum ScheduleTaskType {
  TASK_REMINDER = 'TASK_REMINDER',
  GOAL_REMINDER = 'GOAL_REMINDER',
  GENERAL_REMINDER = 'GENERAL_REMINDER',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  DATA_BACKUP = 'DATA_BACKUP',
  CLEANUP_TASK = 'CLEANUP_TASK',
}

/**
 * 重复规则类型
 */
export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

/**
 * 提醒方式
 */
export enum AlertMethod {
  POPUP = 'POPUP',
  SOUND = 'SOUND',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  DESKTOP_FLASH = 'DESKTOP_FLASH',
}

/**
 * 自定义操作按钮样式
 */
export enum AlertActionStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
}

/**
 * 批量操作类型
 */
export enum ScheduleBatchOperationType {
  ENABLE = 'enable',
  DISABLE = 'disable',
  CANCEL = 'cancel',
  DELETE = 'delete',
  PAUSE = 'pause',
  RESUME = 'resume',
}

/**
 * 定时任务状态（用于 RecurringScheduleTask）
 */
export enum ScheduleTaskStatus {
  /** 活跃 - 正在运行中 */
  ACTIVE = 'active',
  /** 暂停 - 临时停止 */
  PAUSED = 'paused',
  /** 已完成 - 仅用于一次性任务 */
  COMPLETED = 'completed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 任务触发器类型
 */
export enum TriggerType {
  /** Cron 表达式 */
  CRON = 'cron',
  /** 一次性定时 */
  ONCE = 'once',
}
