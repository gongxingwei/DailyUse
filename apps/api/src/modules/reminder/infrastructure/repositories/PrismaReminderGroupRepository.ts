import { PrismaClient } from '@prisma/client';
import type { IReminderGroupRepository } from '@dailyuse/domain-server';
import { ReminderGroup } from '@dailyuse/domain-server';

/**
 * ReminderGroup Prisma 仓储实现
 * 简单聚合根，无子实体
 * JSON 字段：stats, tags, color_config
 */
export class PrismaReminderGroupRepository implements IReminderGroupRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      sort_order: data.sortOrder,
      stats: data.stats,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      deleted_at: data.deletedAt?.getTime() ?? null,
    });
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(group: ReminderGroup): Promise<void> {
    const persistence = group.toPersistenceDTO();

    await this.prisma.reminderGroup.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.account_uuid,
        name: persistence.name,
        description: persistence.description,
        color: persistence.color,
        icon: persistence.icon,
        sortOrder: persistence.sort_order,
        stats: persistence.stats,
        createdAt: this.toDate(persistence.created_at) ?? new Date(),
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
        deletedAt: this.toDate(persistence.deleted_at),
      },
      update: {
        name: persistence.name,
        description: persistence.description,
        color: persistence.color,
        icon: persistence.icon,
        sortOrder: persistence.sort_order,
        stats: persistence.stats,
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
        deletedAt: this.toDate(persistence.deleted_at),
      },
    });
  }

  async findById(uuid: string): Promise<ReminderGroup | null> {
    const data = await this.prisma.reminderGroup.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderGroup[]> {
    const groups = await this.prisma.reminderGroup.findMany({
      where: { accountUuid, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    return groups.map((g) => this.mapToEntity(g));
  }

  async findByName(accountUuid: string, name: string): Promise<ReminderGroup | null> {
    const data = await this.prisma.reminderGroup.findFirst({
      where: { accountUuid, name, deletedAt: null },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderGroup.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.reminderGroup.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderGroup.count({ where: { uuid } });
    return count > 0;
  }

  async isNameUsed(accountUuid: string, name: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.reminderGroup.count({
      where: {
        accountUuid,
        name,
        deletedAt: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
    return count > 0;
  }

  async count(accountUuid: string): Promise<number> {
    return await this.prisma.reminderGroup.count({
      where: { accountUuid, deletedAt: null },
    });
  }
}
