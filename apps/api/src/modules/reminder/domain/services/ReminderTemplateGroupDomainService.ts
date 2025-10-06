import type { ReminderContracts } from '@dailyuse/contracts';
import type {
  IReminderTemplateGroupAggregateRepository,
  ReminderTemplateGroup,
} from '@dailyuse/domain-server';

/**
 * ReminderTemplateGroup 领域服务
 *
 * 职责：
 * - 处理 ReminderTemplateGroup 聚合根的核心业务逻辑
 * - 通过 IReminderTemplateGroupAggregateRepository 接口操作数据
 * - 验证业务规则
 */
export class ReminderTemplateGroupDomainService {
  constructor(private readonly groupRepository: IReminderTemplateGroupAggregateRepository) {}

  // ==================== ReminderTemplateGroup CRUD 操作 ====================

  /**
   * 创建模板分组
   */
  async createGroup(
    accountUuid: string,
    request: ReminderContracts.CreateReminderTemplateGroupRequest,
  ): Promise<any> {
    // TODO: 使用聚合根工厂方法创建
    throw new Error('ReminderTemplateGroupDomainService.createGroup not yet implemented');
  }

  /**
   * 获取所有分组
   */
  async getAllGroups(
    accountUuid: string,
    params?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'order' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ groups: any[]; total: number }> {
    const result = await this.groupRepository.getAllGroups(accountUuid, params);

    return {
      groups: result.groups.map((g: ReminderTemplateGroup) => g.toClient()),
      total: result.total,
    };
  }

  /**
   * 根据 UUID 获取分组
   */
  async getGroupByUuid(accountUuid: string, uuid: string): Promise<any | null> {
    const group = await this.groupRepository.getGroupByUuid(accountUuid, uuid);
    return group ? group.toClient() : null;
  }

  /**
   * 更新分组
   */
  async updateGroup(
    accountUuid: string,
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateGroupRequest,
  ): Promise<any> {
    const group = await this.groupRepository.getGroupByUuid(accountUuid, uuid);
    if (!group) {
      throw new Error(`Group ${uuid} not found`);
    }

    // TODO: 使用聚合根方法更新
    throw new Error('ReminderTemplateGroupDomainService.updateGroup not yet implemented');
  }

  /**
   * 删除分组
   */
  async deleteGroup(accountUuid: string, uuid: string): Promise<boolean> {
    return await this.groupRepository.deleteGroup(accountUuid, uuid);
  }

  /**
   * 更新分组排序
   */
  async updateGroupOrder(
    accountUuid: string,
    groupOrders: Array<{ uuid: string; order: number }>,
  ): Promise<boolean> {
    return await this.groupRepository.updateGroupOrder(accountUuid, groupOrders);
  }
}
