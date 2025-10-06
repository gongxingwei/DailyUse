import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import { ReminderTemplateGroupDomainService } from '../../domain/services/ReminderTemplateGroupDomainService';
import type { IReminderTemplateGroupAggregateRepository } from '@dailyuse/domain-server';

type CreateReminderTemplateGroupRequest = ReminderContracts.CreateReminderTemplateGroupRequest;
type UpdateReminderTemplateGroupRequest = ReminderContracts.UpdateReminderTemplateGroupRequest;
type ReminderTemplateGroupResponse = ReminderContracts.ReminderTemplateGroupResponse;

/**
 * ReminderTemplateGroupApplicationService - 提醒模板分组应用服务
 * 专门处理 ReminderTemplateGroup 聚合根的应用层协调逻辑
 */
export class ReminderTemplateGroupApplicationService {
  private groupDomainService: ReminderTemplateGroupDomainService;
  private groupRepository: IReminderTemplateGroupAggregateRepository;

  constructor(groupRepository?: IReminderTemplateGroupAggregateRepository) {
    const container = ReminderContainer.getInstance();
    this.groupRepository =
      groupRepository || container.getReminderTemplateGroupAggregateRepository();
    this.groupDomainService = new ReminderTemplateGroupDomainService(this.groupRepository);
  }

  // ========== ReminderTemplateGroup 聚合根专用方法 ==========

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(
    accountUuid: string,
    request: CreateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroupResponse> {
    return this.groupDomainService.createGroup(accountUuid, request);
  }

  /**
   * 获取账户的所有提醒模板分组
   */
  async getReminderTemplateGroups(accountUuid: string): Promise<ReminderTemplateGroupResponse[]> {
    const result = await this.groupDomainService.getAllGroups(accountUuid);
    return result.groups;
  }

  /**
   * 根据ID获取提醒模板分组
   */
  async getReminderTemplateGroupById(
    groupUuid: string,
    accountUuid: string,
  ): Promise<ReminderTemplateGroupResponse | null> {
    return this.groupDomainService.getGroupByUuid(accountUuid, groupUuid);
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(
    groupUuid: string,
    accountUuid: string,
    request: UpdateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroupResponse> {
    return this.groupDomainService.updateGroup(accountUuid, groupUuid, request);
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string, accountUuid: string): Promise<void> {
    await this.groupDomainService.deleteGroup(accountUuid, groupUuid);
  }

  // TODO: 添加更多业务方法
}
