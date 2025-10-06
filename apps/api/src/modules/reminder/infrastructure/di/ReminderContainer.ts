import type {
  IReminderTemplateAggregateRepository,
  IReminderTemplateGroupAggregateRepository,
} from '@dailyuse/domain-server';
import { PrismaReminderTemplateAggregateRepository } from '../repositories/PrismaReminderTemplateAggregateRepository';
import { PrismaReminderTemplateGroupAggregateRepository } from '../repositories/PrismaReminderTemplateGroupAggregateRepository';
import { prisma } from '@/config/prisma';

/**
 * Reminder 模块 DI 容器
 * 按聚合根提供独立的仓储实例
 */
export class ReminderContainer {
  private static instance: ReminderContainer;
  private reminderTemplateRepository: IReminderTemplateAggregateRepository | null = null;
  private reminderTemplateGroupRepository: IReminderTemplateGroupAggregateRepository | null = null;

  private constructor() {}

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  /**
   * 获取 ReminderTemplate 聚合根仓储
   */
  getReminderTemplateAggregateRepository(): IReminderTemplateAggregateRepository {
    if (!this.reminderTemplateRepository) {
      this.reminderTemplateRepository = new PrismaReminderTemplateAggregateRepository(prisma);
    }
    return this.reminderTemplateRepository;
  }

  /**
   * 获取 ReminderTemplateGroup 聚合根仓储
   */
  getReminderTemplateGroupAggregateRepository(): IReminderTemplateGroupAggregateRepository {
    if (!this.reminderTemplateGroupRepository) {
      this.reminderTemplateGroupRepository = new PrismaReminderTemplateGroupAggregateRepository(
        prisma,
      );
    }
    return this.reminderTemplateGroupRepository;
  }

  // 用于测试时替换实现
  setReminderTemplateAggregateRepository(repository: IReminderTemplateAggregateRepository): void {
    this.reminderTemplateRepository = repository;
  }

  setReminderTemplateGroupAggregateRepository(
    repository: IReminderTemplateGroupAggregateRepository,
  ): void {
    this.reminderTemplateGroupRepository = repository;
  }
}
