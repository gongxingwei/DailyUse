/**
 * Reminder Module Enums
 * 提醒模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */

// ============ 提醒模板相关枚举 ============

/**
 * 提醒类型枚举
 */
export enum ReminderType {
  /** 一次性提醒 */
  ONE_TIME = 'ONE_TIME',
  /** 循环提醒 */
  RECURRING = 'RECURRING',
}

/**
 * 触发器类型枚举
 */
export enum TriggerType {
  /** 固定时间 */
  FIXED_TIME = 'FIXED_TIME',
  /** 间隔时间 */
  INTERVAL = 'INTERVAL',
}

/**
 * 提醒状态枚举
 */
export enum ReminderStatus {
  /** 活跃 */
  ACTIVE = 'ACTIVE',
  /** 已暂停 */
  PAUSED = 'PAUSED',
}

// ============ 重复配置相关枚举 ============

/**
 * 重复类型枚举
 */
export enum RecurrenceType {
  /** 每日 */
  DAILY = 'DAILY',
  /** 每周 */
  WEEKLY = 'WEEKLY',
  /** 自定义日期 */
  CUSTOM_DAYS = 'CUSTOM_DAYS',
}

/**
 * 星期枚举
 */
export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// ============ 分组控制相关枚举 ============

/**
 * 控制模式枚举
 */
export enum ControlMode {
  /** 组控制 - 所有模板统一控制 */
  GROUP = 'GROUP',
  /** 个体控制 - 每个模板独立控制 */
  INDIVIDUAL = 'INDIVIDUAL',
}

// ============ 通知相关枚举 ============

/**
 * 通知渠道枚举
 */
export enum NotificationChannel {
  /** 应用内通知 */
  IN_APP = 'IN_APP',
  /** 推送通知 */
  PUSH = 'PUSH',
  /** 邮件通知 */
  EMAIL = 'EMAIL',
  /** 短信通知 */
  SMS = 'SMS',
}

/**
 * 通知操作类型枚举
 */
export enum NotificationAction {
  /** 关闭 */
  DISMISS = 'DISMISS',
  /** 稍后提醒 */
  SNOOZE = 'SNOOZE',
  /** 完成 */
  COMPLETE = 'COMPLETE',
  /** 自定义操作 */
  CUSTOM = 'CUSTOM',
}

// ============ 历史记录相关枚举 ============

/**
 * 触发结果枚举
 */
export enum TriggerResult {
  /** 成功 */
  SUCCESS = 'SUCCESS',
  /** 失败 */
  FAILED = 'FAILED',
  /** 跳过 */
  SKIPPED = 'SKIPPED',
}
