/**
 * Task 模块持久化 DTO 定义 - 用于扁平化存储
 */

import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import {
  TaskTimeType,
  TaskScheduleMode,
  TaskTemplateStatus,
  TaskInstanceStatus,
  ReminderStatus,
} from './enums';

/**
 * 任务模板持久化 DTO
 */
export interface TaskTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;

  // 基本信息
  title: string;
  description?: string;

  // 时间配置 - 扁平化或 JSON
  timeType: TaskTimeType;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  startDate: Date;
  endDate?: Date;
  scheduleMode: TaskScheduleMode;
  intervalDays?: number;
  weekdays?: string; // JSON string
  monthDays?: string; // JSON string
  timezone: string;

  // 提醒配置 - 扁平化
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  reminderMethods: string; // JSON string: ['notification', 'sound']

  // 属性 - 扁平化
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  location?: string;
  tags: string; // JSON string

  // 目标关联
  goalLinks?: string; // JSON string

  // 状态
  status: TaskTemplateStatus;

  // 统计信息
  totalInstances: number;
  completedInstances: number;
  lastInstanceDate?: Date;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;

  // 版本控制
  version?: number;
}

/**
 * 任务实例持久化 DTO
 */
export interface TaskInstancePersistenceDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;

  // 基本信息
  title: string;
  description?: string;

  // 时间配置 - 扁平化
  timeType: TaskTimeType;
  scheduledDate: Date;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  estimatedDuration?: number;
  timezone: string;

  // 提醒状态 - 扁平化
  reminderEnabled: boolean;
  reminderStatus: ReminderStatus;
  reminderScheduledTime?: Date;
  reminderTriggeredAt?: Date;
  reminderSnoozeCount: number;
  reminderSnoozeUntil?: Date;

  // 执行状态 - 扁平化
  executionStatus: TaskInstanceStatus;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  progressPercentage: number;
  executionNotes?: string;

  // 属性 - 扁平化
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  location?: string;
  tags: string; // JSON string

  // 目标关联
  goalLinks?: string; // JSON string

  // 生命周期事件
  lifecycleEvents?: string; // JSON string

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 任务元模板持久化 DTO
 */
export interface TaskMetaTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;

  // 基本信息
  name: string;
  description?: string;

  // 外观 - 扁平化
  icon?: string;
  color?: string;
  category: string;

  // 默认时间配置 - 扁平化
  defaultTimeType: TaskTimeType;
  defaultScheduleMode: TaskScheduleMode;
  defaultTimezone: string;
  defaultStartTime?: string;
  defaultEndTime?: string;

  // 默认提醒配置 - 扁平化
  defaultReminderEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultReminderMethods: string; // JSON string

  // 默认属性 - 扁平化
  defaultImportance: ImportanceLevel;
  defaultUrgency: UrgencyLevel;
  defaultTags: string; // JSON string
  defaultLocation?: string;

  // 使用统计 - 扁平化
  usageCount: number;
  lastUsedAt?: Date;
  isFavorite: boolean;

  // 生命周期
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
