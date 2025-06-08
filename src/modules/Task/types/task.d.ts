import type { TaskTimeConfig, DateTime } from "./timeStructure";

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

export type TaskTemplate = {
  /** 任务模板ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 时间配置 - 使用新的时间结构 */
  timeConfig: TaskTimeConfig;
  /** 调度策略 */
  schedulingPolicy: {
    allowReschedule: boolean;
    maxDelayDays: number;
    skipWeekends: boolean;
    skipHolidays: boolean;
    workingHoursOnly: boolean;
  };
  /** 元素据 */
  metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number; // 分钟
    difficulty: 1 | 2 | 3 | 4 | 5;
    location?: string;
  };
  /** 生命周期 */
  lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'archived';
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
  /** 任务优先级 */
  priority?: 1 | 2 | 3 | 4;
  /** 创建时间 */
  createdAt: DateTime;
  /** 更新时间 */
  updatedAt: DateTime;
  /** 版本号 - 用于数据迁移 */
  version: number;
};

export type ITaskInstance = {
  /** 任务实例ID */
  id: string;
  /** 关联的任务模板ID */
  templateId: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 计划执行时间 */
  scheduledTime: DateTime;
  /** 实际开始时间 */
  actualStartTime?: DateTime;
  /** 实际结束时间 */
  actualEndTime?: DateTime;
  /** 任务关联的关键结果 */
  keyResultLinks?: KeyResultLink[];
  /** 任务优先级 */
  priority: 1 | 2 | 3 | 4;
  /** 任务状态 */
  status: "pending" | "inProgress" | "completed" | "cancelled" | "overdue";
  /** 完成时间 */
  completedAt?: DateTime;
  /** 提醒状态 */
  reminderStatus: {
    /** 已触发的提醒 */
    triggeredAlerts: string[];
    /** 下一个提醒时间 */
    nextReminderTime?: DateTime;
    /** 稍后提醒次数 */
    snoozeCount: number;
  };
};

/**
 * 任务统计
 */
export interface ITaskStats {
  /** 总任务数 */
  total: number;
  /** 已完成数 */
  completed: number;
  /** 今日完成数 */
  todayCompleted: number;
  /** 逾期数 */
  overdue: number;
}

export interface CreateTaskTemplateOptions {
  title?: string;
  description?: string;
  category?: string;
  priority?: 1 | 2 | 3 | 4;
  keyResultLinks?: KeyResultLink[];
}