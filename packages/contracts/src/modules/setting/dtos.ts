/**
 * Setting 模块数据传输对象定义
 *
 * 定义设置相关的请求和响应数据结构
 */

import type {
  ISettingDefinition,
  ISettingGroup,
  ISettingValue,
  ISettingChangeRecord,
  ISettingBackup,
  SettingStatistics,
  SettingQueryParams,
  SettingType,
  SettingScope,
  SettingCategory,
  SettingValidationRule,
  SettingOption,
} from './types';

// ========== 核心数据传输对象 ==========

/**
 * 设置定义 DTO
 */
export interface SettingDefinitionDTO {
  /** 设置键 */
  key: string;
  /** 设置标题 */
  title: string;
  /** 设置描述 */
  description?: string;
  /** 设置类型 */
  type: SettingType;
  /** 设置范围 */
  scope: SettingScope;
  /** 设置分类 */
  category: SettingCategory;
  /** 默认值 */
  defaultValue: any;
  /** 当前值 */
  value?: any;
  /** 可选项（用于枚举类型） */
  options?: SettingOption[];
  /** 验证规则 */
  validationRules?: SettingValidationRule[];
  /** 是否只读 */
  readonly: boolean;
  /** 是否隐藏 */
  hidden: boolean;
  /** 是否需要重启 */
  requiresRestart: boolean;
  /** 排序权重 */
  order: number;
  /** 依赖的设置 */
  dependsOn?: string[];
  /** 标签 */
  tags?: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 设置组 DTO
 */
export interface SettingGroupDTO {
  /** 组ID */
  id: string;
  /** 组标题 */
  title: string;
  /** 组描述 */
  description?: string;
  /** 组分类 */
  category: SettingCategory;
  /** 组图标 */
  icon?: string;
  /** 包含的设置 */
  settings: SettingDefinitionDTO[];
  /** 是否可折叠 */
  collapsible: boolean;
  /** 是否默认展开 */
  defaultExpanded: boolean;
  /** 排序权重 */
  order: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 设置值 DTO
 */
export interface SettingValueDTO {
  /** 设置键 */
  key: string;
  /** 设置值 */
  value: any;
  /** 设置范围 */
  scope: SettingScope;
  /** 最后修改时间 */
  lastModified: string;
  /** 修改者 */
  modifiedBy?: string;
  /** 是否为默认值 */
  isDefault: boolean;
}

/**
 * 设置更改记录 DTO
 */
export interface SettingChangeRecordDTO {
  /** 记录ID */
  id: string;
  /** 设置键 */
  key: string;
  /** 旧值 */
  oldValue: any;
  /** 新值 */
  newValue: any;
  /** 设置范围 */
  scope: SettingScope;
  /** 更改时间 */
  changedAt: string;
  /** 更改者 */
  changedBy: string;
  /** 更改原因 */
  reason?: string;
}

/**
 * 设置备份 DTO
 */
export interface SettingBackupDTO {
  /** 备份ID */
  id: string;
  /** 备份名称 */
  name: string;
  /** 备份描述 */
  description?: string;
  /** 设置数据 */
  settings: Record<string, any>;
  /** 备份时间 */
  createdAt: string;
  /** 应用版本 */
  appVersion: string;
  /** 设置版本 */
  settingsVersion: string;
}

// ========== 请求 DTO ==========

/**
 * 创建设置定义请求 DTO
 */
export interface CreateSettingDefinitionRequestDTO {
  /** 设置键 */
  key: string;
  /** 设置标题 */
  title: string;
  /** 设置描述 */
  description?: string;
  /** 设置类型 */
  type: SettingType;
  /** 设置范围 */
  scope: SettingScope;
  /** 设置分类 */
  category: SettingCategory;
  /** 默认值 */
  defaultValue: any;
  /** 可选项（用于枚举类型） */
  options?: SettingOption[];
  /** 验证规则 */
  validationRules?: SettingValidationRule[];
  /** 是否只读 */
  readonly?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否需要重启 */
  requiresRestart?: boolean;
  /** 排序权重 */
  order?: number;
  /** 依赖的设置 */
  dependsOn?: string[];
  /** 标签 */
  tags?: string[];
}

/**
 * 更新设置定义请求 DTO
 */
export interface UpdateSettingDefinitionRequestDTO {
  /** 设置标题 */
  title?: string;
  /** 设置描述 */
  description?: string;
  /** 设置类型 */
  type?: SettingType;
  /** 设置范围 */
  scope?: SettingScope;
  /** 设置分类 */
  category?: SettingCategory;
  /** 默认值 */
  defaultValue?: any;
  /** 可选项（用于枚举类型） */
  options?: SettingOption[];
  /** 验证规则 */
  validationRules?: SettingValidationRule[];
  /** 是否只读 */
  readonly?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否需要重启 */
  requiresRestart?: boolean;
  /** 排序权重 */
  order?: number;
  /** 依赖的设置 */
  dependsOn?: string[];
  /** 标签 */
  tags?: string[];
}

/**
 * 创建设置组请求 DTO
 */
export interface CreateSettingGroupRequestDTO {
  /** 组ID */
  id: string;
  /** 组标题 */
  title: string;
  /** 组描述 */
  description?: string;
  /** 组分类 */
  category: SettingCategory;
  /** 组图标 */
  icon?: string;
  /** 包含的设置键 */
  settingKeys: string[];
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 排序权重 */
  order?: number;
}

/**
 * 更新设置组请求 DTO
 */
export interface UpdateSettingGroupRequestDTO {
  /** 组标题 */
  title?: string;
  /** 组描述 */
  description?: string;
  /** 组分类 */
  category?: SettingCategory;
  /** 组图标 */
  icon?: string;
  /** 包含的设置键 */
  settingKeys?: string[];
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 排序权重 */
  order?: number;
}

/**
 * 更新设置值请求 DTO
 */
export interface UpdateSettingValueRequestDTO {
  /** 设置值 */
  value: any;
  /** 设置范围 */
  scope?: SettingScope;
  /** 更改原因 */
  reason?: string;
}

/**
 * 批量更新设置值请求 DTO
 */
export interface BatchUpdateSettingValuesRequestDTO {
  /** 设置值映射 */
  settings: Record<
    string,
    {
      value: any;
      scope?: SettingScope;
    }
  >;
  /** 更改原因 */
  reason?: string;
}

/**
 * 创建设置备份请求 DTO
 */
export interface CreateSettingBackupRequestDTO {
  /** 备份名称 */
  name: string;
  /** 备份描述 */
  description?: string;
  /** 包含的设置键（为空表示全部） */
  settingKeys?: string[];
  /** 包含的范围 */
  scopes?: SettingScope[];
}

/**
 * 恢复设置备份请求 DTO
 */
export interface RestoreSettingBackupRequestDTO {
  /** 备份ID */
  backupId: string;
  /** 是否覆盖现有设置 */
  overwrite?: boolean;
  /** 包含的设置键（为空表示全部） */
  settingKeys?: string[];
}

// ========== 响应 DTO ==========

/**
 * 设置定义响应 DTO
 */
export interface SettingDefinitionResponseDTO {
  /** 设置定义 */
  definition: SettingDefinitionDTO;
}

/**
 * 设置定义列表响应 DTO
 */
export interface SettingDefinitionListResponseDTO {
  /** 设置定义列表 */
  definitions: SettingDefinitionDTO[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 设置组响应 DTO
 */
export interface SettingGroupResponseDTO {
  /** 设置组 */
  group: SettingGroupDTO;
}

/**
 * 设置组列表响应 DTO
 */
export interface SettingGroupListResponseDTO {
  /** 设置组列表 */
  groups: SettingGroupDTO[];
  /** 总数 */
  total: number;
}

/**
 * 设置值响应 DTO
 */
export interface SettingValueResponseDTO {
  /** 设置值 */
  value: SettingValueDTO;
}

/**
 * 设置值列表响应 DTO
 */
export interface SettingValueListResponseDTO {
  /** 设置值列表 */
  values: SettingValueDTO[];
  /** 总数 */
  total: number;
}

/**
 * 设置更改记录响应 DTO
 */
export interface SettingChangeRecordResponseDTO {
  /** 设置更改记录 */
  record: SettingChangeRecordDTO;
}

/**
 * 设置更改记录列表响应 DTO
 */
export interface SettingChangeRecordListResponseDTO {
  /** 设置更改记录列表 */
  records: SettingChangeRecordDTO[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 设置备份响应 DTO
 */
export interface SettingBackupResponseDTO {
  /** 设置备份 */
  backup: SettingBackupDTO;
}

/**
 * 设置备份列表响应 DTO
 */
export interface SettingBackupListResponseDTO {
  /** 设置备份列表 */
  backups: SettingBackupDTO[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 设置统计响应 DTO
 */
export interface SettingStatisticsResponseDTO {
  /** 统计信息 */
  statistics: SettingStatistics;
}

/**
 * 批量操作响应 DTO
 */
export interface BatchOperationResponseDTO {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 失败的键列表 */
  failedKeys: string[];
  /** 错误消息 */
  errors: string[];
}

/**
 * 设置验证响应 DTO
 */
export interface SettingValidationResponseDTO {
  /** 是否有效 */
  isValid: boolean;
  /** 验证错误 */
  errors: {
    key: string;
    message: string;
  }[];
}

// ========== 查询参数 DTO ==========

/**
 * 设置定义查询参数 DTO
 */
export interface SettingDefinitionQueryParamsDTO extends SettingQueryParams {
  /** 包含当前值 */
  includeValues?: boolean;
}

/**
 * 设置更改记录查询参数 DTO
 */
export interface SettingChangeRecordQueryParamsDTO {
  /** 设置键 */
  keys?: string[];
  /** 设置范围 */
  scopes?: SettingScope[];
  /** 更改者 */
  changedBy?: string;
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 设置备份查询参数 DTO
 */
export interface SettingBackupQueryParamsDTO {
  /** 备份名称关键字 */
  nameKeyword?: string;
  /** 应用版本 */
  appVersion?: string;
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

// ========== UserPreferences（用户偏好）DTO ==========

/**
 * 用户偏好基础接口
 */
export interface IUserPreferences {
  /** 用户偏好UUID */
  uuid: string;
  /** 账户UUID */
  accountUuid: string;

  // 基础偏好
  /** 语言设置 */
  language: string; // 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  /** 时区设置 */
  timezone: string; // 'Asia/Shanghai' | 'America/New_York' | ...
  /** 地区设置 */
  locale: string;

  // 主题偏好
  /** 主题模式 */
  themeMode: 'light' | 'dark' | 'system';

  // 通知偏好
  /** 是否启用通知 */
  notificationsEnabled: boolean;
  /** 是否启用邮件通知 */
  emailNotifications: boolean;
  /** 是否启用推送通知 */
  pushNotifications: boolean;

  // 应用偏好
  /** 是否开机自启动 */
  autoLaunch: boolean;
  /** 默认打开的模块 */
  defaultModule: string; // 'goal' | 'task' | 'editor' | 'schedule'

  // 隐私偏好
  /** 是否启用数据分析 */
  analyticsEnabled: boolean;
  /** 是否启用崩溃报告 */
  crashReportsEnabled: boolean;

  // 时间戳
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 用户偏好客户端扩展接口
 */
export interface IUserPreferencesClient extends IUserPreferences {
  // UI 计算属性
  /** 语言显示文本 */
  languageText: string; // '简体中文' | 'English' | ...
  /** 时区显示文本 */
  timezoneText: string; // 'GMT+8 上海' | 'GMT-5 纽约' | ...
  /** 主题模式图标 */
  themeModeIcon: string; // 'mdi-white-balance-sunny' | 'mdi-weather-night' | 'mdi-theme-light-dark'
  /** 主题模式显示文本 */
  themeModeText: string; // '浅色' | '深色' | '跟随系统'

  // 状态属性
  /** 是否可以更改主题 */
  canChangeTheme: boolean;
  /** 是否已启用邮件 */
  hasEmailEnabled: boolean;
  /** 是否已启用推送 */
  hasPushEnabled: boolean;

  // 格式化时间
  /** 格式化的创建时间 */
  formattedCreatedAt: string;
  /** 格式化的更新时间 */
  formattedUpdatedAt: string;
}

/**
 * 用户偏好 DTO
 */
export type UserPreferencesDTO = IUserPreferences;

/**
 * 用户偏好客户端 DTO
 */
export type UserPreferencesClientDTO = IUserPreferencesClient;

/**
 * 用户偏好持久化 DTO（数据库格式）
 */
export interface UserPreferencesPersistenceDTO {
  uuid: string;
  accountUuid: string;
  language: string;
  timezone: string;
  locale: string;
  themeMode: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoLaunch: boolean;
  defaultModule: string;
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========== UserPreferences 请求 DTO ==========

/**
 * 更新用户偏好请求 DTO
 */
export interface UpdateUserPreferencesRequestDTO {
  /** 语言设置 */
  language?: string;
  /** 时区设置 */
  timezone?: string;
  /** 地区设置 */
  locale?: string;
  /** 主题模式 */
  themeMode?: 'light' | 'dark' | 'system';
  /** 是否启用通知 */
  notificationsEnabled?: boolean;
  /** 是否启用邮件通知 */
  emailNotifications?: boolean;
  /** 是否启用推送通知 */
  pushNotifications?: boolean;
  /** 是否开机自启动 */
  autoLaunch?: boolean;
  /** 默认打开的模块 */
  defaultModule?: string;
  /** 是否启用数据分析 */
  analyticsEnabled?: boolean;
  /** 是否启用崩溃报告 */
  crashReportsEnabled?: boolean;
}

/**
 * 切换主题模式请求 DTO
 */
export interface SwitchThemeModeRequestDTO {
  /** 主题模式 */
  mode: 'light' | 'dark' | 'system';
}

/**
 * 更改语言请求 DTO
 */
export interface ChangeLanguageRequestDTO {
  /** 语言代码 */
  language: string; // 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
}

/**
 * 更改时区请求 DTO
 */
export interface ChangeTimezoneRequestDTO {
  /** 时区 */
  timezone: string;
}

/**
 * 设置通知请求 DTO
 */
export interface SetNotificationsRequestDTO {
  /** 是否启用通知 */
  enabled: boolean;
  /** 是否同时设置子选项 */
  includeSubOptions?: boolean;
}

// ========== UserPreferences 响应 DTO ==========

/**
 * 用户偏好响应 DTO
 */
export interface UserPreferencesResponseDTO {
  /** 用户偏好数据 */
  preferences: UserPreferencesDTO;
}

/**
 * 用户偏好客户端响应 DTO
 */
export interface UserPreferencesClientResponseDTO {
  /** 用户偏好客户端数据 */
  preferences: UserPreferencesClientDTO;
}

/**
 * 用户偏好列表响应 DTO
 */
export interface UserPreferencesListResponseDTO {
  /** 用户偏好列表 */
  preferences: UserPreferencesDTO[];
  /** 总数 */
  total: number;
}
