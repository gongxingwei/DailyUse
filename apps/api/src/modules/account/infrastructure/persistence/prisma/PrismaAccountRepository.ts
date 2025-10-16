import type { Account, IAccountRepository } from '@dailyuse/domain-server';

/**
 * Prisma Account 仓储实现（Stub）
 *
 * TODO: 需要实现完整的数据库操作逻辑
 */
export class PrismaAccountRepository implements IAccountRepository {
  async save(account: Account): Promise<void> {
    throw new Error('PrismaAccountRepository.save() not implemented - Prisma schema required');
  }

  async findById(uuid: string): Promise<Account | null> {
    throw new Error('PrismaAccountRepository.findById() not implemented - Prisma schema required');
  }

  async findByUsername(username: string): Promise<Account | null> {
    throw new Error(
      'PrismaAccountRepository.findByUsername() not implemented - Prisma schema required',
    );
  }

  async findByEmail(email: string): Promise<Account | null> {
    throw new Error(
      'PrismaAccountRepository.findByEmail() not implemented - Prisma schema required',
    );
  }

  async findByPhone(phoneNumber: string): Promise<Account | null> {
    throw new Error(
      'PrismaAccountRepository.findByPhone() not implemented - Prisma schema required',
    );
  }

  async existsByUsername(username: string): Promise<boolean> {
    throw new Error(
      'PrismaAccountRepository.existsByUsername() not implemented - Prisma schema required',
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    throw new Error(
      'PrismaAccountRepository.existsByEmail() not implemented - Prisma schema required',
    );
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('PrismaAccountRepository.delete() not implemented - Prisma schema required');
  }

  async findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }> {
    throw new Error('PrismaAccountRepository.findAll() not implemented - Prisma schema required');
  }
}
