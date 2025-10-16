import { PrismaClient } from '@prisma/client';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server';
import { ReminderStatistics } from '@dailyuse/domain-server';

/**
 * ReminderStatistics Prisma 仓储实现
 * 统计聚合根，使用 UPSERT 语义（accountUuid 唯一）
 * 每个账户只有一条统计记录
 */
export class PrismaReminderStatisticsRepository implements IReminderStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  async upsert(statistics: ReminderStatistics): Promise<void> {
    const persistence = statistics.toPersistenceDTO();

    await this.prisma.reminderStatistics.upsert({
      where: { accountUuid: persistence.account_uuid },
      create: {
        accountUuid: persistence.account_uuid,
        totalTemplates: persistence.total_templates,
        activeTemplates: persistence.active_templates,
        pausedTemplates: persistence.paused_templates,
        totalGroups: persistence.total_groups,
        totalTriggeredToday: persistence.total_triggered_today,
        totalTriggeredThisWeek: persistence.total_triggered_this_week,
        totalTriggeredThisMonth: persistence.total_triggered_this_month,
        totalTriggeredAllTime: persistence.total_triggered_all_time,
        successRate: persistence.success_rate,
        averageResponseTime: persistence.average_response_time,
        lastTriggeredAt: persistence.last_triggered_at,
        lastUpdatedAt: persistence.last_updated_at,
        createdAt: persistence.created_at,
      },
      update: {
        totalTemplates: persistence.total_templates,
        activeTemplates: persistence.active_templates,
        pausedTemplates: persistence.paused_templates,
        totalGroups: persistence.total_groups,
        totalTriggeredToday: persistence.total_triggered_today,
        totalTriggeredThisWeek: persistence.total_triggered_this_week,
        totalTriggeredThisMonth: persistence.total_triggered_this_month,
        totalTriggeredAllTime: persistence.total_triggered_all_time,
        successRate: persistence.success_rate,
        averageResponseTime: persistence.average_response_time,
        lastTriggeredAt: persistence.last_triggered_at,
        lastUpdatedAt: persistence.last_updated_at,
      },
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null> {
    const record = await this.prisma.reminderStatistics.findUnique({
      where: { accountUuid },
    });

    if (!record) {
      return null;
    }

    return ReminderStatistics.fromPersistenceDTO({
      id: record.id,
      account_uuid: record.accountUuid,
      total_templates: record.totalTemplates,
      active_templates: record.activeTemplates,
      paused_templates: record.pausedTemplates,
      total_groups: record.totalGroups,
      total_triggered_today: record.totalTriggeredToday,
      total_triggered_this_week: record.totalTriggeredThisWeek,
      total_triggered_this_month: record.totalTriggeredThisMonth,
      total_triggered_all_time: record.totalTriggeredAllTime,
      success_rate: record.successRate,
      average_response_time: record.averageResponseTime,
      last_triggered_at: record.lastTriggeredAt,
      last_updated_at: record.lastUpdatedAt,
      created_at: record.createdAt,
    });
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.reminderStatistics.delete({
      where: { accountUuid },
    });
  }

  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.reminderStatistics.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}
