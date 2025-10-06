/**
 * Theme 模块类型定义
 *
 * 定义主题相关的接口、枚举和类型
 */

import { ThemeMode, ThemeStatus, ThemeType, ColorMode, FontFamily } from './enums';

// 重新导出枚举类型以便其他文件使用
export { ThemeMode, ThemeStatus, ThemeType, ColorMode, FontFamily };

// ========== 接口定义 ==========

/**
 * 颜色定义接口
 */
export interface ColorDefinition {
  /** 颜色名称 */
  name: string;
  /** 颜色值 */
  value: string;
  /** 颜色描述 */
  description?: string;
  /** 透明度 */
  alpha?: number;
  /** 颜色变量名 */
  variable?: string;
}

/**
 * 颜色调色板接口
 */
export interface ColorPalette {
  /** 调色板名称 */
  name: string;
  /** 主要颜色 */
  primary: ColorDefinition[];
  /** 次要颜色 */
  secondary: ColorDefinition[];
  /** 中性颜色 */
  neutral: ColorDefinition[];
  /** 语义颜色 */
  semantic: {
    success: ColorDefinition;
    warning: ColorDefinition;
    error: ColorDefinition;
    info: ColorDefinition;
  };
  /** 背景颜色 */
  background: ColorDefinition[];
  /** 文本颜色 */
  text: ColorDefinition[];
  /** 边框颜色 */
  border: ColorDefinition[];
}

/**
 * 字体配置接口
 */
export interface FontConfig {
  /** 字体家族 */
  family: FontFamily | string;
  /** 字体大小 */
  size: number;
  /** 字重 */
  weight: number | string;
  /** 行高 */
  lineHeight: number;
  /** 字间距 */
  letterSpacing: number;
}

/**
 * 间距配置接口
 */
export interface SpacingConfig {
  /** 超小间距 */
  xs: number;
  /** 小间距 */
  sm: number;
  /** 中等间距 */
  md: number;
  /** 大间距 */
  lg: number;
  /** 超大间距 */
  xl: number;
  /** 自定义间距 */
  custom?: Record<string, number>;
}

/**
 * 圆角配置接口
 */
export interface BorderRadiusConfig {
  /** 无圆角 */
  none: number;
  /** 小圆角 */
  sm: number;
  /** 中等圆角 */
  md: number;
  /** 大圆角 */
  lg: number;
  /** 圆形 */
  full: number;
  /** 自定义圆角 */
  custom?: Record<string, number>;
}

/**
 * 阴影配置接口
 */
export interface ShadowConfig {
  /** 无阴影 */
  none: string;
  /** 小阴影 */
  sm: string;
  /** 中等阴影 */
  md: string;
  /** 大阴影 */
  lg: string;
  /** 超大阴影 */
  xl: string;
  /** 自定义阴影 */
  custom?: Record<string, string>;
}

/**
 * 动画配置接口
 */
export interface AnimationConfig {
  /** 动画持续时间 */
  duration: {
    /** 快速 */
    fast: number;
    /** 中等 */
    normal: number;
    /** 慢速 */
    slow: number;
  };
  /** 动画缓动函数 */
  easing: {
    /** 线性 */
    linear: string;
    /** 缓入 */
    easeIn: string;
    /** 缓出 */
    easeOut: string;
    /** 缓入缓出 */
    easeInOut: string;
  };
  /** 过渡属性 */
  transition: string;
}

/**
 * 主题定义接口
 */
export interface IThemeDefinition {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 主题类型 */
  type: ThemeType;
  /** 主题作者 */
  author?: string;
  /** 主题版本 */
  version: string;
  /** 颜色调色板 */
  colors: ColorPalette;
  /** 字体配置 */
  fonts: {
    /** 标题字体 */
    heading: FontConfig;
    /** 正文字体 */
    body: FontConfig;
    /** 等宽字体 */
    mono: FontConfig;
  };
  /** 间距配置 */
  spacing: SpacingConfig;
  /** 圆角配置 */
  borderRadius: BorderRadiusConfig;
  /** 阴影配置 */
  shadows: ShadowConfig;
  /** 动画配置 */
  animations: AnimationConfig;
  /** 自定义CSS变量 */
  customVariables?: Record<string, string>;
  /** 主题预览图 */
  preview?: string;
  /** 是否为内置主题 */
  isBuiltIn: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 主题配置接口
 */
export interface IThemeConfig {
  /** 当前激活主题ID */
  activeThemeId: string;
  /** 是否跟随系统主题 */
  followSystemTheme: boolean;
  /** 自动切换主题 */
  autoSwitchTheme: boolean;
  /** 白天主题ID */
  lightThemeId?: string;
  /** 夜间主题ID */
  darkThemeId?: string;
  /** 切换时间 */
  switchTimes?: {
    /** 白天开始时间 */
    dayStart: string;
    /** 夜间开始时间 */
    nightStart: string;
  };
  /** 自定义主题变量 */
  customVariables?: Record<string, string>;
  /** 是否启用主题过渡动画 */
  enableTransitions: boolean;
  /** 过渡动画持续时间 */
  transitionDuration: number;
}

/**
 * 主题应用结果接口
 */
export interface ThemeApplicationResult {
  /** 是否成功 */
  success: boolean;
  /** 应用的主题ID */
  appliedThemeId: string;
  /** 应用时间 */
  appliedAt: Date;
  /** 错误信息 */
  error?: string;
  /** 应用的CSS变量 */
  appliedVariables?: Record<string, string>;
}

/**
 * 主题统计信息接口
 */
export interface ThemeStatistics {
  /** 总主题数 */
  totalThemes: number;
  /** 内置主题数 */
  builtInThemes: number;
  /** 自定义主题数 */
  customThemes: number;
  /** 按类型统计 */
  byType: Record<ThemeType, number>;
  /** 最常用的主题 */
  mostUsedTheme: string;
  /** 主题使用时长 */
  usageDuration: Record<string, number>;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 主题查询参数接口
 */
export interface ThemeQueryParams {
  /** 主题类型 */
  type?: ThemeType[];
  /** 是否内置主题 */
  isBuiltIn?: boolean;
  /** 关键字搜索 */
  keyword?: string;
  /** 作者筛选 */
  author?: string;
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
 * 用户主题偏好接口
 */
export interface IUserThemePreference {
  uuid: string;
  accountUuid: string;
  currentThemeUuid: string; // 当前使用的主题
  preferredMode: ThemeMode; // 偏好模式（light/dark/system）
  autoSwitch: boolean; // 是否自动切换
  scheduleStart?: number; // 自动切换开始时间（小时，如 18 表示 18:00）
  scheduleEnd?: number; // 自动切换结束时间（小时，如 6 表示 6:00）
  createdAt: number;
  updatedAt: number;
}

// ========== 服务端实体接口（不加后缀表示服务端） ==========

/**
 * 主题定义服务端接口
 * 用于服务端业务逻辑和数据库持久化
 */
export interface IThemeDefinition {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 主题类型 */
  type: ThemeType;
  /** 主题作者 */
  author?: string;
  /** 主题版本 */
  version: string;
  /** 颜色调色板 */
  colors: ColorPalette;
  /** 字体配置 */
  fonts: {
    /** 标题字体 */
    heading: FontConfig;
    /** 正文字体 */
    body: FontConfig;
    /** 等宽字体 */
    mono: FontConfig;
  };
  /** 间距配置 */
  spacing: SpacingConfig;
  /** 圆角配置 */
  borderRadius: BorderRadiusConfig;
  /** 阴影配置 */
  shadows: ShadowConfig;
  /** 动画配置 */
  animations: AnimationConfig;
  /** 自定义CSS变量 */
  customVariables?: Record<string, string>;
  /** 主题预览图 */
  preview?: string;
  /** 是否为内置主题 */
  isBuiltIn: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 主题定义客户端接口
 * 扩展服务端接口，添加客户端特有的计算属性和UI辅助信息
 */
export interface IThemeDefinitionClient extends IThemeDefinition {
  /** 是否为当前激活主题（UI计算属性） */
  isActive?: boolean;
  /** 主题分类文本（UI计算属性） */
  typeText?: string;
  /** 主题状态文本（UI计算属性） */
  statusText?: string;
  /** CSS变量数量（UI计算属性） */
  cssVariablesCount?: number;
  /** 预览URL（UI计算属性） */
  previewUrl?: string;
}

/**
 * 主题配置服务端接口
 */
export interface IThemeConfig {
  /** 当前激活主题ID */
  activeThemeId: string;
  /** 是否跟随系统主题 */
  followSystemTheme: boolean;
  /** 自动切换主题 */
  autoSwitchTheme: boolean;
  /** 白天主题ID */
  lightThemeId?: string;
  /** 夜间主题ID */
  darkThemeId?: string;
  /** 切换时间 */
  switchTimes?: {
    /** 白天开始时间 */
    dayStart: string;
    /** 夜间开始时间 */
    nightStart: string;
  };
  /** 自定义主题变量 */
  customVariables?: Record<string, string>;
  /** 是否启用主题过渡动画 */
  enableTransitions: boolean;
  /** 过渡动画持续时间 */
  transitionDuration: number;
}

/**
 * 主题配置客户端接口
 */
export interface IThemeConfigClient extends IThemeConfig {
  /** 当前主题信息（UI计算属性） */
  currentTheme?: {
    id: string;
    name: string;
    type: ThemeType;
  };
  /** 自动切换状态文本（UI计算属性） */
  autoSwitchStatusText?: string;
  /** 是否处于日间模式（UI计算属性） */
  isDayMode?: boolean;
}
