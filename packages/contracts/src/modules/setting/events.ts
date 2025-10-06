/**
 * Setting 模块领域事件定义
 *
 * 定义设置相关的领域事件
 */

import type { SettingType, SettingScope, SettingCategory } from './types';

// ========== 用户偏好事件 ==========

/**
 * 用户偏好创建事件载荷
 */
export interface UserPreferencesCreatedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 语言 */
  language: string;
  /** 时区 */
  timezone: string;
  /** 主题模式 */
  themeMode: 'light' | 'dark' | 'system';
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 用户偏好更新事件载荷
 */
export interface UserPreferencesUpdatedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 更新的字段 */
  updatedFields: string[];
  /** 旧值 */
  oldValues: Record<string, any>;
  /** 新值 */
  newValues: Record<string, any>;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 主题模式切换事件载荷
 */
export interface ThemeModeChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 旧主题模式 */
  oldMode: 'light' | 'dark' | 'system';
  /** 新主题模式 */
  newMode: 'light' | 'dark' | 'system';
  /** 实际应用的主题（如果是system，则为解析后的值） */
  effectiveTheme: 'light' | 'dark';
  /** 切换时间 */
  changedAt: Date;
  /** 切换原因 */
  reason?: 'user' | 'system' | 'schedule';
}

/**
 * 语言更改事件载荷
 */
export interface LanguageChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 旧语言 */
  oldLanguage: string;
  /** 新语言 */
  newLanguage: string;
  /** 更改时间 */
  changedAt: Date;
}

/**
 * 时区更改事件载荷
 */
export interface TimezoneChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 旧时区 */
  oldTimezone: string;
  /** 新时区 */
  newTimezone: string;
  /** 更改时间 */
  changedAt: Date;
}

/**
 * 通知设置更改事件载荷
 */
export interface NotificationSettingsChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 总开关状态 */
  notificationsEnabled: boolean;
  /** 邮件通知状态 */
  emailNotifications: boolean;
  /** 推送通知状态 */
  pushNotifications: boolean;
  /** 更改时间 */
  changedAt: Date;
}

/**
 * 应用偏好更改事件载荷
 */
export interface AppPreferencesChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 自动启动状态 */
  autoLaunch?: boolean;
  /** 默认模块 */
  defaultModule?: string;
  /** 更改时间 */
  changedAt: Date;
}

/**
 * 隐私设置更改事件载荷
 */
export interface PrivacySettingsChangedEventPayload {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;
  /** 数据分析状态 */
  analyticsEnabled: boolean;
  /** 崩溃报告状态 */
  crashReportsEnabled: boolean;
  /** 更改时间 */
  changedAt: Date;
}

// ========== 设置定义事件 ==========

/**
 * 设置定义创建事件载荷
 */
export interface SettingDefinitionCreatedEventPayload {
  /** 设置键 */
  key: string;
  /** 设置标题 */
  title: string;
  /** 设置类型 */
  type: SettingType;
  /** 设置范围 */
  scope: SettingScope;
  /** 设置分类 */
  category: SettingCategory;
  /** 默认值 */
  defaultValue: any;
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy: string;
}

/**
 * 设置定义更新事件载荷
 */
export interface SettingDefinitionUpdatedEventPayload {
  /** 设置键 */
  key: string;
  /** 更新的字段 */
  updatedFields: string[];
  /** 旧值 */
  oldValues: Record<string, any>;
  /** 新值 */
  newValues: Record<string, any>;
  /** 更新时间 */
  updatedAt: Date;
  /** 更新者 */
  updatedBy: string;
}

/**
 * 设置定义删除事件载荷
 */
export interface SettingDefinitionDeletedEventPayload {
  /** 设置键 */
  key: string;
  /** 设置标题 */
  title: string;
  /** 设置类型 */
  type: SettingType;
  /** 删除时间 */
  deletedAt: Date;
  /** 删除者 */
  deletedBy: string;
}

// ========== 设置组事件 ==========

/**
 * 设置组创建事件载荷
 */
export interface SettingGroupCreatedEventPayload {
  /** 组ID */
  id: string;
  /** 组标题 */
  title: string;
  /** 组分类 */
  category: SettingCategory;
  /** 包含的设置键 */
  settingKeys: string[];
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy: string;
}

/**
 * 设置组更新事件载荷
 */
export interface SettingGroupUpdatedEventPayload {
  /** 组ID */
  id: string;
  /** 更新的字段 */
  updatedFields: string[];
  /** 旧值 */
  oldValues: Record<string, any>;
  /** 新值 */
  newValues: Record<string, any>;
  /** 更新时间 */
  updatedAt: Date;
  /** 更新者 */
  updatedBy: string;
}

/**
 * 设置组删除事件载荷
 */
export interface SettingGroupDeletedEventPayload {
  /** 组ID */
  id: string;
  /** 组标题 */
  title: string;
  /** 删除时间 */
  deletedAt: Date;
  /** 删除者 */
  deletedBy: string;
}

// ========== 设置值事件 ==========

/**
 * 设置值更新事件载荷
 */
export interface SettingValueUpdatedEventPayload {
  /** 设置键 */
  key: string;
  /** 旧值 */
  oldValue: any;
  /** 新值 */
  newValue: any;
  /** 设置范围 */
  scope: SettingScope;
  /** 更新时间 */
  updatedAt: Date;
  /** 更新者 */
  updatedBy: string;
  /** 更新原因 */
  reason?: string;
  /** 是否需要重启 */
  requiresRestart: boolean;
}

/**
 * 设置值重置事件载荷
 */
export interface SettingValueResetEventPayload {
  /** 设置键 */
  key: string;
  /** 旧值 */
  oldValue: any;
  /** 默认值 */
  defaultValue: any;
  /** 设置范围 */
  scope: SettingScope;
  /** 重置时间 */
  resetAt: Date;
  /** 重置者 */
  resetBy: string;
}

/**
 * 批量设置值更新事件载荷
 */
export interface BatchSettingValuesUpdatedEventPayload {
  /** 更新的设置 */
  updatedSettings: {
    key: string;
    oldValue: any;
    newValue: any;
    scope: SettingScope;
  }[];
  /** 更新时间 */
  updatedAt: Date;
  /** 更新者 */
  updatedBy: string;
  /** 更新原因 */
  reason?: string;
  /** 需要重启的设置 */
  requiresRestartSettings: string[];
}

// ========== 设置备份事件 ==========

/**
 * 设置备份创建事件载荷
 */
export interface SettingBackupCreatedEventPayload {
  /** 备份ID */
  id: string;
  /** 备份名称 */
  name: string;
  /** 包含的设置数量 */
  settingsCount: number;
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy: string;
  /** 应用版本 */
  appVersion: string;
}

/**
 * 设置备份恢复事件载荷
 */
export interface SettingBackupRestoredEventPayload {
  /** 备份ID */
  backupId: string;
  /** 备份名称 */
  backupName: string;
  /** 恢复的设置数量 */
  restoredSettingsCount: number;
  /** 恢复时间 */
  restoredAt: Date;
  /** 恢复者 */
  restoredBy: string;
  /** 是否覆盖现有设置 */
  overwrite: boolean;
}

/**
 * 设置备份删除事件载荷
 */
export interface SettingBackupDeletedEventPayload {
  /** 备份ID */
  id: string;
  /** 备份名称 */
  name: string;
  /** 删除时间 */
  deletedAt: Date;
  /** 删除者 */
  deletedBy: string;
}

// ========== 设置验证事件 ==========

/**
 * 设置验证失败事件载荷
 */
export interface SettingValidationFailedEventPayload {
  /** 设置键 */
  key: string;
  /** 输入值 */
  inputValue: any;
  /** 验证错误 */
  validationErrors: {
    rule: string;
    message: string;
  }[];
  /** 验证时间 */
  validatedAt: Date;
  /** 验证者 */
  validatedBy: string;
}

/**
 * 设置依赖检查失败事件载荷
 */
export interface SettingDependencyCheckFailedEventPayload {
  /** 设置键 */
  key: string;
  /** 依赖的设置键 */
  dependentKeys: string[];
  /** 失败的依赖 */
  failedDependencies: string[];
  /** 检查时间 */
  checkedAt: Date;
}

// ========== 设置迁移事件 ==========

/**
 * 设置迁移开始事件载荷
 */
export interface SettingMigrationStartedEventPayload {
  /** 源版本 */
  fromVersion: string;
  /** 目标版本 */
  toVersion: string;
  /** 需要迁移的设置数量 */
  settingsCount: number;
  /** 开始时间 */
  startedAt: Date;
}

/**
 * 设置迁移完成事件载荷
 */
export interface SettingMigrationCompletedEventPayload {
  /** 源版本 */
  fromVersion: string;
  /** 目标版本 */
  toVersion: string;
  /** 成功迁移的设置数量 */
  migratedCount: number;
  /** 失败的设置数量 */
  failedCount: number;
  /** 失败的设置键 */
  failedKeys: string[];
  /** 完成时间 */
  completedAt: Date;
  /** 耗时（毫秒） */
  duration: number;
}

/**
 * 设置迁移失败事件载荷
 */
export interface SettingMigrationFailedEventPayload {
  /** 源版本 */
  fromVersion: string;
  /** 目标版本 */
  toVersion: string;
  /** 错误信息 */
  error: string;
  /** 失败时间 */
  failedAt: Date;
}

// ========== 设置监控事件 ==========

/**
 * 设置性能监控事件载荷
 */
export interface SettingPerformanceMonitorEventPayload {
  /** 操作类型 */
  operation: 'load' | 'save' | 'validate' | 'query';
  /** 设置键（可选） */
  key?: string;
  /** 耗时（毫秒） */
  duration: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 监控时间 */
  monitoredAt: Date;
}

/**
 * 设置使用统计事件载荷
 */
export interface SettingUsageStatsEventPayload {
  /** 设置键 */
  key: string;
  /** 操作类型 */
  operation: 'read' | 'write' | 'reset';
  /** 用户ID */
  userId: string;
  /** 统计时间 */
  statsAt: Date;
}

// ========== 领域事件类型定义 ==========

/**
 * 设置定义领域事件
 */
export type SettingDefinitionDomainEvent =
  | { type: 'SettingDefinitionCreated'; payload: SettingDefinitionCreatedEventPayload }
  | { type: 'SettingDefinitionUpdated'; payload: SettingDefinitionUpdatedEventPayload }
  | { type: 'SettingDefinitionDeleted'; payload: SettingDefinitionDeletedEventPayload };

/**
 * 设置组领域事件
 */
export type SettingGroupDomainEvent =
  | { type: 'SettingGroupCreated'; payload: SettingGroupCreatedEventPayload }
  | { type: 'SettingGroupUpdated'; payload: SettingGroupUpdatedEventPayload }
  | { type: 'SettingGroupDeleted'; payload: SettingGroupDeletedEventPayload };

/**
 * 设置值领域事件
 */
export type SettingValueDomainEvent =
  | { type: 'SettingValueUpdated'; payload: SettingValueUpdatedEventPayload }
  | { type: 'SettingValueReset'; payload: SettingValueResetEventPayload }
  | { type: 'BatchSettingValuesUpdated'; payload: BatchSettingValuesUpdatedEventPayload };

/**
 * 设置备份领域事件
 */
export type SettingBackupDomainEvent =
  | { type: 'SettingBackupCreated'; payload: SettingBackupCreatedEventPayload }
  | { type: 'SettingBackupRestored'; payload: SettingBackupRestoredEventPayload }
  | { type: 'SettingBackupDeleted'; payload: SettingBackupDeletedEventPayload };

/**
 * 设置验证领域事件
 */
export type SettingValidationDomainEvent =
  | { type: 'SettingValidationFailed'; payload: SettingValidationFailedEventPayload }
  | { type: 'SettingDependencyCheckFailed'; payload: SettingDependencyCheckFailedEventPayload };

/**
 * 设置迁移领域事件
 */
export type SettingMigrationDomainEvent =
  | { type: 'SettingMigrationStarted'; payload: SettingMigrationStartedEventPayload }
  | { type: 'SettingMigrationCompleted'; payload: SettingMigrationCompletedEventPayload }
  | { type: 'SettingMigrationFailed'; payload: SettingMigrationFailedEventPayload };

/**
 * 设置监控领域事件
 */
export type SettingMonitoringDomainEvent =
  | { type: 'SettingPerformanceMonitor'; payload: SettingPerformanceMonitorEventPayload }
  | { type: 'SettingUsageStats'; payload: SettingUsageStatsEventPayload };

/**
 * 用户偏好领域事件
 */
export type UserPreferencesDomainEvent =
  | { type: 'UserPreferencesCreated'; payload: UserPreferencesCreatedEventPayload }
  | { type: 'UserPreferencesUpdated'; payload: UserPreferencesUpdatedEventPayload }
  | { type: 'ThemeModeChanged'; payload: ThemeModeChangedEventPayload }
  | { type: 'LanguageChanged'; payload: LanguageChangedEventPayload }
  | { type: 'TimezoneChanged'; payload: TimezoneChangedEventPayload }
  | { type: 'NotificationSettingsChanged'; payload: NotificationSettingsChangedEventPayload }
  | { type: 'AppPreferencesChanged'; payload: AppPreferencesChangedEventPayload }
  | { type: 'PrivacySettingsChanged'; payload: PrivacySettingsChangedEventPayload };

/**
 * 所有设置领域事件
 */
export type SettingDomainEvent =
  | SettingDefinitionDomainEvent
  | SettingGroupDomainEvent
  | SettingValueDomainEvent
  | SettingBackupDomainEvent
  | SettingValidationDomainEvent
  | SettingMigrationDomainEvent
  | SettingMonitoringDomainEvent
  | UserPreferencesDomainEvent;
