import { PrismaClient } from '@prisma/client';
import type { IReminderTemplateRepository } from '@dailyuse/domain-server';
import { ReminderTemplate, ReminderHistory } from '@dailyuse/domain-server';

/**
 * ReminderTemplate 聚合根 Prisma 仓储实现
 * 负责 ReminderTemplate 及其所有子实体的完整持久化
 *
 * 聚合根包含：
 * - ReminderTemplate (主实体)
 * - ReminderHistory[] (子实体集合)
 * - 值对象：trigger, recurrence, active_time, active_hours, notification_config, stats (JSON存储)
 */
export class PrismaReminderTemplateRepository implements IReminderTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any, includeHistory: boolean = false): ReminderTemplate {
    const template = ReminderTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.account_uuid,
      title: data.title,
      description: data.description,
      type: data.type,
      trigger: data.trigger,
      recurrence: data.recurrence,
      active_time: data.active_time,
      active_hours: data.active_hours,
      notification_config: data.notification_config,
      self_enabled: data.self_enabled,
      status: data.status,
      group_uuid: data.group_uuid,
      importance_level: data.importance_level,
      tags: data.tags,
      color: data.color,
      icon: data.icon,
      next_trigger_at: data.nextTriggerAt ? Number(data.nextTriggerAt) : null,
      stats: data.stats,
      created_at: Number(data.createdAt),
      updated_at: Number(data.updatedAt),
      deleted_at: data.deletedAt ? Number(data.deletedAt) : null,
    });

    if (includeHistory && data.history) {
      data.history.forEach((hist: any) => {
        template.addHistory(
          ReminderHistory.fromPersistenceDTO({
            uuid: hist.uuid,
            template_uuid: hist.template_uuid,
            trigger_time: Number(hist.triggerTime),
            result: hist.result,
            error: hist.error,
            notification_sent: hist.notificationSent,
            notification_channels: hist.notificationChannels,
            created_at: Number(hist.createdAt),
          }),
        );
      });
    }
    return template;
  }

  async save(template: ReminderTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();
    const data = {
      uuid: persistence.uuid,
      account_uuid: persistence.account_uuid,
      title: persistence.title,
      description: persistence.description,
      type: persistence.type,
      trigger: persistence.trigger,
      recurrence: persistence.recurrence,
      active_time: persistence.active_time,
      active_hours: persistence.active_hours,
      notification_config: persistence.notification_config,
      self_enabled: persistence.self_enabled,
      status: persistence.status,
      group_uuid: persistence.group_uuid,
      importance_level: persistence.importance_level,
      tags: persistence.tags,
      color: persistence.color,
      icon: persistence.icon,
      nextTriggerAt: persistence.next_trigger_at ? BigInt(persistence.next_trigger_at) : null,
      stats: persistence.stats,
      createdAt: BigInt(persistence.created_at),
      updatedAt: BigInt(persistence.updated_at),
      deletedAt: persistence.deleted_at ? BigInt(persistence.deleted_at) : null,
    };

    const historyData =
      template.history?.map((h) => {
        const histPersistence = h.toPersistenceDTO();
        return {
          uuid: histPersistence.uuid,
          template_uuid: histPersistence.template_uuid,
          triggerTime: BigInt(histPersistence.trigger_time),
          result: histPersistence.result,
          error: histPersistence.error,
          notificationSent: histPersistence.notification_sent,
          notificationChannels: histPersistence.notification_channels,
          createdAt: BigInt(histPersistence.created_at),
        };
      }) ?? [];

    await this.prisma.$transaction(async (tx) => {
      await tx.reminderTemplate.upsert({
        where: { uuid: data.uuid },
        create: data,
        update: {
          ...data,
          uuid: undefined,
          account_uuid: undefined,
          createdAt: undefined,
        },
      });

      if (historyData.length > 0) {
        await tx.reminderHistory.createMany({
          data: historyData,
          skipDuplicates: true,
        });
      }
    });
  }

  async findById(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    const data = await this.prisma.reminderTemplate.findUnique({
      where: { uuid },
      include: { history: options?.includeHistory ?? false },
    });
    return data ? this.mapToEntity(data, options?.includeHistory) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        account_uuid: accountUuid,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      include: { history: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async findByGroupUuid(
    groupUuid: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        group_uuid: groupUuid,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      include: { history: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async findActive(accountUuid?: string): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        account_uuid: accountUuid,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByNextTriggerBefore(
    beforeTime: number,
    accountUuid?: string,
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        account_uuid: accountUuid,
        status: 'ACTIVE',
        deletedAt: null,
        nextTriggerAt: { lte: BigInt(beforeTime) },
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByIds(
    uuids: string[],
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: { uuid: { in: uuids } },
      include: { history: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderHistory.deleteMany({ where: { template_uuid: uuid } });
    await this.prisma.reminderTemplate.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplate.count({ where: { uuid } });
    return count > 0;
  }

  async count(
    accountUuid: string,
    options?: { status?: ReminderContracts.ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    return this.prisma.reminderTemplate.count({
      where: {
        account_uuid: accountUuid,
        status: options?.status,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
    });
  }
}
