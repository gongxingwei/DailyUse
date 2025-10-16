import { PrismaClient } from '@prisma/client';
import type { IAccountRepository } from '@dailyuse/domain-server';
import { Account } from '@dailyuse/domain-server';
import type { AccountContracts } from '@dailyuse/contracts';

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
    const profile = JSON.parse(data.profile);
    const preferences = JSON.parse(data.preferences);
    const subscriptionData = data.subscription ? JSON.parse(data.subscription) : null;
    const storage = JSON.parse(data.storage);
    const security = JSON.parse(data.security);
    const stats = JSON.parse(data.stats);

    const persistenceDTO: AccountContracts.AccountPersistenceDTO = {
      uuid: data.uuid,
      username: data.username,
      email: data.email,
      emailVerified: data.emailVerified,
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified,
      status: data.status,

      displayName: profile.displayName,
      avatar: profile.avatar,
      bio: profile.bio,
      location: profile.location,
      timezone: profile.timezone,
      language: profile.language,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,

      preferences: data.preferences,

      subscriptionId: subscriptionData?.uuid,
      subscriptionPlan: subscriptionData?.plan,
      subscriptionStatus: subscriptionData?.status,
      subscriptionStartDate: subscriptionData?.startDate,
      subscriptionEndDate: subscriptionData?.endDate,
      subscriptionRenewalDate: subscriptionData?.renewalDate,
      subscriptionAutoRenew: subscriptionData?.autoRenew,

      storageUsed: storage.used,
      storageQuota: storage.quota,
      storageQuotaType: storage.quotaType,

      twoFactorEnabled: security.twoFactorEnabled,
      lastPasswordChange: security.lastPasswordChange,
      loginAttempts: security.loginAttempts,
      lockedUntil: security.lockedUntil,

      history: data.history,

      statsTotalGoals: stats.totalGoals,
      statsTotalTasks: stats.totalTasks,
      statsTotalSchedules: stats.totalSchedules,
      statsTotalReminders: stats.totalReminders,
      statsLastLoginAt: stats.lastLoginAt,
      statsLoginCount: stats.loginCount,

      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      lastActiveAt: data.lastActiveAt?.getTime() ?? null,
      deletedAt: data.deletedAt?.getTime() ?? null,
    };

    return Account.fromPersistenceDTO(persistenceDTO);
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

    const data = {
      uuid: persistence.uuid,
      username: persistence.username,
      email: persistence.email,
      emailVerified: persistence.emailVerified,
      phoneNumber: persistence.phoneNumber,
      phoneVerified: persistence.phoneVerified,
      status: persistence.status,
      profile: JSON.stringify({
        displayName: persistence.displayName,
        avatar: persistence.avatar,
        bio: persistence.bio,
        location: persistence.location,
        timezone: persistence.timezone,
        language: persistence.language,
        dateOfBirth: persistence.dateOfBirth,
        gender: persistence.gender,
      }),
      preferences: persistence.preferences,
      subscription:
        persistence.subscriptionId || persistence.subscriptionPlan || persistence.subscriptionStatus
          ? JSON.stringify({
              uuid: persistence.subscriptionId,
              plan: persistence.subscriptionPlan,
              status: persistence.subscriptionStatus,
              startDate: persistence.subscriptionStartDate,
              endDate: persistence.subscriptionEndDate,
              renewalDate: persistence.subscriptionRenewalDate,
              autoRenew: persistence.subscriptionAutoRenew,
            })
          : null,
      storage: JSON.stringify({
        used: persistence.storageUsed,
        quota: persistence.storageQuota,
        quotaType: persistence.storageQuotaType,
      }),
      security: JSON.stringify({
        twoFactorEnabled: persistence.twoFactorEnabled,
        lastPasswordChange: persistence.lastPasswordChange,
        loginAttempts: persistence.loginAttempts,
        lockedUntil: persistence.lockedUntil,
      }),
      history: persistence.history,
      stats: JSON.stringify({
        totalGoals: persistence.statsTotalGoals,
        totalTasks: persistence.statsTotalTasks,
        totalSchedules: persistence.statsTotalSchedules,
        totalReminders: persistence.statsTotalReminders,
        lastLoginAt: persistence.statsLastLoginAt,
        loginCount: persistence.statsLoginCount,
      }),
      createdAt: this.toDate(persistence.createdAt) ?? new Date(),
      updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      lastActiveAt: this.toDate(persistence.lastActiveAt),
      deletedAt: this.toDate(persistence.deletedAt),
    };

    await this.prisma.account.upsert({
      where: { uuid: persistence.uuid },
      create: data,
      update: data,
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
