/**
 * SettingDomainService
 * 设置领域服务
 *
 * @description 处理设置相关的业务逻辑
 */

import { UserPreferences } from '../aggregates/UserPreferences';
import { generateUUID } from '@dailyuse/utils';
import type {
  ThemeModeChangedEvent,
  LanguageChangedEvent,
  NotificationPreferencesChangedEvent,
} from '../events/SettingDomainEvents';

export class SettingDomainService {
  /**
   * 创建默认用户偏好
   */
  createDefaultPreferences(accountUuid: string): UserPreferences {
    return UserPreferences.createDefault(accountUuid, generateUUID());
  }

  /**
   * 切换主题模式（生成事件）
   */
  switchThemeMode(
    preferences: UserPreferences,
    mode: 'light' | 'dark' | 'system',
  ): { preferences: UserPreferences; event: ThemeModeChangedEvent } {
    const oldMode = preferences.themeMode;

    if (oldMode === mode) {
      throw new Error('Theme mode is already set to ' + mode);
    }

    preferences.switchThemeMode(mode);

    // 生成领域事件
    const event: ThemeModeChangedEvent = {
      eventType: 'THEME_MODE_CHANGED',
      accountUuid: preferences.accountUuid,
      themeMode: mode,
      timestamp: Date.now(),
    };

    return { preferences, event };
  }

  /**
   * 更改语言（生成事件）
   */
  changeLanguage(
    preferences: UserPreferences,
    language: string,
  ): { preferences: UserPreferences; event: LanguageChangedEvent } {
    const oldLanguage = preferences.language;

    preferences.changeLanguage(language);

    // 生成领域事件
    const event: LanguageChangedEvent = {
      eventType: 'LANGUAGE_CHANGED',
      accountUuid: preferences.accountUuid,
      language,
      timestamp: Date.now(),
    };

    return { preferences, event };
  }

  /**
   * 更新通知偏好（生成事件）
   */
  updateNotificationPreferences(
    preferences: UserPreferences,
    config: {
      notificationsEnabled?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    },
  ): { preferences: UserPreferences; event: NotificationPreferencesChangedEvent } {
    if (config.notificationsEnabled !== undefined) {
      preferences.setNotifications(config.notificationsEnabled);
    }

    if (config.emailNotifications !== undefined) {
      preferences.setEmailNotifications(config.emailNotifications);
    }

    if (config.pushNotifications !== undefined) {
      preferences.setPushNotifications(config.pushNotifications);
    }

    // 生成领域事件
    const event: NotificationPreferencesChangedEvent = {
      eventType: 'NOTIFICATION_PREFERENCES_CHANGED',
      accountUuid: preferences.accountUuid,
      notificationsEnabled: preferences.notificationsEnabled,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      timestamp: Date.now(),
    };

    return { preferences, event };
  }

  /**
   * 验证偏好设置
   */
  validatePreferences(preferences: UserPreferences): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!preferences.accountUuid) {
      errors.push('Account UUID is required');
    }

    if (!preferences.language) {
      errors.push('Language is required');
    }

    if (!preferences.timezone) {
      errors.push('Timezone is required');
    }

    if (!['light', 'dark', 'system'].includes(preferences.themeMode)) {
      errors.push('Invalid theme mode');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
