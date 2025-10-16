import type { ReminderGroup, IReminderGroupRepository } from '@dailyuse/domain-server';
import type { ReminderContracts } from '@dailyuse/contracts';

/**
 * Prisma ReminderGroup 仓储实现（Stub）
 *
 * TODO: 需要实现完整的数据库操作逻辑
 */
export class PrismaReminderGroupRepository implements IReminderGroupRepository {
  async save(group: ReminderGroup): Promise<void> {
    throw new Error(
      'PrismaReminderGroupRepository.save() not implemented - Prisma schema required',
    );
  }

  async findById(uuid: string): Promise<ReminderGroup | null> {
    throw new Error(
      'PrismaReminderGroupRepository.findById() not implemented - Prisma schema required',
    );
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    throw new Error(
      'PrismaReminderGroupRepository.findByAccountUuid() not implemented - Prisma schema required',
    );
  }

  async findByControlMode(
    accountUuid: string,
    controlMode: ReminderContracts.ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    throw new Error(
      'PrismaReminderGroupRepository.findByControlMode() not implemented - Prisma schema required',
    );
  }

  async findActive(accountUuid?: string): Promise<ReminderGroup[]> {
    throw new Error(
      'PrismaReminderGroupRepository.findActive() not implemented - Prisma schema required',
    );
  }

  async findByIds(uuids: string[]): Promise<ReminderGroup[]> {
    throw new Error(
      'PrismaReminderGroupRepository.findByIds() not implemented - Prisma schema required',
    );
  }

  async findByName(
    accountUuid: string,
    name: string,
    excludeUuid?: string,
  ): Promise<ReminderGroup | null> {
    throw new Error(
      'PrismaReminderGroupRepository.findByName() not implemented - Prisma schema required',
    );
  }

  async delete(uuid: string): Promise<void> {
    throw new Error(
      'PrismaReminderGroupRepository.delete() not implemented - Prisma schema required',
    );
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error(
      'PrismaReminderGroupRepository.exists() not implemented - Prisma schema required',
    );
  }

  async count(
    accountUuid: string,
    options?: { controlMode?: ReminderContracts.ControlMode; includeDeleted?: boolean },
  ): Promise<number> {
    throw new Error(
      'PrismaReminderGroupRepository.count() not implemented - Prisma schema required',
    );
  }
}
