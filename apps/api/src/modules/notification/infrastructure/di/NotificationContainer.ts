import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server';
import { PrismaNotificationRepository } from '../repositories/PrismaNotificationRepository';
import { PrismaNotificationTemplateRepository } from '../repositories/PrismaNotificationTemplateRepository';
import { PrismaNotificationPreferenceRepository } from '../repositories/PrismaNotificationPreferenceRepository';
import prisma from '../../../../shared/db/prisma';

/**
 * Notification 依赖注入容器
 */
export class NotificationContainer {
  private static notificationRepository: INotificationRepository | null = null;
  private static templateRepository: INotificationTemplateRepository | null = null;
  private static preferenceRepository: INotificationPreferenceRepository | null = null;

  static getNotificationRepository(): INotificationRepository {
    if (!NotificationContainer.notificationRepository) {
      NotificationContainer.notificationRepository = new PrismaNotificationRepository(prisma);
    }
    return NotificationContainer.notificationRepository;
  }

  static getNotificationTemplateRepository(): INotificationTemplateRepository {
    if (!NotificationContainer.templateRepository) {
      NotificationContainer.templateRepository = new PrismaNotificationTemplateRepository(prisma);
    }
    return NotificationContainer.templateRepository;
  }

  static getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    if (!NotificationContainer.preferenceRepository) {
      NotificationContainer.preferenceRepository = new PrismaNotificationPreferenceRepository(
        prisma,
      );
    }
    return NotificationContainer.preferenceRepository;
  }

  // For testing purposes
  static setNotificationRepository(repository: INotificationRepository): void {
    NotificationContainer.notificationRepository = repository;
  }

  static setNotificationTemplateRepository(repository: INotificationTemplateRepository): void {
    NotificationContainer.templateRepository = repository;
  }

  static setNotificationPreferenceRepository(repository: INotificationPreferenceRepository): void {
    NotificationContainer.preferenceRepository = repository;
  }

  static reset(): void {
    NotificationContainer.notificationRepository = null;
    NotificationContainer.templateRepository = null;
    NotificationContainer.preferenceRepository = null;
  }
}
