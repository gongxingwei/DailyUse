/**
 * Task Template Repository Interface
 * 任务模板仓储接口
 */

import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskTemplateDTO = TaskContracts.TaskTemplateDTO;
type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;
type TaskQueryParamsDTO = TaskContracts.TaskQueryParamsDTO;
type TaskStatsDTO = TaskContracts.TaskStatsDTO;

export interface ITaskTemplateRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<TaskTemplateDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskTemplateDTO[]>;
  save(accountUuid: string, template: CreateTaskTemplateRequest): Promise<void>;
  update(uuid: string, template: UpdateTaskTemplateRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 查询操作
  findByCategory(accountUuid: string, category: string): Promise<TaskTemplateDTO[]>;
  findByStatus(accountUuid: string, status: string): Promise<TaskTemplateDTO[]>;
  findByImportanceLevel(accountUuid: string, level: ImportanceLevel): Promise<TaskTemplateDTO[]>;
  findByUrgencyLevel(accountUuid: string, level: UrgencyLevel): Promise<TaskTemplateDTO[]>;
  search(accountUuid: string, query: TaskQueryParamsDTO): Promise<TaskTemplateDTO[]>;

  // 统计操作
  getStats(accountUuid: string): Promise<TaskStatsDTO>;
  getCountByStatus(accountUuid: string): Promise<Record<string, number>>;
  getCountByCategory(accountUuid: string): Promise<Record<string, number>>;
  getTotalCount(accountUuid: string): Promise<number>;

  // 批量操作
  batchDelete(uuids: string[]): Promise<void>;
  batchUpdateStatus(uuids: string[], status: string): Promise<void>;
  batchUpdateCategory(uuids: string[], category: string): Promise<void>;

  // 状态管理
  activate(uuid: string): Promise<void>;
  deactivate(uuid: string): Promise<void>;
  archive(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
}
