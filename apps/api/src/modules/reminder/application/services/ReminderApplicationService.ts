import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderDomainService } from '../../domain/index.js';

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
    return this.reminderDomainService.updateTemplate(id, request);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.reminderDomainService.deleteTemplate(id);
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
}
