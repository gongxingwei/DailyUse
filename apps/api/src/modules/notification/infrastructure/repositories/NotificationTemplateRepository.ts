/**
 * NotificationTemplate Repository Implementation
 * @description Prisma 实现的通知模板仓储
 * @author DailyUse Team
 * @date 2025-01-07
 */

import type { PrismaClient } from '@prisma/client';
import type {
  INotificationTemplateRepository,
  TemplateQueryOptions,
} from '../../domain/repositories/INotificationTemplateRepository';
import { NotificationTemplate } from '../../domain/aggregates/NotificationTemplate';
import { NotificationAction } from '../../domain/value-objects/NotificationAction';
import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationTemplateRepository');

/**
 * NotificationTemplate 仓储实现
 */
export class NotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存模板（创建或更新）
   */
  async save(template: NotificationTemplate): Promise<NotificationTemplate> {
    logger.debug('Saving notification template', { templateId: template.uuid });

    const plainObj = template.toPlainObject();

    const data = {
      uuid: plainObj.uuid,
      name: plainObj.name,
      type: plainObj.type,
      titleTemplate: plainObj.titleTemplate,
      contentTemplate: plainObj.contentTemplate,
      icon: plainObj.icon,
      defaultPriority: plainObj.defaultPriority,
      defaultChannels: JSON.stringify(plainObj.defaultChannels),
      defaultActions: plainObj.defaultActions ? JSON.stringify(plainObj.defaultActions) : undefined,
      variables: JSON.stringify(plainObj.variables),
      enabled: plainObj.enabled,
      createdAt: plainObj.createdAt,
      updatedAt: new Date(),
    };

    const savedTemplate = await this.prisma.notificationTemplate.upsert({
      where: { uuid: template.uuid },
      create: data,
      update: data,
    });

    logger.info('Notification template saved', { templateId: template.uuid });

    return this.toDomain(savedTemplate);
  }

  /**
   * 根据 UUID 查找模板
   */
  async findByUuid(uuid: string): Promise<NotificationTemplate | null> {
    logger.debug('Finding template by UUID', { uuid });

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { uuid },
    });

    if (!template) {
      logger.debug('Template not found', { uuid });
      return null;
    }

    return this.toDomain(template);
  }

  /**
   * 根据名称查找模板
   */
  async findByName(name: string): Promise<NotificationTemplate | null> {
    logger.debug('Finding template by name', { name });

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      logger.debug('Template not found', { name });
      return null;
    }

    return this.toDomain(template);
  }

  /**
   * 根据类型查找模板
   */
  async findByType(type: NotificationType): Promise<NotificationTemplate[]> {
    logger.debug('Finding templates by type', { type });

    const templates = await this.prisma.notificationTemplate.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    logger.debug('Templates found', { type, count: templates.length });

    return templates.map((t) => this.toDomain(t));
  }

  /**
   * 查询模板
   */
  async query(options: TemplateQueryOptions): Promise<{
    templates: NotificationTemplate[];
    total: number;
  }> {
    logger.debug('Querying templates', { options });

    const where: any = {};

    if (options.type) {
      where.type = options.type;
    }

    if (options.enabled !== undefined) {
      where.enabled = options.enabled;
    }

    if (options.nameContains) {
      where.name = {
        contains: options.nameContains,
        mode: 'insensitive',
      };
    }

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: options.offset || 0,
        take: options.limit || 50,
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    logger.debug('Templates queried', { total, returned: templates.length });

    return {
      templates: templates.map((t) => this.toDomain(t)),
      total,
    };
  }

  /**
   * 获取所有启用的模板
   */
  async findAllEnabled(): Promise<NotificationTemplate[]> {
    logger.debug('Finding all enabled templates');

    const templates = await this.prisma.notificationTemplate.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' },
    });

    logger.debug('Enabled templates found', { count: templates.length });

    return templates.map((t) => this.toDomain(t));
  }

  /**
   * 检查模板名称是否已存在
   */
  async existsByName(name: string, excludeUuid?: string): Promise<boolean> {
    logger.debug('Checking if template name exists', { name, excludeUuid });

    const where: any = { name };

    if (excludeUuid) {
      where.uuid = {
        not: excludeUuid,
      };
    }

    const count = await this.prisma.notificationTemplate.count({ where });

    const exists = count > 0;

    logger.debug('Template name existence check', { name, exists });

    return exists;
  }

  /**
   * 删除模板
   */
  async delete(uuid: string): Promise<void> {
    logger.info('Deleting notification template', { uuid });

    await this.prisma.notificationTemplate.delete({
      where: { uuid },
    });

    logger.info('Notification template deleted', { uuid });
  }

  /**
   * Prisma → Domain
   */
  private toDomain(prismaTemplate: any): NotificationTemplate {
    const defaultChannels = JSON.parse(prismaTemplate.defaultChannels || '[]');
    const variables = JSON.parse(prismaTemplate.variables || '[]');
    const defaultActions = prismaTemplate.defaultActions
      ? JSON.parse(prismaTemplate.defaultActions).map((a: any) => NotificationAction.create(a))
      : undefined;

    return NotificationTemplate.fromPersistence({
      uuid: prismaTemplate.uuid,
      name: prismaTemplate.name,
      type: prismaTemplate.type as NotificationType,
      titleTemplate: prismaTemplate.titleTemplate,
      contentTemplate: prismaTemplate.contentTemplate,
      defaultPriority: prismaTemplate.defaultPriority as NotificationPriority,
      defaultChannels: defaultChannels as NotificationChannel[],
      variables,
      icon: prismaTemplate.icon || undefined,
      defaultActions,
      enabled: prismaTemplate.enabled,
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt,
    });
  }
}
