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
