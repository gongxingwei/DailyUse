/**
 * TaskTemplate Aggregate Root - Server Interface
 * 任务模板聚合根
 */

import type { TaskType, TaskTemplateStatus } from '../enums';
import type { TaskInstanceServerDTO } from './TaskInstanceServer';
import type { TaskTemplateHistoryServerDTO } from '../entities';
import type {
  TaskTimeConfigServerDTO,
  TaskTimeConfigClientDTO,
  RecurrenceRuleServerDTO,
  RecurrenceRuleClientDTO,
  TaskReminderConfigServerDTO,
  TaskReminderConfigClientDTO,
  TaskGoalBindingServerDTO,
  TaskGoalBindingClientDTO,
} from '../value-objects';

// 导入共享类型
import { ImportanceLevel } from '../../../shared/importance';
import { UrgencyLevel } from '../../../shared/urgency';

// ============ DTO 定义 ============

/**
 * TaskTemplate Client DTO (声明，实际定义在 Client 文件)
 */
export interface TaskTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigClientDTO;
  recurrenceRule?: RecurrenceRuleClientDTO | null;
  reminderConfig?: TaskReminderConfigClientDTO | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: TaskGoalBindingClientDTO | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: any[];
  instances?: any[];
  displayTitle: string;
  taskTypeText: string;
  timeDisplayText: string;
  recurrenceText?: string | null;
  importanceText: string;
  urgencyText: string;
  statusText: string;
  hasReminder: boolean;
  reminderText?: string | null;
  isLinkedToGoal: boolean;
  goalLinkText?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * TaskTemplate Server DTO
 */
export interface TaskTemplateServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO | null;
  reminderConfig?: TaskReminderConfigServerDTO | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: TaskGoalBindingServerDTO | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: TaskTemplateHistoryServerDTO[];
  instances?: TaskInstanceServerDTO[];
}

/**
 * TaskTemplate Persistence DTO
 */
export interface TaskTemplatePersistenceDTO {
  uuid: string;
  account_uuid: string;
  title: string;
  description?: string | null;
  task_type: string;
  time_config: string; // JSON
  recurrence_rule?: string | null; // JSON
  reminder_config?: string | null; // JSON
  importance: string;
  urgency: string;
  goal_binding?: string | null; // JSON
  folder_uuid?: string | null;
  tags: string; // JSON array
  color?: string | null;
  status: string;
  last_generated_date?: number | null;
  generate_ahead_days: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// ============ 聚合根接口 ============

export interface TaskTemplateServer {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: any;
  recurrenceRule?: any | null;
  reminderConfig?: any | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: any | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history: any[];
  instances: any[];

  // 实例生成
  generateInstances(fromDate: number, toDate: number): any[];
  getInstanceForDate(date: number): any | null;
  shouldGenerateInstance(date: number): boolean;

  // 状态管理
  activate(): void;
  pause(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 时间规则
  isActiveOnDate(date: number): boolean;
  getNextOccurrence(afterDate: number): number | null;

  // 提醒
  hasReminder(): boolean;
  getReminderTime(instanceDate: number): number | null;

  // 目标绑定
  bindToGoal(goalUuid: string, keyResultUuid: string, incrementValue: number): void;
  unbindFromGoal(): void;
  isLinkedToGoal(): boolean;

  // 历史记录
  addHistory(action: string, changes?: any): void;

  // 子实体管理
  createInstance(params: any): string;
  addInstance(instance: any): void;
  removeInstance(instanceUuid: string): any | null;
  getInstance(instanceUuid: string): any | null;
  getAllInstances(): any[];

  // DTO 转换
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
  toPersistenceDTO(): TaskTemplatePersistenceDTO;
}
