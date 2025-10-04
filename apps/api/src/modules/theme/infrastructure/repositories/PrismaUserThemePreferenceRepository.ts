/**
 * PrismaUserThemePreferenceRepository
 * Prisma 用户主题偏好仓储实现
 */

import type { PrismaClient } from '@prisma/client';
import type { IUserThemePreferenceRepository } from '../../domain/repositories/IUserThemePreferenceRepository';
import { UserThemePreference } from '../../domain/entities/UserThemePreference';
import { ThemeContracts } from '@dailyuse/contracts';

export class PrismaUserThemePreferenceRepository implements IUserThemePreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountUuid(accountUuid: string): Promise<UserThemePreference | null> {
    const data = await this.prisma.userThemePreference.findUnique({
      where: { accountUuid },
    });

    return data ? this.toDomain(data) : null;
  }

  async save(preference: UserThemePreference): Promise<UserThemePreference> {
    const data = await this.prisma.userThemePreference.upsert({
      where: { accountUuid: preference.accountUuid },
      create: {
        uuid: preference.uuid,
        accountUuid: preference.accountUuid,
        currentThemeUuid: preference.currentThemeUuid,
        preferredMode: preference.preferredMode,
        autoSwitch: preference.autoSwitch,
        scheduleStart: preference.scheduleStart,
        scheduleEnd: preference.scheduleEnd,
        createdAt: new Date(preference.createdAt),
        updatedAt: new Date(preference.updatedAt),
      },
      update: {
        currentThemeUuid: preference.currentThemeUuid,
        preferredMode: preference.preferredMode,
        autoSwitch: preference.autoSwitch,
        scheduleStart: preference.scheduleStart,
        scheduleEnd: preference.scheduleEnd,
        updatedAt: new Date(preference.updatedAt),
      },
    });

    return this.toDomain(data);
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.userThemePreference.delete({
      where: { accountUuid },
    });
  }

  /**
   * 将 Prisma 数据转换为领域实体
   */
  private toDomain(data: any): UserThemePreference {
    return new UserThemePreference({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      currentThemeUuid: data.currentThemeUuid,
      preferredMode: data.preferredMode as ThemeContracts.ThemeMode,
      autoSwitch: data.autoSwitch,
      scheduleStart: data.scheduleStart,
      scheduleEnd: data.scheduleEnd,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }
}
