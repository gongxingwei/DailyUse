/**
 * TaskTemplate 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { TaskTemplate } from '../aggregates/TaskTemplate';
import type { TaskContracts } from '@dailyuse/contracts';

export interface ITaskTemplateAggregateRepository {
  // ===== 基础 CRUD 操作 =====
  saveTemplate(accountUuid: string, template: TaskTemplate): Promise<TaskTemplate>;
  getTemplateByUuid(accountUuid: string, uuid: string): Promise<TaskTemplate | null>;
  getAllTemplates(
    accountUuid: string,
    params?: {
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
      limit?: number;
      offset?: number;
    },
  ): Promise<{ templates: TaskTemplate[]; total: number }>;
  deleteTemplate(accountUuid: string, uuid: string): Promise<boolean>;
  countTemplates(accountUuid: string): Promise<number>;

  // ===== 统计查询方法（原 TaskStats 聚合根功能） =====
  // TaskStats 不是真正的聚合根，只是读模型，应该作为 TaskTemplate 的业务查询方法
  getAccountStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO>;
  getTemplateStats(templateUuid: string): Promise<TaskContracts.TaskStatsDTO['byTemplate'][0]>;
  getDateRangeStats(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TaskContracts.TaskStatsDTO['byTimePeriod']>;
  getCompletionTrends(
    accountUuid: string,
    days: number,
  ): Promise<TaskContracts.TaskStatsDTO['trends']>;
}
