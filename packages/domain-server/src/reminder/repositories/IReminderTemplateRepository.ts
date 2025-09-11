/**
 * Reminder Template Repository Interface
 * 提醒模板仓储接口
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type ReminderTemplateResponse = ReminderContracts.ReminderTemplateResponse;
type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type ReminderQueryParamsDTO = ReminderContracts.ReminderQueryParamsDTO;
type ReminderStatsResponse = ReminderContracts.ReminderStatsResponse;
type ReminderPriority = ReminderContracts.ReminderPriority;

export interface IReminderTemplateRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<ReminderTemplateResponse | null>;
  findByAccountUuid(accountUuid: string): Promise<ReminderTemplateResponse[]>;
  findByGroupUuid(groupUuid: string): Promise<ReminderTemplateResponse[]>;
  save(accountUuid: string, template: CreateReminderTemplateRequest): Promise<void>;
  update(uuid: string, template: UpdateReminderTemplateRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 查询操作
  findByCategory(accountUuid: string, category: string): Promise<ReminderTemplateResponse[]>;
  findByPriority(
    accountUuid: string,
    priority: ReminderPriority,
  ): Promise<ReminderTemplateResponse[]>;
  findByTags(accountUuid: string, tags: string[]): Promise<ReminderTemplateResponse[]>;
  findEnabled(accountUuid: string): Promise<ReminderTemplateResponse[]>;
  findDisabled(accountUuid: string): Promise<ReminderTemplateResponse[]>;
  search(accountUuid: string, query: ReminderQueryParamsDTO): Promise<ReminderTemplateResponse[]>;

  // 状态管理
  enable(uuid: string): Promise<void>;
  disable(uuid: string): Promise<void>;
  toggleEnabled(uuid: string): Promise<void>;

  // 统计操作
  getStats(accountUuid: string): Promise<ReminderStatsResponse>;
  getCountByCategory(accountUuid: string): Promise<Record<string, number>>;
  getCountByPriority(accountUuid: string): Promise<Record<string, number>>;
  getEnabledCount(accountUuid: string): Promise<number>;
  getTotalCount(accountUuid: string): Promise<number>;

  // 触发记录
  incrementTriggerCount(uuid: string): Promise<void>;
  updateLastTriggered(uuid: string): Promise<void>;
  updateAnalytics(uuid: string, acknowledged: boolean, responseTime?: number): Promise<void>;

  // 批量操作
  batchDelete(uuids: string[]): Promise<void>;
  batchEnable(uuids: string[]): Promise<void>;
  batchDisable(uuids: string[]): Promise<void>;
  batchUpdateCategory(uuids: string[], category: string): Promise<void>;
  batchUpdateGroup(uuids: string[], groupUuid: string): Promise<void>;
}
