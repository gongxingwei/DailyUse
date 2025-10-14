/**
 * Task Module Enums
 * 任务模块枚举定义
 */

// ============ 任务类型枚举 ============

/**
 * 任务类型
 */
export enum TaskType {
  ONE_TIME = 'ONE_TIME', // 单次任务
  RECURRING = 'RECURRING', // 重复任务
}

/**
 * 时间类型
 */
export enum TimeType {
  ALL_DAY = 'ALL_DAY', // 全天任务
  TIME_POINT = 'TIME_POINT', // 时间点任务
  TIME_RANGE = 'TIME_RANGE', // 时间段任务
}

// ============ 状态枚举 ============

/**
 * 任务模板状态
 */
export enum TaskTemplateStatus {
  ACTIVE = 'ACTIVE', // 激活
  PAUSED = 'PAUSED', // 暂停
  ARCHIVED = 'ARCHIVED', // 归档
  DELETED = 'DELETED', // 删除
}

/**
 * 任务实例状态
 */
export enum TaskInstanceStatus {
  PENDING = 'PENDING', // 待处理
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  COMPLETED = 'COMPLETED', // 已完成
  SKIPPED = 'SKIPPED', // 已跳过
  EXPIRED = 'EXPIRED', // 已过期
}

// ============ 重复规则枚举 ============

/**
 * 重复频率
 */
export enum RecurrenceFrequency {
  DAILY = 'DAILY', // 每天
  WEEKLY = 'WEEKLY', // 每周
  MONTHLY = 'MONTHLY', // 每月
  YEARLY = 'YEARLY', // 每年
}

/**
 * 星期几
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// ============ 提醒枚举 ============

/**
 * 提醒类型
 */
export enum ReminderType {
  ABSOLUTE = 'ABSOLUTE', // 绝对时间提醒
  RELATIVE = 'RELATIVE', // 相对时间提醒
}

/**
 * 相对时间单位
 */
export enum ReminderTimeUnit {
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}
