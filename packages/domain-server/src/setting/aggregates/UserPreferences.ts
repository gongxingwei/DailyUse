/**
 * UserPreferences Server Implementation
 * @description 用户偏好服务端实现 - 继承自Core层
 * @author DailyUse Team
 * @date 2024
 */

import { UserPreferencesCore } from '@dailyuse/domain-core';
import { SettingContracts } from '@dailyuse/contracts';

// 类型导入
type IUserPreferences = SettingContracts.IUserPreferences;
type UserPreferencesDTO = SettingContracts.UserPreferencesDTO;
type UserPreferencesClientDTO = SettingContracts.UserPreferencesClientDTO;
type UserPreferencesPersistenceDTO = SettingContracts.UserPreferencesPersistenceDTO;

/**
 * 用户偏好服务端实现
 *
 * 职责：
 * - 实现服务端特定的 DTO 转换逻辑
 * - 提供持久化格式转换
 * - 提供服务端工厂方法
 */
export class UserPreferences extends UserPreferencesCore {
  /**
   * 转换为标准 DTO（用于 API 响应）
   */
  public toDTO(): UserPreferencesDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      timezone: this._timezone,
      locale: this._locale,
      themeMode: this._themeMode,
      notificationsEnabled: this._notificationsEnabled,
      emailNotifications: this._emailNotifications,
      pushNotifications: this._pushNotifications,
      autoLaunch: this._autoLaunch,
      defaultModule: this._defaultModule,
      analyticsEnabled: this._analyticsEnabled,
      crashReportsEnabled: this._crashReportsEnabled,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  /**
   * 转换为客户端 DTO
   * 注意：服务端通常不生成 ClientDTO，这由 domain-client 负责
   * 此方法提供基础实现，实际使用时应使用 domain-client 版本
   */
  public toClientDTO(): UserPreferencesClientDTO {
    // 服务端提供基础数据，不包含 UI 计算属性
    // 实际的 ClientDTO 应由 domain-client 生成
    return {
      ...this.toDTO(),
      // UI 属性在服务端留空或提供占位符
      languageText: this._language, // 简化版，实际应由客户端计算
      timezoneText: this._timezone,
      themeModeIcon: '',
      themeModeText: this._themeMode,
      canChangeTheme: true,
      hasEmailEnabled: this._emailNotifications,
      hasPushEnabled: this._pushNotifications,
      formattedCreatedAt: this._createdAt.toISOString(),
      formattedUpdatedAt: this._updatedAt.toISOString(),
    };
  }

  /**
   * 转换为持久化 DTO（用于数据库存储）
   */
  public toPersistence(): UserPreferencesPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      timezone: this._timezone,
      locale: this._locale,
      themeMode: this._themeMode,
      notificationsEnabled: this._notificationsEnabled,
      emailNotifications: this._emailNotifications,
      pushNotifications: this._pushNotifications,
      autoLaunch: this._autoLaunch,
      defaultModule: this._defaultModule,
      analyticsEnabled: this._analyticsEnabled,
      crashReportsEnabled: this._crashReportsEnabled,
      createdAt: this._createdAt, // Date object for Prisma
      updatedAt: this._updatedAt,
    };
  }

  // ========== 工厂方法 ==========

  /**
   * 从持久化数据创建实例
   */
  static fromPersistence(data: UserPreferencesPersistenceDTO): UserPreferences {
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
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    });
  }

  /**
   * 从 DTO 创建实例
   */
  static fromDTO(data: UserPreferencesDTO): UserPreferences {
    return new UserPreferences({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      language: data.language,
      timezone: data.timezone,
      locale: data.locale,
      themeMode: data.themeMode,
      notificationsEnabled: data.notificationsEnabled,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      autoLaunch: data.autoLaunch,
      defaultModule: data.defaultModule,
      analyticsEnabled: data.analyticsEnabled,
      crashReportsEnabled: data.crashReportsEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 创建默认用户偏好
   * @param accountUuid 账户UUID
   * @param uuid 用户偏好UUID（可选，不提供则自动生成）
   */
  static createDefault(accountUuid: string, uuid?: string): UserPreferences {
    const now = new Date();
    const preferencesUuid = uuid || UserPreferences.generateUUID();

    return new UserPreferences({
      uuid: preferencesUuid,
      accountUuid,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      themeMode: 'system',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      autoLaunch: false,
      defaultModule: 'goal',
      analyticsEnabled: true,
      crashReportsEnabled: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  /**
   * 批量创建默认偏好
   * @param accountUuids 账户UUID数组
   */
  static createDefaultBatch(accountUuids: string[]): UserPreferences[] {
    return accountUuids.map((accountUuid) => UserPreferences.createDefault(accountUuid));
  }

  // ========== 服务端特定业务方法 ==========

  /**
   * 重置为默认设置（保留账户信息）
   */
  public resetToDefaults(): void {
    this._language = 'zh-CN';
    this._timezone = 'Asia/Shanghai';
    this._locale = 'zh-CN';
    this._themeMode = 'system';
    this._notificationsEnabled = true;
    this._emailNotifications = true;
    this._pushNotifications = true;
    this._autoLaunch = false;
    this._defaultModule = 'goal';
    this._analyticsEnabled = true;
    this._crashReportsEnabled = true;
    this.touch();
  }

  /**
   * 导出为备份格式
   */
  public exportBackup(): Record<string, any> {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: this.toDTO(),
    };
  }

  /**
   * 从备份恢复（仅恢复偏好设置，不恢复 UUID 和账户信息）
   */
  public restoreFromBackup(backupData: UserPreferencesDTO): void {
    this.updatePreferences({
      language: backupData.language,
      timezone: backupData.timezone,
      locale: backupData.locale,
      themeMode: backupData.themeMode,
      notificationsEnabled: backupData.notificationsEnabled,
      emailNotifications: backupData.emailNotifications,
      pushNotifications: backupData.pushNotifications,
      autoLaunch: backupData.autoLaunch,
      defaultModule: backupData.defaultModule,
      analyticsEnabled: backupData.analyticsEnabled,
      crashReportsEnabled: backupData.crashReportsEnabled,
    });
  }

  /**
   * 克隆偏好设置（创建新实例）
   */
  public clone(newAccountUuid: string): UserPreferences {
    const clonedData = this.toDTO();
    return new UserPreferences({
      ...clonedData,
      uuid: UserPreferences.generateUUID(),
      accountUuid: newAccountUuid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 生成 UUID
   * 使用全局 crypto API 生成 UUID
   */
  static override generateUUID(): string {
    // 使用加密安全的随机UUID
    return crypto.randomUUID();
  }
}
