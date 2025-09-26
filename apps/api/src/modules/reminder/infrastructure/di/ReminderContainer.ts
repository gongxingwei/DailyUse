import { ReminderDomainService } from '../../domain/services/ReminderDomainService';

export class ReminderContainer {
  private static instance: ReminderContainer;
  private reminderDomainService?: ReminderDomainService;

  private constructor() {}

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  /**
   * 获取 Reminder 领域服务实例
   */
  async getReminderDomainService(): Promise<ReminderDomainService> {
    if (!this.reminderDomainService) {
      this.reminderDomainService = new ReminderDomainService();
    }
    return this.reminderDomainService;
  }

  // 用于测试时替换实现
  setReminderDomainService(service: ReminderDomainService): void {
    this.reminderDomainService = service;
  }
}
