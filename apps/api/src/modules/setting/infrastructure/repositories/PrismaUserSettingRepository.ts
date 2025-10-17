import { PrismaClient } from '@prisma/client';
import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSettingServer } from '@dailyuse/domain-server';

/**
 * UserSetting Prisma 仓储实现
 * 负责 UserSetting 聚合根的持久化
 *
 * 注意：Prisma schema 的字段和 PersistenceDTO 不完全匹配，需要进行转换：
 * - Prisma: preferences, theme, language, timezone, notifications, privacy
 * - DTO: appearance, locale, workflow, shortcuts, privacy, experimental
 */
export class PrismaUserSettingRepository implements IUserSettingRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 UserSetting 聚合根
   */
  private mapToEntity(data: any): UserSettingServer {
    // 从 Prisma 的字段重构为 PersistenceDTO 的字段
    const preferences =
      typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences;
    const notifications =
      typeof data.notifications === 'string' ? JSON.parse(data.notifications) : data.notifications;
    const privacy = typeof data.privacy === 'string' ? JSON.parse(data.privacy) : data.privacy;

    // 构建 appearance (从 theme 和 preferences)
    const appearance = {
      theme: data.theme || 'LIGHT',
      accentColor: preferences.accentColor || '#1976d2',
      fontSize: preferences.fontSize || 'MEDIUM',
      fontFamily: preferences.fontFamily || null,
      compactMode: preferences.compactMode || false,
    };

    // 构建 locale
    const locale = {
      language: data.language,
      timezone: data.timezone,
      dateFormat: preferences.dateFormat || 'YYYY-MM-DD',
      timeFormat: preferences.timeFormat || '24H',
      weekStartsOn: preferences.weekStartsOn || 1,
      currency: preferences.currency || 'CNY',
    };

    // 构建 workflow
    const workflow = {
      defaultTaskView: preferences.defaultTaskView || 'LIST',
      defaultGoalView: preferences.defaultGoalView || 'LIST',
      defaultScheduleView: preferences.defaultScheduleView || 'WEEK',
      autoSave: preferences.autoSave !== false,
      autoSaveInterval: preferences.autoSaveInterval || 30000,
      confirmBeforeDelete: preferences.confirmBeforeDelete !== false,
    };

    // 构建 shortcuts
    const shortcuts = {
      enabled: preferences.shortcutsEnabled !== false,
      custom: preferences.customShortcuts || {},
    };

    // 构建 experimental
    const experimental = {
      enabled: preferences.experimentalEnabled || false,
      features: preferences.experimentalFeatures || [],
    };

    return UserSettingServer.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      appearance: JSON.stringify(appearance),
      locale: JSON.stringify(locale),
      workflow: JSON.stringify(workflow),
      shortcuts: JSON.stringify(shortcuts),
      privacy: JSON.stringify(privacy),
      experimental: JSON.stringify(experimental),
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
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

    // 从 PersistenceDTO 转换回 Prisma schema 的字段
    const appearance = JSON.parse(persistence.appearance);
    const locale = JSON.parse(persistence.locale);
    const workflow = JSON.parse(persistence.workflow);
    const shortcuts = JSON.parse(persistence.shortcuts);
    const experimental = JSON.parse(persistence.experimental);
    const privacyData = JSON.parse(persistence.privacy);

    // 合并为 preferences JSON
    const preferences = {
      accentColor: appearance.accentColor,
      fontSize: appearance.fontSize,
      fontFamily: appearance.fontFamily,
      compactMode: appearance.compactMode,
      dateFormat: locale.dateFormat,
      timeFormat: locale.timeFormat,
      weekStartsOn: locale.weekStartsOn,
      currency: locale.currency,
      defaultTaskView: workflow.defaultTaskView,
      defaultGoalView: workflow.defaultGoalView,
      defaultScheduleView: workflow.defaultScheduleView,
      autoSave: workflow.autoSave,
      autoSaveInterval: workflow.autoSaveInterval,
      confirmBeforeDelete: workflow.confirmBeforeDelete,
      shortcutsEnabled: shortcuts.enabled,
      customShortcuts: shortcuts.custom,
      experimentalEnabled: experimental.enabled,
      experimentalFeatures: experimental.features,
    };

    await this.prisma.userSetting.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        preferences: JSON.stringify(preferences),
        theme: appearance.theme,
        language: locale.language,
        timezone: locale.timezone,
        notifications: '{}', // 从 appearance/locale/workflow 等提取
        privacy: persistence.privacy,
        createdAt: this.toDate(persistence.createdAt) ?? new Date(),
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      },
      update: {
        preferences: JSON.stringify(preferences),
        theme: appearance.theme,
        language: locale.language,
        timezone: locale.timezone,
        privacy: persistence.privacy,
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
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

        // 从 PersistenceDTO 转换回 Prisma schema 的字段
        const appearance = JSON.parse(persistence.appearance);
        const locale = JSON.parse(persistence.locale);
        const workflow = JSON.parse(persistence.workflow);
        const shortcuts = JSON.parse(persistence.shortcuts);
        const experimental = JSON.parse(persistence.experimental);

        // 合并为 preferences JSON
        const preferences = {
          accentColor: appearance.accentColor,
          fontSize: appearance.fontSize,
          fontFamily: appearance.fontFamily,
          compactMode: appearance.compactMode,
          dateFormat: locale.dateFormat,
          timeFormat: locale.timeFormat,
          weekStartsOn: locale.weekStartsOn,
          currency: locale.currency,
          defaultTaskView: workflow.defaultTaskView,
          defaultGoalView: workflow.defaultGoalView,
          defaultScheduleView: workflow.defaultScheduleView,
          autoSave: workflow.autoSave,
          autoSaveInterval: workflow.autoSaveInterval,
          confirmBeforeDelete: workflow.confirmBeforeDelete,
          shortcutsEnabled: shortcuts.enabled,
          customShortcuts: shortcuts.custom,
          experimentalEnabled: experimental.enabled,
          experimentalFeatures: experimental.features,
        };

        await tx.userSetting.upsert({
          where: { uuid: persistence.uuid },
          create: {
            uuid: persistence.uuid,
            accountUuid: persistence.accountUuid,
            preferences: JSON.stringify(preferences),
            theme: appearance.theme,
            language: locale.language,
            timezone: locale.timezone,
            notifications: '{}',
            privacy: persistence.privacy,
            createdAt: this.toDate(persistence.createdAt) ?? new Date(),
            updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          },
          update: {
            preferences: JSON.stringify(preferences),
            theme: appearance.theme,
            language: locale.language,
            timezone: locale.timezone,
            privacy: persistence.privacy,
            updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          },
        });
      }
    });
  }
}
