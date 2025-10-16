import { PrismaClient } from '@prisma/client';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { Account, Subscription, AccountHistory } from '@dailyuse/domain-server';

/**
 * Account 聚合根 Prisma 仓储实现
 * 负责 Account 及其所有子实体的完整持久化
 */
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 Account 聚合根实体
   */
  private mapAccountToEntity(data: any): Account {
    // 使用领域实体的 fromPersistenceDTO 方法创建实体
    const account = Account.fromPersistenceDTO({
      uuid: data.uuid,
      username: data.username,
      email: data.email,
      email_verified: data.emailVerified,
      phone_number: data.phoneNumber,
      phone_verified: data.phoneVerified,
      status: data.status,
      profile: data.profile,
      preferences: data.preferences,
      subscription: data.subscription,
      storage: data.storage,
      security: data.security,
      history: data.history,
      stats: data.stats,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      last_active_at: data.lastActiveAt?.getTime() ?? null,
      deleted_at: data.deletedAt?.getTime() ?? null,
    });

    return account;
  }

  /**
   * 转换时间戳为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== IAccountRepository 接口实现 =====

  async save(account: Account): Promise<void> {
    const persistence = account.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      // Upsert Account 主实体
      await tx.account.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          username: persistence.username,
          email: persistence.email,
          emailVerified: persistence.email_verified,
          phoneNumber: persistence.phone_number,
          phoneVerified: persistence.phone_verified,
          status: persistence.status,
          profile: persistence.profile,
          preferences: persistence.preferences,
          subscription: persistence.subscription,
          storage: persistence.storage,
          security: persistence.security,
          history: persistence.history,
          stats: persistence.stats,
          createdAt: this.toDate(persistence.created_at) ?? new Date(),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          lastActiveAt: this.toDate(persistence.last_active_at),
          deletedAt: this.toDate(persistence.deleted_at),
        },
        update: {
          username: persistence.username,
          email: persistence.email,
          emailVerified: persistence.email_verified,
          phoneNumber: persistence.phone_number,
          phoneVerified: persistence.phone_verified,
          status: persistence.status,
          profile: persistence.profile,
          preferences: persistence.preferences,
          subscription: persistence.subscription,
          storage: persistence.storage,
          security: persistence.security,
          history: persistence.history,
          stats: persistence.stats,
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          lastActiveAt: this.toDate(persistence.last_active_at),
          deletedAt: this.toDate(persistence.deleted_at),
        },
      });
    });
  }

  async findById(uuid: string): Promise<Account | null> {
    const data = await this.prisma.account.findUnique({
      where: { uuid },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByUsername(username: string): Promise<Account | null> {
    const data = await this.prisma.account.findUnique({
      where: { username },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const data = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByPhone(phoneNumber: string): Promise<Account | null> {
    const data = await this.prisma.account.findFirst({
      where: { phoneNumber },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { username },
    });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { email },
    });
    return count > 0;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.account.delete({
      where: { uuid },
    });
  }

  async findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }> {
    const where = options?.status ? { status: options.status } : {};
    const skip = options?.page && options?.pageSize ? (options.page - 1) * options.pageSize : 0;
    const take = options?.pageSize ?? 20;

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      accounts: accounts.map((data) => this.mapAccountToEntity(data)),
      total,
    };
  }
}
