import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderDomainService } from '../../domain/services/ReminderDomainService';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type CreateReminderInstanceRequest = ReminderContracts.CreateReminderInstanceRequest;
type UpdateReminderInstanceRequest = ReminderContracts.UpdateReminderInstanceRequest;
type ReminderTemplateResponse = ReminderContracts.ReminderTemplateResponse;
type ReminderInstanceResponse = ReminderContracts.ReminderInstanceResponse;
type ReminderListResponse = ReminderContracts.ReminderListResponse;

export class ReminderApplicationService {
  private reminderDomainService: ReminderDomainService;

  constructor() {
    this.reminderDomainService = new ReminderDomainService();
  }

  // ========== 应用层协调逻辑 ==========

  /**
   * 创建提醒模板并执行应用层业务逻辑
   */
  async createTemplateWithValidation(
    request: CreateReminderTemplateRequest,
    accountUuid: string,
  ): Promise<ReminderTemplateResponse> {
    // 应用层验证
    if (!request.name?.trim()) {
      throw new Error('提醒模板名称不能为空');
    }

    if (!request.message?.trim()) {
      throw new Error('提醒消息不能为空');
    }

    // 调用领域服务
    const template = await this.reminderDomainService.createReminderTemplate(accountUuid, request);

    // 执行应用层后置处理（如发送事件、记录日志等）
    console.log(`Created reminder template: ${template.uuid} for account: ${accountUuid}`);

    const result = await this.reminderDomainService.getTemplateById(template.uuid);
    if (!result) {
      throw new Error('创建的模板无法找到');
    }

    return result;
  }

  /**
   * 更新提醒模板并执行应用层业务逻辑
   */
  async updateTemplateWithValidation(
    id: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateResponse> {
    // 应用层验证
    const existingTemplate = await this.reminderDomainService.getTemplateById(id);
    if (!existingTemplate) {
      throw new Error('提醒模板不存在');
    }

    // 调用领域服务
    const updatedTemplate = await this.reminderDomainService.updateTemplate(id, request);

    // 执行应用层后置处理
    console.log(`Updated reminder template: ${id}`);

    return updatedTemplate;
  }

  /**
   * 删除提醒模板并清理相关数据
   */
  async deleteTemplateWithCleanup(id: string): Promise<void> {
    // 检查是否可以删除
    const template = await this.reminderDomainService.getTemplateById(id);
    if (!template) {
      throw new Error('提醒模板不存在');
    }

    // TODO: 检查是否有依赖的实例

    // 调用领域服务
    await this.reminderDomainService.deleteTemplate(id);

    // 应用层清理逻辑
    console.log(`Deleted reminder template: ${id} and cleaned up related data`);
  }

  // ========== 直接委托给领域服务的方法 ==========

  // 提醒模板相关方法
  async createTemplate(request: CreateReminderTemplateRequest): Promise<ReminderTemplateResponse> {
    return this.reminderDomainService.createTemplate(request);
  }

  async getTemplates(queryParams: any): Promise<ReminderTemplateResponse[]> {
    return this.reminderDomainService.getTemplates(queryParams);
  }

  async getTemplateById(id: string): Promise<ReminderTemplateResponse | null> {
    return this.reminderDomainService.getTemplateById(id);
  }

  async updateTemplate(
    id: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateResponse> {
    return this.updateTemplateWithValidation(id, request);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.deleteTemplateWithCleanup(id);
  }

  async activateTemplate(id: string): Promise<ReminderTemplateResponse> {
    return this.reminderDomainService.activateTemplate(id);
  }

  async pauseTemplate(id: string): Promise<ReminderTemplateResponse> {
    return this.reminderDomainService.pauseTemplate(id);
  }

  // 提醒实例相关方法
  async createInstance(request: CreateReminderInstanceRequest): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.createInstance(request);
  }

  async getInstances(queryParams: any): Promise<ReminderListResponse> {
    return this.reminderDomainService.getInstances(queryParams);
  }

  async getInstanceById(id: string): Promise<ReminderInstanceResponse | null> {
    return this.reminderDomainService.getInstanceById(id);
  }

  async updateInstance(
    id: string,
    request: UpdateReminderInstanceRequest,
  ): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.updateInstance(id, request);
  }

  async deleteInstance(id: string): Promise<void> {
    return this.reminderDomainService.deleteInstance(id);
  }

  // 提醒操作方法
  async triggerReminder(id: string): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.triggerReminder(id);
  }

  async snoozeReminder(
    id: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.snoozeReminder(id, snoozeUntil, reason);
  }

  async dismissReminder(id: string): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.dismissReminder(id);
  }

  async acknowledgeReminder(id: string): Promise<ReminderInstanceResponse> {
    return this.reminderDomainService.acknowledgeReminder(id);
  }

  // 批量操作方法
  async batchDismissReminders(ids: string[]): Promise<void> {
    return this.reminderDomainService.batchDismissReminders(ids);
  }

  async batchSnoozeReminders(ids: string[], snoozeUntil: Date): Promise<void> {
    return this.reminderDomainService.batchSnoozeReminders(ids, snoozeUntil);
  }

  // 查询方法
  async getActiveReminders(accountUuid: string): Promise<ReminderListResponse> {
    return this.reminderDomainService.getActiveReminders(accountUuid);
  }

  async getPendingReminders(accountUuid: string): Promise<ReminderListResponse> {
    return this.reminderDomainService.getPendingReminders(accountUuid);
  }

  async getOverdueReminders(accountUuid: string): Promise<ReminderListResponse> {
    return this.reminderDomainService.getOverdueReminders(accountUuid);
  }

  async getUpcomingReminders(accountUuid: string, hours?: number): Promise<ReminderListResponse> {
    return this.reminderDomainService.getUpcomingReminders(accountUuid, hours);
  }

  async getReminderHistory(
    accountUuid: string,
    from?: Date,
    to?: Date,
  ): Promise<ReminderListResponse> {
    return this.reminderDomainService.getReminderHistory(accountUuid, from, to);
  }

  async searchReminders(queryParams: any): Promise<ReminderListResponse> {
    return this.reminderDomainService.searchReminders(queryParams);
  }

  // 统计方法
  async getReminderStats(queryParams: any): Promise<any> {
    return this.reminderDomainService.getReminderStats(queryParams);
  }

  // ===== 分组管理方法 =====

  /**
   * 创建提醒模板分组并执行应用层业务逻辑
   */
  async createReminderTemplateGroupWithValidation(accountUuid: string, request: any): Promise<any> {
    // 应用层业务逻辑：验证输入
    if (!request.name?.trim()) {
      throw new Error('分组名称不能为空');
    }

    if (request.name.length < 2) {
      throw new Error('分组名称至少需要2个字符');
    }

    return this.reminderDomainService.createReminderTemplateGroup(accountUuid, request);
  }

  /**
   * 更新提醒模板分组并执行应用层业务逻辑
   */
  async updateReminderTemplateGroupWithValidation(groupUuid: string, request: any): Promise<any> {
    // 应用层业务逻辑：验证输入
    if (request.name && !request.name.trim()) {
      throw new Error('分组名称不能为空');
    }

    if (request.name && request.name.length < 2) {
      throw new Error('分组名称至少需要2个字符');
    }

    return this.reminderDomainService.updateReminderTemplateGroup(groupUuid, request);
  }

  /**
   * 删除提醒模板分组并清理相关数据
   */
  async deleteReminderTemplateGroupWithCleanup(groupUuid: string): Promise<void> {
    // 应用层业务逻辑：检查是否有子分组或模板
    const group = await this.reminderDomainService.getReminderTemplateGroup(groupUuid);
    if (!group) {
      throw new Error('分组不存在');
    }

    // 如果有子分组，需要先处理
    if (group.children && group.children.length > 0) {
      throw new Error('请先删除子分组');
    }

    // 如果有模板，需要先处理
    if (group.templates && group.templates.length > 0) {
      throw new Error('请先删除或移动分组内的模板');
    }

    return this.reminderDomainService.deleteReminderTemplateGroup(groupUuid);
  }

  // ========== 直接委托给领域服务的分组方法 ==========

  async createReminderTemplateGroup(accountUuid: string, request: any): Promise<any> {
    return this.reminderDomainService.createReminderTemplateGroup(accountUuid, request);
  }

  async getReminderTemplateGroups(accountUuid: string): Promise<any[]> {
    return this.reminderDomainService.getReminderTemplateGroupsByAccount(accountUuid);
  }

  async getReminderTemplateGroupById(groupUuid: string): Promise<any | null> {
    return this.reminderDomainService.getReminderTemplateGroup(groupUuid);
  }

  async updateReminderTemplateGroup(groupUuid: string, request: any): Promise<any> {
    return this.reminderDomainService.updateReminderTemplateGroup(groupUuid, request);
  }

  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    return this.reminderDomainService.deleteReminderTemplateGroup(groupUuid);
  }

  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    return this.reminderDomainService.toggleReminderTemplateGroupEnabled(groupUuid, enabled);
  }
}
