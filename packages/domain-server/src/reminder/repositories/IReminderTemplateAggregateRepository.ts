/**
 * ReminderTemplate 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { ReminderTemplate } from '../aggregates/ReminderTemplate';

export interface IReminderTemplateAggregateRepository {
  // ===== ReminderTemplate 聚合根 CRUD =====

  /**
   * 保存 ReminderTemplate 聚合根（包含子实体 ReminderInstance）
   */
  saveTemplate(accountUuid: string, template: ReminderTemplate): Promise<ReminderTemplate>;

  /**
   * 根据 UUID 获取 ReminderTemplate 聚合根（包含子实体）
   */
  getTemplateByUuid(accountUuid: string, uuid: string): Promise<ReminderTemplate | null>;

  /**
   * 获取所有 ReminderTemplate（分页查询）
   */
  getAllTemplates(
    accountUuid: string,
    params?: {
      groupUuid?: string;
      isActive?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'usageCount';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ templates: ReminderTemplate[]; total: number }>;

  /**
   * 删除 ReminderTemplate 聚合根（级联删除所有子实体）
   */
  deleteTemplate(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 统计模板数量
   */
  countTemplates(accountUuid: string, isActive?: boolean): Promise<number>;

  /**
   * 检查模板是否存在
   */
  templateExists(accountUuid: string, uuid: string): Promise<boolean>;
}
