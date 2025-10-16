import { PrismaClient } from '@prisma/client';
import type { INotificationTemplateRepository } from '@dailyuse/domain-server';
import { NotificationTemplate } from '@dailyuse/domain-server';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationType = NotificationContracts.NotificationType;

/**
 * NotificationTemplate Prisma 仓储实现
 * 简单聚合根，无子实体
 * JSON 字段：variables, default_actions
 */
export class PrismaNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): NotificationTemplate {
    return NotificationTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      name: data.name,
      display_name: data.displayName,
      description: data.description,
      category: data.category,
      type: data.type,
      title_template: data.titleTemplate,
      content_template: data.contentTemplate,
      variables: data.variables,
      default_actions: data.defaultActions,
      is_system: data.isSystem,
      is_active: data.isActive,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(template: NotificationTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();

    await this.prisma.notificationTemplate.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        name: persistence.name,
        displayName: persistence.display_name,
        description: persistence.description,
        category: persistence.category,
        type: persistence.type,
        titleTemplate: persistence.title_template,
        contentTemplate: persistence.content_template,
        variables: persistence.variables,
        defaultActions: persistence.default_actions,
        isSystem: persistence.is_system,
        isActive: persistence.is_active,
        createdAt: this.toDate(persistence.created_at) ?? new Date(),
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
      update: {
        displayName: persistence.display_name,
        description: persistence.description,
        category: persistence.category,
        type: persistence.type,
        titleTemplate: persistence.title_template,
        contentTemplate: persistence.content_template,
        variables: persistence.variables,
        defaultActions: persistence.default_actions,
        isActive: persistence.is_active,
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
    });
  }

  async findById(uuid: string): Promise<NotificationTemplate | null> {
    const data = await this.prisma.notificationTemplate.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    const where = options?.includeInactive ? {} : { isActive: true };
    const templates = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const data = await this.prisma.notificationTemplate.findUnique({ where: { name } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const where: any = { category };
    if (options?.activeOnly) where.isActive = true;

    const templates = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const where: any = { type };
    if (options?.activeOnly) where.isActive = true;

    const templates = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { isSystem: true, isActive: true },
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notificationTemplate.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({ where: { uuid } });
    return count > 0;
  }

  async isNameUsed(name: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({
      where: {
        name,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
    return count > 0;
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const where = options?.activeOnly ? { isActive: true } : {};
    return await this.prisma.notificationTemplate.count({ where });
  }
}
