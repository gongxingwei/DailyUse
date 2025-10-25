/**
 * Task Module - Type Aliases
 * 任务模块 - 类型别名
 *
 * 这个文件提供简短的类型别名，便于在应用中导入使用
 */

import { TaskTemplateClient } from './aggregates/TaskTemplateClient';
import { TaskInstanceClient } from './aggregates/TaskInstanceClient';
import { TaskStatisticsClient } from './aggregates/TaskStatisticsClient';
import { TaskTemplateHistoryClient } from './entities/TaskTemplateHistoryClient';

// 聚合根别名
export type TaskTemplate = TaskTemplateClient;
export type TaskInstance = TaskInstanceClient;
export type TaskStatistics = TaskStatisticsClient;

// 实体别名
export type TaskTemplateHistory = TaskTemplateHistoryClient;

// 值对象别名
export type {
  TaskTimeConfigClient as TaskTimeConfig,
  RecurrenceRuleClient as RecurrenceRule,
  TaskReminderConfigClient as TaskReminderConfig,
  TaskGoalBindingClient as TaskGoalBinding,
} from './value-objects';

// 也导出原始类名（保持兼容性）
export {
  TaskTemplateClient,
  TaskInstanceClient,
  TaskStatisticsClient,
  TaskTemplateHistoryClient,
};

// 从 contracts 重新导出常用类型
export type {
  TaskType,
  TaskTemplateStatus,
  TaskInstanceStatus,
  TimeType,
} from '@dailyuse/contracts';
