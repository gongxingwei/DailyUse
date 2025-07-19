import type { IReminderTemplateRepository } from '../../domain/repositories/iReminderTemplateRepository';
import type { IReminderTemplateGroupRepository } from '../../domain/repositories/iReminderTemplateGroupRepository';
import { SqliteReminderRepository } from '../repositories/sqliteReminderRepository';
import { SqliteReminderTemplateGroupRepository } from '../repositories/sqliteReminderTemplateGroupRepository';

export class ReminderContainer {
  private static instance: ReminderContainer;
  private ReminderTemplateRepository: IReminderTemplateRepository;
  private ReminderTemplateGroupRepository: IReminderTemplateGroupRepository;
  private constructor() {
    this.ReminderTemplateRepository = new SqliteReminderRepository();
    this.ReminderTemplateGroupRepository = new SqliteReminderTemplateGroupRepository();
  }

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  setCurrentAccountUuid(accountUuid: string): void {
    // 设置当前账号 UUID 的逻辑
    // 这里可以调用相关的仓库方法来设置当前账号
    this.ReminderTemplateRepository.setCurrentAccountUuid(accountUuid);
    this.ReminderTemplateGroupRepository.setCurrentAccountUuid(accountUuid);
  }

  getReminderTemplateRepository(): IReminderTemplateRepository {
    return this.ReminderTemplateRepository;
  }

  getReminderTemplateGroupRepository(): IReminderTemplateGroupRepository {
    return this.ReminderTemplateGroupRepository;
  }
  
  // 用于测试时替换实现
  setReminderTemplateRepository(repository: IReminderTemplateRepository): void {
    this.ReminderTemplateRepository = repository;
  }

  setReminderTemplateGroupRepository(repository: IReminderTemplateGroupRepository): void {
    this.ReminderTemplateGroupRepository = repository;
  }
}

export const reminderContainer = ReminderContainer.getInstance();