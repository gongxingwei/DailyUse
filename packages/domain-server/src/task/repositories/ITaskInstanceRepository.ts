/**
 * Task Instance Repository Interface
 * 任务实例仓储接口
 */

import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskInstanceDTO = TaskContracts.TaskInstanceDTO;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;
type CompleteTaskRequest = TaskContracts.CompleteTaskRequest;
type RescheduleTaskRequest = TaskContracts.RescheduleTaskRequest;
type UpdateTaskInstanceStatusRequest = TaskContracts.UpdateTaskInstanceStatusRequest;
type TaskQueryParamsDTO = TaskContracts.TaskQueryParamsDTO;

export interface ITaskInstanceRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<TaskInstanceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findByTemplateUuid(templateUuid: string): Promise<TaskInstanceDTO[]>;
  save(accountUuid: string, instance: CreateTaskInstanceRequest): Promise<void>;
  update(uuid: string, instance: UpdateTaskInstanceRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 状态查询
  findByStatus(accountUuid: string, status: string): Promise<TaskInstanceDTO[]>;
  findPending(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findInProgress(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findCompleted(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findOverdue(accountUuid: string): Promise<TaskInstanceDTO[]>;

  // 时间查询
  findByDateRange(accountUuid: string, startDate: Date, endDate: Date): Promise<TaskInstanceDTO[]>;
  findToday(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findThisWeek(accountUuid: string): Promise<TaskInstanceDTO[]>;
  findUpcoming(accountUuid: string, days?: number): Promise<TaskInstanceDTO[]>;

  // 属性查询
  findByImportanceLevel(accountUuid: string, level: ImportanceLevel): Promise<TaskInstanceDTO[]>;
  findByUrgencyLevel(accountUuid: string, level: UrgencyLevel): Promise<TaskInstanceDTO[]>;
  findByTags(accountUuid: string, tags: string[]): Promise<TaskInstanceDTO[]>;
  search(accountUuid: string, query: TaskQueryParamsDTO): Promise<TaskInstanceDTO[]>;

  // 状态操作
  updateStatus(uuid: string, statusRequest: UpdateTaskInstanceStatusRequest): Promise<void>;
  complete(uuid: string, completeRequest: CompleteTaskRequest): Promise<void>;
  reschedule(uuid: string, rescheduleRequest: RescheduleTaskRequest): Promise<void>;
  cancel(uuid: string, reason?: string): Promise<void>;
  start(uuid: string): Promise<void>;
  pause(uuid: string, reason?: string): Promise<void>;
  resume(uuid: string): Promise<void>;

  // 统计操作
  getCountByStatus(accountUuid: string): Promise<Record<string, number>>;
  getCountByTemplate(accountUuid: string): Promise<Record<string, number>>;
  getCompletionRate(accountUuid: string, templateUuid?: string): Promise<number>;
  getAverageDuration(accountUuid: string, templateUuid?: string): Promise<number>;
  getTotalCount(accountUuid: string): Promise<number>;

  // 批量操作
  batchDelete(uuids: string[]): Promise<void>;
  batchUpdateStatus(uuids: string[], status: string): Promise<void>;
  batchReschedule(uuids: string[], newDate: Date): Promise<void>;
  batchComplete(uuids: string[]): Promise<void>;
  batchCancel(uuids: string[], reason?: string): Promise<void>;

  // 提醒相关
  findDueForReminder(beforeMinutes: number): Promise<TaskInstanceDTO[]>;
  updateReminderStatus(uuid: string, status: string): Promise<void>;
  snoozeReminder(uuid: string, snoozeUntil: Date): Promise<void>;
}
