/**
 * User Preferences API Client
 * 用户偏好设置 API 客户端
 */

import { apiClient } from '@/shared/api/instances';

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  uuid: string;
  accountUuid: string;
  language: string;
  timezone: string;
  locale: string;
  themeMode: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoLaunch: boolean;
  defaultModule: string;
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 通知偏好设置
 */
export interface NotificationPreferences {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

/**
 * 用户偏好设置 API
 */
export const userPreferencesApi = {
  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>('/settings/preferences');
  },

  /**
   * 切换主题模式
   */
  async switchThemeMode(themeMode: 'light' | 'dark' | 'system'): Promise<UserPreferences> {
    return apiClient.post<UserPreferences>('/settings/preferences/theme-mode', { themeMode });
  },

  /**
   * 更改语言
   */
  async changeLanguage(language: string): Promise<UserPreferences> {
    return apiClient.post<UserPreferences>('/settings/preferences/language', { language });
  },

  /**
   * 更新通知偏好
   */
  async updateNotificationPreferences(
    preferences: NotificationPreferences,
  ): Promise<UserPreferences> {
    return apiClient.post<UserPreferences>('/settings/preferences/notifications', preferences);
  },

  /**
   * 更新用户偏好（批量）
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.put<UserPreferences>('/settings/preferences', updates);
  },

  /**
   * 重置为默认设置
   */
  async resetToDefault(): Promise<UserPreferences> {
    return apiClient.post<UserPreferences>('/settings/preferences/reset');
  },
};
