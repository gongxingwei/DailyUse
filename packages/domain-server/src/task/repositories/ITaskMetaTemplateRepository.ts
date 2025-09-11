/**
 * Task Meta Template Repository Interface
 * 任务元模板仓储接口
 */

import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type TaskMetaTemplateDTO = TaskContracts.TaskMetaTemplateDTO;
type CreateTaskMetaTemplateRequest = TaskContracts.CreateTaskMetaTemplateRequest;
type UpdateTaskMetaTemplateRequest = TaskContracts.UpdateTaskMetaTemplateRequest;

export interface ITaskMetaTemplateRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<TaskMetaTemplateDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskMetaTemplateDTO[]>;
  save(accountUuid: string, metaTemplate: CreateTaskMetaTemplateRequest): Promise<void>;
  update(uuid: string, metaTemplate: UpdateTaskMetaTemplateRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 查询操作
  findByCategory(accountUuid: string, category: string): Promise<TaskMetaTemplateDTO[]>;
  findActive(accountUuid: string): Promise<TaskMetaTemplateDTO[]>;
  findFavorites(accountUuid: string): Promise<TaskMetaTemplateDTO[]>;
  findPopular(accountUuid: string, limit?: number): Promise<TaskMetaTemplateDTO[]>;
  findRecentlyUsed(accountUuid: string, limit?: number): Promise<TaskMetaTemplateDTO[]>;
  search(accountUuid: string, searchTerm: string): Promise<TaskMetaTemplateDTO[]>;

  // 使用统计
  incrementUsage(uuid: string): Promise<void>;
  updateLastUsed(uuid: string): Promise<void>;
  setFavorite(uuid: string, isFavorite: boolean): Promise<void>;
  getUsageStats(accountUuid: string): Promise<Record<string, number>>;

  // 状态管理
  activate(uuid: string): Promise<void>;
  deactivate(uuid: string): Promise<void>;

  // 批量操作
  batchDelete(uuids: string[]): Promise<void>;
  batchUpdateCategory(uuids: string[], category: string): Promise<void>;
  batchSetFavorite(uuids: string[], isFavorite: boolean): Promise<void>;
  batchActivate(uuids: string[]): Promise<void>;
  batchDeactivate(uuids: string[]): Promise<void>;

  // 统计操作
  getTotalCount(accountUuid: string): Promise<number>;
  getActiveCount(accountUuid: string): Promise<number>;
  getFavoriteCount(accountUuid: string): Promise<number>;
  getCountByCategory(accountUuid: string): Promise<Record<string, number>>;
}
