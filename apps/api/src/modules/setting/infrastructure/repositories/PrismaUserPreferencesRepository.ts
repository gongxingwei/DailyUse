/**
 * PrismaUserPreferencesRepository
 * Prisma 用户偏好仓储实现
 */

import type { PrismaClient } from '@prisma/client';
import type { IUserPreferencesRepository } from '../../domain/repositories/IUserPreferencesRepository';
import { UserPreferences } from '../../domain/aggregates/UserPreferences';

export class PrismaUserPreferencesRepository implements IUserPreferencesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountUuid(accountUuid: string): Promise<UserPreferences | null> {
    const data = await this.prisma.userPreferences.findUnique({
      where: { accountUuid },
    });

    return data ? this.toDomain(data) : null;
  }

  async save(preferences: UserPreferences): Promise<UserPreferences> {
    const data = await this.prisma.userPreferences.upsert({
      where: { accountUuid: preferences.accountUuid },
      create: {
        uuid: preferences.uuid,
        accountUuid: preferences.accountUuid,
        language: preferences.language,
        timezone: preferences.timezone,
        locale: preferences.locale,
        themeMode: preferences.themeMode,
        notificationsEnabled: preferences.notificationsEnabled,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        autoLaunch: preferences.autoLaunch,
        defaultModule: preferences.defaultModule,
        analyticsEnabled: preferences.analyticsEnabled,
        crashReportsEnabled: preferences.crashReportsEnabled,
        createdAt: new Date(preferences.createdAt),
        updatedAt: new Date(preferences.updatedAt),
      },
      update: {
        language: preferences.language,
        timezone: preferences.timezone,
        locale: preferences.locale,
        themeMode: preferences.themeMode,
        notificationsEnabled: preferences.notificationsEnabled,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        autoLaunch: preferences.autoLaunch,
        defaultModule: preferences.defaultModule,
        analyticsEnabled: preferences.analyticsEnabled,
        crashReportsEnabled: preferences.crashReportsEnabled,
        updatedAt: new Date(preferences.updatedAt),
      },
    });

    return this.toDomain(data);
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.userPreferences.delete({
      where: { accountUuid },
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

    return data.map((item) => this.toDomain(item));
  }

  /**
   * 将 Prisma 数据转换为领域实体
   */
  private toDomain(data: any): UserPreferences {
    return new UserPreferences({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      language: data.language,
      timezone: data.timezone,
      locale: data.locale,
      themeMode: data.themeMode as 'light' | 'dark' | 'system',
      notificationsEnabled: data.notificationsEnabled,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      autoLaunch: data.autoLaunch,
      defaultModule: data.defaultModule,
      analyticsEnabled: data.analyticsEnabled,
      crashReportsEnabled: data.crashReportsEnabled,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }
}
