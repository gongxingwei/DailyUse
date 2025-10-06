/**
 * TaskMetaTemplate 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { TaskMetaTemplate } from '../aggregates/TaskMetaTemplate';

export interface ITaskMetaTemplateAggregateRepository {
  saveMetaTemplate(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TaskMetaTemplate>;
  getMetaTemplateByUuid(accountUuid: string, uuid: string): Promise<TaskMetaTemplate | null>;
  getAllMetaTemplates(
    accountUuid: string,
    options?: {
      isActive?: boolean;
      isFavorite?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'usageCount';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ metaTemplates: TaskMetaTemplate[]; total: number }>;
  searchMetaTemplates(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ metaTemplates: TaskMetaTemplate[]; total: number }>;
  deleteMetaTemplate(accountUuid: string, uuid: string): Promise<boolean>;
  countMetaTemplates(accountUuid: string, isActive?: boolean): Promise<number>;
  metaTemplateExists(accountUuid: string, uuid: string): Promise<boolean>;
}
