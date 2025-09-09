/**
 * Setting 模块类型定义
 *
 * 定义设置相关的接口、枚举和类型
 */

// ========== 枚举类型 ==========

/**
 * 设置类型枚举
 */
export enum SettingType {
  /** 字符串 */
  STRING = 'string',
  /** 数字 */
  NUMBER = 'number',
  /** 布尔值 */
  BOOLEAN = 'boolean',
  /** 对象 */
  OBJECT = 'object',
  /** 数组 */
  ARRAY = 'array',
  /** 枚举 */
  ENUM = 'enum',
}

/**
 * 设置范围枚举
 */
export enum SettingScope {
  /** 全局设置 */
  GLOBAL = 'global',
  /** 用户设置 */
  USER = 'user',
  /** 工作区设置 */
  WORKSPACE = 'workspace',
  /** 会话设置 */
  SESSION = 'session',
}

/**
 * 设置分类枚举
 */
export enum SettingCategory {
  /** 通用设置 */
  GENERAL = 'general',
  /** 外观设置 */
  APPEARANCE = 'appearance',
  /** 编辑器设置 */
  EDITOR = 'editor',
  /** 通知设置 */
  NOTIFICATIONS = 'notifications',
  /** 任务设置 */
  TASKS = 'tasks',
  /** 提醒设置 */
  REMINDERS = 'reminders',
  /** 目标设置 */
  GOALS = 'goals',
  /** 高级设置 */
  ADVANCED = 'advanced',
  /** 隐私设置 */
  PRIVACY = 'privacy',
  /** 安全设置 */
  SECURITY = 'security',
}

// ========== 接口定义 ==========

/**
 * 设置验证规则接口
 */
export interface SettingValidationRule {
  /** 规则类型 */
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  /** 规则值 */
  value?: any;
  /** 错误消息 */
  message: string;
  /** 自定义验证函数 */
  validator?: (value: any) => boolean;
}

/**
 * 设置选项接口
 */
export interface SettingOption {
  /** 选项标签 */
  label: string;
  /** 选项值 */
  value: any;
  /** 选项描述 */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 设置定义接口
 */
export interface ISettingDefinition {
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
}

/**
 * 设置组接口
 */
export interface ISettingGroup {
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
  settings: ISettingDefinition[];
  /** 是否可折叠 */
  collapsible: boolean;
  /** 是否默认展开 */
  defaultExpanded: boolean;
  /** 排序权重 */
  order: number;
}

/**
 * 设置值接口
 */
export interface ISettingValue {
  /** 设置键 */
  key: string;
  /** 设置值 */
  value: any;
  /** 设置范围 */
  scope: SettingScope;
  /** 最后修改时间 */
  lastModified: Date;
  /** 修改者 */
  modifiedBy?: string;
  /** 是否为默认值 */
  isDefault: boolean;
}

/**
 * 设置更改记录接口
 */
export interface ISettingChangeRecord {
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
  changedAt: Date;
  /** 更改者 */
  changedBy: string;
  /** 更改原因 */
  reason?: string;
}

/**
 * 设置导入导出接口
 */
export interface ISettingBackup {
  /** 备份ID */
  id: string;
  /** 备份名称 */
  name: string;
  /** 备份描述 */
  description?: string;
  /** 设置数据 */
  settings: Record<string, any>;
  /** 备份时间 */
  createdAt: Date;
  /** 应用版本 */
  appVersion: string;
  /** 设置版本 */
  settingsVersion: string;
}

/**
 * 设置统计信息接口
 */
export interface SettingStatistics {
  /** 总设置数 */
  totalSettings: number;
  /** 自定义设置数 */
  customizedSettings: number;
  /** 默认设置数 */
  defaultSettings: number;
  /** 按分类统计 */
  byCategory: Record<SettingCategory, number>;
  /** 按范围统计 */
  byScope: Record<SettingScope, number>;
  /** 按类型统计 */
  byType: Record<SettingType, number>;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 设置查询参数接口
 */
export interface SettingQueryParams {
  /** 设置分类 */
  category?: SettingCategory[];
  /** 设置范围 */
  scope?: SettingScope[];
  /** 设置类型 */
  type?: SettingType[];
  /** 是否只显示自定义设置 */
  customizedOnly?: boolean;
  /** 关键字搜索 */
  keyword?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}
