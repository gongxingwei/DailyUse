import { PrismaClient } from '@prisma/client';
import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSettingServer } from '@dailyuse/domain-server';

/**
 * UserSetting Prisma 仓储实现
 * 负责 UserSetting 聚合根的持久化
 */
export class PrismaUserSettingRepository implements IUserSettingRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 UserSetting 聚合根
   */
  private mapToEntity(data: any): UserSettingServer {
    return UserSettingServer.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      preferences: data.preferences,
      theme: data.theme,
      language: data.language,
      timezone: data.timezone,
      notifications: data.notifications,
      privacy: data.privacy,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });
  }

  /**
   * 转换时间戳为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== IUserSettingRepository 接口实现 =====

  async save(userSetting: UserSettingServer): Promise<void> {
    const persistence = userSetting.toPersistenceDTO();

    await this.prisma.userSetting.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.account_uuid,
        preferences: persistence.preferences,
        theme: persistence.theme,
        language: persistence.language,
        timezone: persistence.timezone,
        notifications: persistence.notifications,
        privacy: persistence.privacy,
        createdAt: this.toDate(persistence.created_at) ?? new Date(),
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
      update: {
        preferences: persistence.preferences,
        theme: persistence.theme,
        language: persistence.language,
        timezone: persistence.timezone,
        notifications: persistence.notifications,
        privacy: persistence.privacy,
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
    });
  }

  async findById(uuid: string): Promise<UserSettingServer | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSettingServer | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { accountUuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findAll(): Promise<UserSettingServer[]> {
    const data = await this.prisma.userSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item) => this.mapToEntity(item));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.userSetting.delete({
      where: { uuid },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.userSetting.count({ where: { uuid } });
    return count > 0;
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.userSetting.count({ where: { accountUuid } });
    return count > 0;
  }

  async saveMany(userSettings: UserSettingServer[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const userSetting of userSettings) {
        const persistence = userSetting.toPersistenceDTO();
        await tx.userSetting.upsert({
          where: { uuid: persistence.uuid },
          create: {
            uuid: persistence.uuid,
            accountUuid: persistence.account_uuid,
            preferences: persistence.preferences,
            theme: persistence.theme,
            language: persistence.language,
            timezone: persistence.timezone,
            notifications: persistence.notifications,
            privacy: persistence.privacy,
            createdAt: this.toDate(persistence.created_at) ?? new Date(),
            updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          },
          update: {
            preferences: persistence.preferences,
            theme: persistence.theme,
            language: persistence.language,
            timezone: persistence.timezone,
            notifications: persistence.notifications,
            privacy: persistence.privacy,
            updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          },
        });
      }
    });
  }
}
