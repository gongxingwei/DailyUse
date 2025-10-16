import type { ReminderStatistics, IReminderStatisticsRepository } from '@dailyuse/domain-server';

/**
 * Prisma ReminderStatistics 仓储实现（Stub）
 *
 * TODO: 需要实现完整的数据库操作逻辑
 */
export class PrismaReminderStatisticsRepository implements IReminderStatisticsRepository {
  async save(statistics: ReminderStatistics): Promise<void> {
    throw new Error(
      'PrismaReminderStatisticsRepository.save() not implemented - Prisma schema required',
    );
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null> {
    throw new Error(
      'PrismaReminderStatisticsRepository.findByAccountUuid() not implemented - Prisma schema required',
    );
  }

  async findOrCreate(accountUuid: string): Promise<ReminderStatistics> {
    throw new Error(
      'PrismaReminderStatisticsRepository.findOrCreate() not implemented - Prisma schema required',
    );
  }

  async delete(accountUuid: string): Promise<void> {
    throw new Error(
      'PrismaReminderStatisticsRepository.delete() not implemented - Prisma schema required',
    );
  }

  async exists(accountUuid: string): Promise<boolean> {
    throw new Error(
      'PrismaReminderStatisticsRepository.exists() not implemented - Prisma schema required',
    );
  }
}
