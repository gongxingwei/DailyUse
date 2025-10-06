/**
 * PrismaUserPreferencesRepository
 * Prisma 用户偏好仓储实现
 */

import type { PrismaClient } from '@prisma/client';
import { UserPreferences, type IUserPreferencesRepository } from '@dailyuse/domain-server';

export class PrismaUserPreferencesRepository implements IUserPreferencesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountUuid(accountUuid: string): Promise<UserPreferences | null> {
    const data = await this.prisma.userPreferences.findUnique({
      where: { accountUuid },
    });

    return data ? UserPreferences.fromPersistence(data) : null;
  }

  async findByUuid(uuid: string): Promise<UserPreferences | null> {
    const data = await this.prisma.userPreferences.findUnique({
      where: { uuid },
    });

    return data ? UserPreferences.fromPersistence(data) : null;
  }

  async save(preferences: UserPreferences): Promise<UserPreferences> {
    const persistenceData = preferences.toPersistence();

    const data = await this.prisma.userPreferences.upsert({
      where: { accountUuid: preferences.accountUuid },
      create: persistenceData,
      update: {
        language: persistenceData.language,
        timezone: persistenceData.timezone,
        locale: persistenceData.locale,
        themeMode: persistenceData.themeMode,
        notificationsEnabled: persistenceData.notificationsEnabled,
        emailNotifications: persistenceData.emailNotifications,
        pushNotifications: persistenceData.pushNotifications,
        autoLaunch: persistenceData.autoLaunch,
        defaultModule: persistenceData.defaultModule,
        analyticsEnabled: persistenceData.analyticsEnabled,
        crashReportsEnabled: persistenceData.crashReportsEnabled,
        updatedAt: persistenceData.updatedAt,
      },
    });

    return UserPreferences.fromPersistence(data);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await this.prisma.userPreferences.delete({
      where: { accountUuid },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.userPreferences.delete({
      where: { uuid },
    });
  }

  async findMany(accountUuids: string[]): Promise<UserPreferences[]> {
    const data = await this.prisma.userPreferences.findMany({
      where: {
        accountUuid: {
          in: accountUuids,
        },
      },
    });

    return data.map((item) => UserPreferences.fromPersistence(item));
  }

  async saveMany(preferencesList: UserPreferences[]): Promise<UserPreferences[]> {
    const results: UserPreferences[] = [];

    for (const preferences of preferencesList) {
      const saved = await this.save(preferences);
      results.push(saved);
    }

    return results;
  }

  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.userPreferences.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  async findAll(offset: number, limit: number): Promise<UserPreferences[]> {
    const data = await this.prisma.userPreferences.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item) => UserPreferences.fromPersistence(item));
  }

  async count(): Promise<number> {
    return await this.prisma.userPreferences.count();
  }
}
