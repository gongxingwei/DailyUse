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
