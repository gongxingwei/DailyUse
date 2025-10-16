import type { ReminderTemplate, IReminderTemplateRepository } from '@dailyuse/domain-server';
import type { ReminderContracts } from '@dailyuse/contracts';

/**
 * Prisma ReminderTemplate 仓储实现（Stub）
 *
 * TODO: 需要实现完整的数据库操作逻辑
 */
export class PrismaReminderTemplateRepository implements IReminderTemplateRepository {
  async save(template: ReminderTemplate): Promise<void> {
    throw new Error(
      'PrismaReminderTemplateRepository.save() not implemented - Prisma schema required',
    );
  }

  async findById(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    throw new Error(
      'PrismaReminderTemplateRepository.findById() not implemented - Prisma schema required',
    );
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    throw new Error(
      'PrismaReminderTemplateRepository.findByAccountUuid() not implemented - Prisma schema required',
    );
  }

  async findByGroupUuid(
    groupUuid: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    throw new Error(
      'PrismaReminderTemplateRepository.findByGroupUuid() not implemented - Prisma schema required',
    );
  }

  async findActive(accountUuid?: string): Promise<ReminderTemplate[]> {
    throw new Error(
      'PrismaReminderTemplateRepository.findActive() not implemented - Prisma schema required',
    );
  }

  async findByNextTriggerBefore(
    beforeTime: number,
    accountUuid?: string,
  ): Promise<ReminderTemplate[]> {
    throw new Error(
      'PrismaReminderTemplateRepository.findByNextTriggerBefore() not implemented - Prisma schema required',
    );
  }

  async findByIds(
    uuids: string[],
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate[]> {
    throw new Error(
      'PrismaReminderTemplateRepository.findByIds() not implemented - Prisma schema required',
    );
  }

  async delete(uuid: string): Promise<void> {
    throw new Error(
      'PrismaReminderTemplateRepository.delete() not implemented - Prisma schema required',
    );
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error(
      'PrismaReminderTemplateRepository.exists() not implemented - Prisma schema required',
    );
  }

  async count(
    accountUuid: string,
    options?: { status?: ReminderContracts.ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    throw new Error(
      'PrismaReminderTemplateRepository.count() not implemented - Prisma schema required',
    );
  }
}
