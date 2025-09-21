import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderDomainService } from '../../domain/services/ReminderDomainService';

type CreateReminderTemplateGroupRequest = ReminderContracts.CreateReminderTemplateGroupRequest;
type UpdateReminderTemplateGroupRequest = ReminderContracts.UpdateReminderTemplateGroupRequest;
type ReminderTemplateGroupResponse = ReminderContracts.ReminderTemplateGroupResponse;

/**
 * ReminderTemplateGroupApplicationService - 提醒模板分组应用服务
 * 专门处理 ReminderTemplateGroup 聚合根的应用层协调逻辑
 */
export class ReminderTemplateGroupApplicationService {
  private reminderDomainService: ReminderDomainService;

  constructor() {
    this.reminderDomainService = new ReminderDomainService();
  }

  // ========== ReminderTemplateGroup 聚合根专用方法 ==========

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(
    accountUuid: string,
    request: CreateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroupResponse> {
    return this.reminderDomainService.createReminderTemplateGroup(accountUuid, request);
  }

  /**
   * 获取账户的所有提醒模板分组
   */
  async getReminderTemplateGroups(accountUuid: string): Promise<ReminderTemplateGroupResponse[]> {
    return this.reminderDomainService.getReminderTemplateGroupsByAccount(accountUuid);
  }

  /**
   * 根据ID获取提醒模板分组
   */
  async getReminderTemplateGroupById(
    groupUuid: string,
  ): Promise<ReminderTemplateGroupResponse | null> {
    return this.reminderDomainService.getReminderTemplateGroup(groupUuid);
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(
    groupUuid: string,
    request: UpdateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroupResponse> {
    return this.reminderDomainService.updateReminderTemplateGroup(groupUuid, request);
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    return this.reminderDomainService.deleteReminderTemplateGroup(groupUuid);
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    return this.reminderDomainService.toggleReminderTemplateGroupEnabled(groupUuid, enabled);
  }

  // ========== 应用层协调逻辑 ==========

  /**
   * 带验证的更新分组
   */
  async updateReminderTemplateGroupWithValidation(
    groupUuid: string,
    request: UpdateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroupResponse> {
    // 应用层可以添加额外的验证逻辑
    // 比如检查权限、业务规则等

    // 获取现有分组确保存在
    const existingGroup = await this.getReminderTemplateGroupById(groupUuid);
    if (!existingGroup) {
      throw new Error('分组不存在');
    }

    // 执行更新
    return this.updateReminderTemplateGroup(groupUuid, request);
  }

  /**
   * 带清理的删除分组
   */
  async deleteReminderTemplateGroupWithCleanup(groupUuid: string): Promise<void> {
    // 应用层协调：删除分组时的清理逻辑
    // 比如处理子分组、关联模板等

    // 获取分组信息
    const group = await this.getReminderTemplateGroupById(groupUuid);
    if (!group) {
      throw new Error('分组不存在');
    }

    // 执行删除（领域服务会处理相关的业务逻辑）
    await this.deleteReminderTemplateGroup(groupUuid);
  }
}
