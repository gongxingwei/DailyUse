import { ReminderContracts } from '@dailyuse/contracts';
import type {
  IReminderTemplateGroupAggregateRepository,
  ReminderTemplateGroup,
} from '@dailyuse/domain-server';
import { eventBus } from '@dailyuse/utils';

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

  // ==================== 启用/禁用操作 ====================

  /**
   * 切换分组启用状态
   *
   * 业务逻辑：
   * 1. 如果是 GROUP 模式，切换组状态会影响所有模板
   * 2. 如果是 INDIVIDUAL 模式，仅切换组标识，不影响模板的 selfEnabled
   * 3. 发布领域事件由聚合根自动处理
   */
  async toggleGroupEnabled(accountUuid: string, uuid: string, enabled: boolean): Promise<any> {
    const group = await this.groupRepository.getGroupByUuid(accountUuid, uuid);
    if (!group) {
      throw new Error(`Group ${uuid} not found`);
    }

    // 记录所有模板的旧状态（用于事件发布）
    const templateOldStates = new Map(
      group.templates.map((t) => [t.uuid, { enabled: t.enabled, name: t.name }]),
    );

    // 调用聚合根方法（会自动发布领域事件并更新所有模板）
    group.toggleEnabled(enabled);

    // 持久化更新（包括组和所有模板）
    const updatedGroup = await this.groupRepository.saveGroup(accountUuid, group);

    // 🔥 手动发布每个受影响模板的状态变化事件
    if (group.enableMode === ReminderContracts.ReminderTemplateEnableMode.GROUP) {
      for (const template of updatedGroup.templates) {
        const oldState = templateOldStates.get(template.uuid);
        if (oldState && oldState.enabled !== template.enabled) {
          await eventBus.publish({
            eventType: 'ReminderTemplateStatusChanged',
            aggregateId: template.uuid,
            occurredOn: new Date(),
            payload: {
              templateUuid: template.uuid,
              templateName: template.name,
              oldEnabled: oldState.enabled,
              newEnabled: template.enabled,
              template: template.toClient(),
              accountUuid,
            },
          });
        }
      }
    }

    console.log(
      `✅ 分组 [${group.name}] ${enabled ? '已启用' : '已禁用'}，模式: ${group.enableMode}，影响模板数: ${group.templates.length}`,
    );

    return updatedGroup.toClient();
  }

  /**
   * 更新分组启用模式
   *
   * 业务逻辑：
   * 1. GROUP 模式：所有模板跟随组的启用状态
   * 2. INDIVIDUAL 模式：每个模板独立控制
   * 3. 切换到 GROUP 模式时，会同步所有模板的启用状态
   */
  async updateGroupEnableMode(
    accountUuid: string,
    uuid: string,
    enableMode: ReminderContracts.ReminderTemplateEnableMode,
  ): Promise<any> {
    const group = await this.groupRepository.getGroupByUuid(accountUuid, uuid);
    if (!group) {
      throw new Error(`Group ${uuid} not found`);
    }

    // 记录所有模板的旧状态
    const templateOldStates = new Map(
      group.templates.map((t) => [t.uuid, { enabled: t.enabled, name: t.name }]),
    );

    // 调用聚合根方法（会自动同步模板状态）
    group.updateEnableMode(enableMode);

    // 持久化更新
    const updatedGroup = await this.groupRepository.saveGroup(accountUuid, group);

    // 🔥 手动发布每个受影响模板的状态变化事件
    for (const template of updatedGroup.templates) {
      const oldState = templateOldStates.get(template.uuid);
      if (oldState && oldState.enabled !== template.enabled) {
        await eventBus.publish({
          eventType: 'ReminderTemplateStatusChanged',
          aggregateId: template.uuid,
          occurredOn: new Date(),
          payload: {
            templateUuid: template.uuid,
            templateName: template.name,
            oldEnabled: oldState.enabled,
            newEnabled: template.enabled,
            template: template.toClient(),
            accountUuid,
          },
        });
      }
    }

    console.log(
      `✅ 分组 [${group.name}] 启用模式已切换为: ${enableMode}，影响模板数: ${group.templates.length}`,
    );

    return updatedGroup.toClient();
  }
}
