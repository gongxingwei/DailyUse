/**
 * Setting Module Enums
 * 设置模块枚举定义
 */

// ============ 值类型枚举 ============

/**
 * 设置值类型
 */
export enum SettingValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

// ============ 作用域枚举 ============

/**
 * 设置作用域
 */
export enum SettingScope {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  DEVICE = 'DEVICE',
}

// ============ UI 输入类型枚举 ============

/**
 * UI 输入类型
 */
export enum UIInputType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SWITCH = 'SWITCH',
  SELECT = 'SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  SLIDER = 'SLIDER',
  COLOR = 'COLOR',
  FILE = 'FILE',
}

// ============ 操作者类型枚举 ============

/**
 * 操作者类型
 */
export enum OperatorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  API = 'API',
}

// ============ 环境枚举 ============

/**
 * 应用环境
 */
export enum AppEnvironment {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

// ============ 主题枚举 ============

/**
 * 主题模式
 */
export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

// ============ 字体大小枚举 ============

/**
 * 字体大小
 */
export enum FontSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

// ============ 日期格式枚举 ============

/**
 * 日期格式
 */
export enum DateFormat {
  YYYY_MM_DD = 'YYYY-MM-DD',
  DD_MM_YYYY = 'DD/MM/YYYY',
  MM_DD_YYYY = 'MM/DD/YYYY',
}

// ============ 时间格式枚举 ============

/**
 * 时间格式
 */
export enum TimeFormat {
  H12 = '12H',
  H24 = '24H',
}

// ============ 视图类型枚举 ============

/**
 * 任务视图类型
 */
export enum TaskViewType {
  LIST = 'LIST',
  KANBAN = 'KANBAN',
  CALENDAR = 'CALENDAR',
}

/**
 * 目标视图类型
 */
export enum GoalViewType {
  LIST = 'LIST',
  TREE = 'TREE',
  TIMELINE = 'TIMELINE',
}

/**
 * 日程视图类型
 */
export enum ScheduleViewType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

// ============ 隐私可见性枚举 ============

/**
 * 隐私可见性
 */
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
}
