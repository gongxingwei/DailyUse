/**
 * Setting Domain Events
 * 设置模块领域事件
 */

// ========== 主题相关事件 ==========

/**
 * 主题模式变更事件
 * 发送给 Theme 模块处理
 */
export interface ThemeModeChangedEvent {
  eventType: 'THEME_MODE_CHANGED';
  accountUuid: string;
  themeMode: 'light' | 'dark' | 'system';
  timestamp: number;
}

// ========== 语言相关事件 ==========

/**
 * 语言变更事件
 */
export interface LanguageChangedEvent {
  eventType: 'LANGUAGE_CHANGED';
  accountUuid: string;
  language: string;
  timestamp: number;
}

// ========== 通知相关事件 ==========

/**
 * 通知偏好变更事件
 */
export interface NotificationPreferencesChangedEvent {
  eventType: 'NOTIFICATION_PREFERENCES_CHANGED';
  accountUuid: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timestamp: number;
}

// ========== 用户偏好变更事件（通用） ==========

/**
 * 用户偏好变更事件
 */
export interface UserPreferencesChangedEvent {
  eventType: 'USER_PREFERENCES_CHANGED';
  accountUuid: string;
  changes: Record<string, any>;
  timestamp: number;
}

// 事件类型联合
export type SettingDomainEvent =
  | ThemeModeChangedEvent
  | LanguageChangedEvent
  | NotificationPreferencesChangedEvent
  | UserPreferencesChangedEvent;
