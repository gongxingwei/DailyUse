/**
 * UserSetting Aggregate Root - Server Interface
 * 用户设置聚合根 - 服务端接口
 */

import type { UserSettingClientDTO } from './UserSettingClient';
// ============ DTO 定义 ============

/**
 * UserSetting Server DTO
 */
export interface UserSettingServerDTO {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12H' | '24H';
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string;
  };
  workflow: {
    defaultTaskView: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView: 'DAY' | 'WEEK' | 'MONTH';
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  experimental: {
    enabled: boolean;
    features: string[];
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * UserSetting Persistence DTO
 */
export interface UserSettingPersistenceDTO {
  uuid: string;
  accountUuid: string;
  appearance: string; // JSON
  locale: string; // JSON
  workflow: string; // JSON
  shortcuts: string; // JSON
  privacy: string; // JSON
  experimental: string; // JSON
  createdAt: number;
  updatedAt: number;
}

// ============ 聚合根接口 ============

export interface UserSettingServer {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12H' | '24H';
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string;
  };
  workflow: {
    defaultTaskView: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView: 'DAY' | 'WEEK' | 'MONTH';
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  experimental: {
    enabled: boolean;
    features: string[];
  };
  createdAt: number;
  updatedAt: number;

  // 外观管理
  updateAppearance(appearance: Partial<UserSettingServer['appearance']>): void;
  updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void;

  // 语言和区域
  updateLocale(locale: Partial<UserSettingServer['locale']>): void;
  updateLanguage(language: string): void;
  updateTimezone(timezone: string): void;

  // 工作流
  updateWorkflow(workflow: Partial<UserSettingServer['workflow']>): void;

  // 快捷键
  updateShortcut(action: string, shortcut: string): void;
  removeShortcut(action: string): void;

  // 隐私
  updatePrivacy(privacy: Partial<UserSettingServer['privacy']>): void;

  // 实验性功能
  enableExperimentalFeature(feature: string): void;
  disableExperimentalFeature(feature: string): void;

  toServerDTO(): UserSettingServerDTO;
  toClientDTO(): UserSettingClientDTO;
  toPersistenceDTO(): UserSettingPersistenceDTO;
}

export interface UserSettingServerStatic {
  create(params: {
    accountUuid: string;
    appearance?: Partial<UserSettingServer['appearance']>;
    locale?: Partial<UserSettingServer['locale']>;
    workflow?: Partial<UserSettingServer['workflow']>;
    shortcuts?: Partial<UserSettingServer['shortcuts']>;
    privacy?: Partial<UserSettingServer['privacy']>;
    experimental?: Partial<UserSettingServer['experimental']>;
  }): UserSettingServer;
  fromServerDTO(dto: UserSettingServerDTO): UserSettingServer;
  fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSettingServer;
}
