/**
 * TaskTemplate 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { TaskTemplate } from '../aggregates/TaskTemplate';

export interface ITaskTemplateAggregateRepository {
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
}
