/**
 * ReminderTemplateGroup 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { ReminderTemplateGroup } from '../aggregates/ReminderTemplateGroup';

export interface IReminderTemplateGroupAggregateRepository {
  // ===== ReminderTemplateGroup 聚合根 CRUD =====

  /**
   * 保存 ReminderTemplateGroup 聚合根
   */
  saveGroup(accountUuid: string, group: ReminderTemplateGroup): Promise<ReminderTemplateGroup>;

  /**
   * 根据 UUID 获取 ReminderTemplateGroup 聚合根
   */
  getGroupByUuid(accountUuid: string, uuid: string): Promise<ReminderTemplateGroup | null>;

  /**
   * 获取所有 ReminderTemplateGroup（分页查询）
   */
  getAllGroups(
    accountUuid: string,
    params?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'order';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ groups: ReminderTemplateGroup[]; total: number }>;

  /**
   * 删除 ReminderTemplateGroup 聚合根
   */
  deleteGroup(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 统计分组数量
   */
  countGroups(accountUuid: string, isActive?: boolean): Promise<number>;

  /**
   * 检查分组是否存在
   */
  groupExists(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 更新分组排序
   */
  updateGroupOrder(
    accountUuid: string,
    groupOrders: Array<{ uuid: string; order: number }>,
  ): Promise<boolean>;
}
