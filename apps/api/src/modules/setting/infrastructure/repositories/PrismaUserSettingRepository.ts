import { PrismaClient } from '@prisma/client';
import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSettingServer } from '@dailyuse/domain-server';
import type { SettingContracts } from '@dailyuse/contracts';

/**
 * UserSetting Prisma 仓储实现
 *
 * 架构规范：
 * - PersistenceDTO = 实体属性扁平化 + 存储类型转换
 * - Prisma Schema 与 PersistenceDTO 一一对应
 * - 不需要映射兼容函数
 */
export class PrismaUserSettingRepository implements IUserSettingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 数据转换为 PersistenceDTO（一一对应）
   */
  private toPersistenceDTO(data: any): SettingContracts.UserSettingPersistenceDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,

      // Appearance
      appearanceTheme: data.appearanceTheme,
      appearanceAccentColor: data.appearanceAccentColor,
      appearanceFontSize: data.appearanceFontSize,
      appearanceFontFamily: data.appearanceFontFamily,
      appearanceCompactMode: data.appearanceCompactMode,

      // Locale
      localeLanguage: data.localeLanguage,
      localeTimezone: data.localeTimezone,
      localeDateFormat: data.localeDateFormat,
      localeTimeFormat: data.localeTimeFormat,
      localeWeekStartsOn: data.localeWeekStartsOn,
      localeCurrency: data.localeCurrency,

      // Workflow
      workflowDefaultTaskView: data.workflowDefaultTaskView,
      workflowDefaultGoalView: data.workflowDefaultGoalView,
      workflowDefaultScheduleView: data.workflowDefaultScheduleView,
      workflowAutoSave: data.workflowAutoSave,
      workflowAutoSaveInterval: data.workflowAutoSaveInterval,
      workflowConfirmBeforeDelete: data.workflowConfirmBeforeDelete,

      // Shortcuts
      shortcutsEnabled: data.shortcutsEnabled,
      shortcutsCustom: data.shortcutsCustom,

      // Privacy
      privacyProfileVisibility: data.privacyProfileVisibility,
      privacyShowOnlineStatus: data.privacyShowOnlineStatus,
      privacyAllowSearchByEmail: data.privacyAllowSearchByEmail,
      privacyAllowSearchByPhone: data.privacyAllowSearchByPhone,
      privacyShareUsageData: data.privacyShareUsageData,

      // Experimental
      experimentalEnabled: data.experimentalEnabled,
      experimentalFeatures: data.experimentalFeatures,

      // Timestamps
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    };
  }

  /**
   * 从 PersistenceDTO 转换为 Prisma 数据（一一对应）
   */
  private fromPersistenceDTO(dto: SettingContracts.UserSettingPersistenceDTO): any {
    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,

      // Appearance
      appearanceTheme: dto.appearanceTheme,
      appearanceAccentColor: dto.appearanceAccentColor,
      appearanceFontSize: dto.appearanceFontSize,
      appearanceFontFamily: dto.appearanceFontFamily,
      appearanceCompactMode: dto.appearanceCompactMode,

      // Locale
      localeLanguage: dto.localeLanguage,
      localeTimezone: dto.localeTimezone,
      localeDateFormat: dto.localeDateFormat,
      localeTimeFormat: dto.localeTimeFormat,
      localeWeekStartsOn: dto.localeWeekStartsOn,
      localeCurrency: dto.localeCurrency,

      // Workflow
      workflowDefaultTaskView: dto.workflowDefaultTaskView,
      workflowDefaultGoalView: dto.workflowDefaultGoalView,
      workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
      workflowAutoSave: dto.workflowAutoSave,
      workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
      workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,

      // Shortcuts
      shortcutsEnabled: dto.shortcutsEnabled,
      shortcutsCustom: dto.shortcutsCustom,

      // Privacy
      privacyProfileVisibility: dto.privacyProfileVisibility,
      privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
      privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
      privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
      privacyShareUsageData: dto.privacyShareUsageData,

      // Experimental
      experimentalEnabled: dto.experimentalEnabled,
      experimentalFeatures: dto.experimentalFeatures,

      // Timestamps
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  // ===== IUserSettingRepository 接口实现 =====

  async save(userSetting: UserSettingServer): Promise<void> {
    const dto = userSetting.toPersistenceDTO();
    const prismaData = this.fromPersistenceDTO(dto);

    await this.prisma.userSetting.upsert({
      where: { uuid: dto.uuid },
      create: prismaData,
      update: prismaData,
    });
  }

  async findById(uuid: string): Promise<UserSettingServer | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { uuid },
    });
    if (!data) return null;

    const dto = this.toPersistenceDTO(data);
    return UserSettingServer.fromPersistenceDTO(dto);
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSettingServer | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { accountUuid },
    });
    if (!data) return null;

    const dto = this.toPersistenceDTO(data);
    return UserSettingServer.fromPersistenceDTO(dto);
  }

  async findAll(): Promise<UserSettingServer[]> {
    const data = await this.prisma.userSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item) => {
      const dto = this.toPersistenceDTO(item);
      return UserSettingServer.fromPersistenceDTO(dto);
    });
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
        const dto = userSetting.toPersistenceDTO();

        await tx.userSetting.upsert({
          where: { uuid: dto.uuid },
          create: {
            uuid: dto.uuid,
            accountUuid: dto.accountUuid,
            appearanceTheme: dto.appearanceTheme,
            appearanceAccentColor: dto.appearanceAccentColor,
            appearanceFontSize: dto.appearanceFontSize,
            appearanceFontFamily: dto.appearanceFontFamily,
            appearanceCompactMode: dto.appearanceCompactMode,
            localeLanguage: dto.localeLanguage,
            localeTimezone: dto.localeTimezone,
            localeDateFormat: dto.localeDateFormat,
            localeTimeFormat: dto.localeTimeFormat,
            localeWeekStartsOn: dto.localeWeekStartsOn,
            localeCurrency: dto.localeCurrency,
            workflowDefaultTaskView: dto.workflowDefaultTaskView,
            workflowDefaultGoalView: dto.workflowDefaultGoalView,
            workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
            workflowAutoSave: dto.workflowAutoSave,
            workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
            workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,
            shortcutsEnabled: dto.shortcutsEnabled,
            shortcutsCustom: dto.shortcutsCustom,
            privacyProfileVisibility: dto.privacyProfileVisibility,
            privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
            privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
            privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
            privacyShareUsageData: dto.privacyShareUsageData,
            experimentalEnabled: dto.experimentalEnabled,
            experimentalFeatures: dto.experimentalFeatures,
            createdAt: new Date(dto.createdAt),
            updatedAt: new Date(dto.updatedAt),
          },
          update: {
            appearanceTheme: dto.appearanceTheme,
            appearanceAccentColor: dto.appearanceAccentColor,
            appearanceFontSize: dto.appearanceFontSize,
            appearanceFontFamily: dto.appearanceFontFamily,
            appearanceCompactMode: dto.appearanceCompactMode,
            localeLanguage: dto.localeLanguage,
            localeTimezone: dto.localeTimezone,
            localeDateFormat: dto.localeDateFormat,
            localeTimeFormat: dto.localeTimeFormat,
            localeWeekStartsOn: dto.localeWeekStartsOn,
            localeCurrency: dto.localeCurrency,
            workflowDefaultTaskView: dto.workflowDefaultTaskView,
            workflowDefaultGoalView: dto.workflowDefaultGoalView,
            workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
            workflowAutoSave: dto.workflowAutoSave,
            workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
            workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,
            shortcutsEnabled: dto.shortcutsEnabled,
            shortcutsCustom: dto.shortcutsCustom,
            privacyProfileVisibility: dto.privacyProfileVisibility,
            privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
            privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
            privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
            privacyShareUsageData: dto.privacyShareUsageData,
            experimentalEnabled: dto.experimentalEnabled,
            experimentalFeatures: dto.experimentalFeatures,
            updatedAt: new Date(dto.updatedAt),
          },
        });
      }
    });
  }
}
