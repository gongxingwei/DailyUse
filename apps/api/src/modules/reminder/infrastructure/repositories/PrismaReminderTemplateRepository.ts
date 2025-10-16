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

  private mapToEntity(data: any): ReminderTemplate {
    const template = ReminderTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      title: data.title,
      description: data.description,
      type: data.type,
      trigger: data.trigger,
      recurrence: data.recurrence,
      active_time: data.activeTime,
      active_hours: data.activeHours,
      notification_config: data.notificationConfig,
      self_enabled: data.selfEnabled,
      status: data.status,
      group_uuid: data.groupUuid,
      importance_level: data.importanceLevel,
      tags: data.tags,
      color: data.color,
      icon: data.icon,
      next_trigger_at: data.nextTriggerAt?.getTime() ?? null,
      stats: data.stats,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      deleted_at: data.deletedAt?.getTime() ?? null,
    });

    // 加载 ReminderHistory 子实体
    if (data.history) {
      data.history.forEach((hist: any) => {
        const histEntity = ReminderHistory.fromPersistenceDTO({
          uuid: hist.uuid,
          template_uuid: hist.templateUuid,
          trigger_time: hist.triggerTime.getTime(),
          result: hist.result,
          error_message: hist.errorMessage,
          metadata: hist.metadata,
          created_at: hist.createdAt.getTime(),
        });
        template.addHistory(histEntity);
      });
    }

    return template;
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(template: ReminderTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert ReminderTemplate 主实体
      await tx.reminderTemplate.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid: persistence.account_uuid,
          title: persistence.title,
          description: persistence.description,
          type: persistence.type,
          trigger: persistence.trigger,
          recurrence: persistence.recurrence,
          activeTime: persistence.active_time,
          activeHours: persistence.active_hours,
          notificationConfig: persistence.notification_config,
          selfEnabled: persistence.self_enabled,
          status: persistence.status,
          groupUuid: persistence.group_uuid,
          importanceLevel: persistence.importance_level,
          tags: persistence.tags,
          color: persistence.color,
          icon: persistence.icon,
          nextTriggerAt: this.toDate(persistence.next_trigger_at),
          stats: persistence.stats,
          createdAt: this.toDate(persistence.created_at) ?? new Date(),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          deletedAt: this.toDate(persistence.deleted_at),
        },
        update: {
          title: persistence.title,
          description: persistence.description,
          type: persistence.type,
          trigger: persistence.trigger,
          recurrence: persistence.recurrence,
          activeTime: persistence.active_time,
          activeHours: persistence.active_hours,
          notificationConfig: persistence.notification_config,
          selfEnabled: persistence.self_enabled,
          status: persistence.status,
          groupUuid: persistence.group_uuid,
          importanceLevel: persistence.importance_level,
          tags: persistence.tags,
          color: persistence.color,
          icon: persistence.icon,
          nextTriggerAt: this.toDate(persistence.next_trigger_at),
          stats: persistence.stats,
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          deletedAt: this.toDate(persistence.deleted_at),
        },
      });

      // 2. Upsert ReminderHistory 子实体
      const history = template.getHistory();
      for (const hist of history) {
        const histPersistence = hist.toPersistenceDTO();
        await tx.reminderHistory.upsert({
          where: { uuid: histPersistence.uuid },
          create: {
            uuid: histPersistence.uuid,
            templateUuid: persistence.uuid,
            triggerTime: this.toDate(histPersistence.trigger_time) ?? new Date(),
            result: histPersistence.result,
            errorMessage: histPersistence.error_message,
            metadata: histPersistence.metadata,
            createdAt: this.toDate(histPersistence.created_at) ?? new Date(),
          },
          update: {
            result: histPersistence.result,
            errorMessage: histPersistence.error_message,
            metadata: histPersistence.metadata,
          },
        });
      }
    });
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<ReminderTemplate | null> {
    const data = await this.prisma.reminderTemplate.findUnique({
      where: { uuid },
      include: options?.includeChildren ? { history: true } : undefined,
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string, options?: { includeChildren?: boolean }): Promise<ReminderTemplate[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: { accountUuid, deletedAt: null },
      include: options?.includeChildren ? { history: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByGroupUuid(groupUuid: string): Promise<ReminderTemplate[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: { groupUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findDueReminders(beforeTime: Date, limit?: number): Promise<ReminderTemplate[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: {
        selfEnabled: true,
        status: 'ACTIVE',
        nextTriggerAt: { lte: beforeTime },
        deletedAt: null,
      },
      take: limit,
      orderBy: { nextTriggerAt: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByStatus(accountUuid: string, status: string): Promise<ReminderTemplate[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: { accountUuid, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findEnabled(accountUuid: string): Promise<ReminderTemplate[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid,
        selfEnabled: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { nextTriggerAt: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.reminderHistory.deleteMany({ where: { templateUuid: uuid } });
      await tx.reminderTemplate.delete({ where: { uuid } });
    });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.reminderTemplate.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplate.count({ where: { uuid } });
    return count > 0;
  }

  async count(accountUuid: string): Promise<number> {
    return await this.prisma.reminderTemplate.count({
      where: { accountUuid, deletedAt: null },
    });
  }

  async saveMany(templates: ReminderTemplate[]): Promise<void> {
    for (const template of templates) {
      await this.save(template);
    }
  }
}
