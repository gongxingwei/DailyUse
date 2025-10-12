/**
 * Schedule Module - Enums
 * 调度模块 - 枚举类型定义
 *
 * @module @dailyuse/contracts/schedule
 */

/**
 * 调度任务状态
 * Schedule Task Status Enum
 *
 * @description 定义调度任务的生命周期状态
 */
export enum ScheduleTaskStatus {
  /** 活跃 - 任务正常运行中 */
  ACTIVE = 'active',

  /** 暂停 - 任务已暂停，不会触发执行 */
  PAUSED = 'paused',

  /** 完成 - 任务已完成所有计划执行 */
  COMPLETED = 'completed',

  /** 取消 - 任务被用户或系统取消 */
  CANCELLED = 'cancelled',

  /** 失败 - 任务因错误而失败 */
  FAILED = 'failed',
}

/**
 * 执行状态
 * Execution Status Enum
 *
 * @description 定义单次任务执行的状态
 */
export enum ExecutionStatus {
  /** 成功 - 执行成功完成 */
  SUCCESS = 'success',

  /** 失败 - 执行失败 */
  FAILED = 'failed',

  /** 跳过 - 执行被跳过（如任务已暂停） */
  SKIPPED = 'skipped',

  /** 超时 - 执行超时 */
  TIMEOUT = 'timeout',

  /** 重试中 - 正在重试执行 */
  RETRYING = 'retrying',
}

/**
 * 任务优先级
 * Task Priority Enum
 *
 * @description 定义任务的执行优先级
 */
export enum TaskPriority {
  /** 低优先级 */
  LOW = 'low',

  /** 普通优先级（默认） */
  NORMAL = 'normal',

  /** 高优先级 */
  HIGH = 'high',

  /** 紧急优先级 */
  URGENT = 'urgent',
}

/**
 * 来源模块
 * Source Module Enum
 *
 * @description 定义可以使用调度服务的模块
 */
export enum SourceModule {
  /** Reminder 模块 */
  REMINDER = 'reminder',

  /** Task 模块 */
  TASK = 'task',

  /** Goal 模块 */
  GOAL = 'goal',

  /** Notification 模块 */
  NOTIFICATION = 'notification',

  /** System 系统任务 */
  SYSTEM = 'system',

  /** Custom 自定义模块 */
  CUSTOM = 'custom',
}

/**
 * 时区
 * Timezone Enum
 *
 * @description 常用时区枚举
 */
export enum Timezone {
  /** UTC 时区 */
  UTC = 'UTC',

  /** 上海时区（东八区） */
  SHANGHAI = 'Asia/Shanghai',

  /** 东京时区 */
  TOKYO = 'Asia/Tokyo',

  /** 纽约时区 */
  NEW_YORK = 'America/New_York',

  /** 伦敦时区 */
  LONDON = 'Europe/London',
}
