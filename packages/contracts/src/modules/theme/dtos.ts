/**
 * Theme Module DTOs
 * @description 主题模块的数据传输对象定义
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { ThemeType, type IThemeDefinition, type IThemeConfig } from './types';

// ========== 请求 DTOs ==========

/**
 * 创建主题请求 DTO
 */
export interface CreateThemeRequestDto {
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 主题类型 */
  type: ThemeType;
  /** 基于现有主题ID（可选） */
  baseThemeId?: string;
  /** 颜色配置 */
  colors?: Record<string, string>;
  /** 字体配置 */
  fonts?: Record<string, any>;
  /** 自定义变量 */
  customVariables?: Record<string, string>;
}

/**
 * 更新主题请求 DTO
 */
export interface UpdateThemeRequestDto {
  /** 主题名称 */
  name?: string;
  /** 主题描述 */
  description?: string;
  /** 颜色配置 */
  colors?: Record<string, string>;
  /** 字体配置 */
  fonts?: Record<string, any>;
  /** 自定义变量 */
  customVariables?: Record<string, string>;
}

/**
 * 应用主题请求 DTO
 */
export interface ApplyThemeRequestDto {
  /** 主题ID */
  themeId: string;
  /** 应用范围 */
  scope?: string[];
  /** 是否立即应用 */
  immediate?: boolean;
  /** 过渡动画时长 */
  transitionDuration?: number;
}

/**
 * 主题配置更新请求 DTO
 */
export interface UpdateThemeConfigRequestDto {
  /** 是否跟随系统主题 */
  followSystemTheme?: boolean;
  /** 自动切换主题 */
  autoSwitchTheme?: boolean;
  /** 白天主题ID */
  lightThemeId?: string;
  /** 夜间主题ID */
  darkThemeId?: string;
  /** 切换时间 */
  switchTimes?: {
    dayStart: string;
    nightStart: string;
  };
  /** 是否启用过渡动画 */
  enableTransitions?: boolean;
  /** 过渡动画持续时间 */
  transitionDuration?: number;
}

/**
 * 导出主题请求 DTO
 */
export interface ExportThemeRequestDto {
  /** 主题ID数组 */
  themeIds: string[];
  /** 导出格式 */
  format: 'json' | 'css' | 'scss' | 'zip';
  /** 是否包含预览图 */
  includePreview?: boolean;
  /** 是否包含自定义变量 */
  includeCustomVariables?: boolean;
}

/**
 * 导入主题请求 DTO
 */
export interface ImportThemeRequestDto {
  /** 主题数据 */
  themeData: string | object;
  /** 数据格式 */
  format: 'json' | 'css' | 'scss';
  /** 是否覆盖同名主题 */
  overwrite?: boolean;
  /** 导入后是否自动应用 */
  autoApply?: boolean;
}

// ========== 响应 DTOs ==========

/**
 * 主题响应 DTO
 */
export interface ThemeResponseDto {
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
  /** 是否为内置主题 */
  isBuiltIn: boolean;
  /** 是否为当前激活主题 */
  isActive: boolean;
  /** 预览图URL */
  previewUrl?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 主题详情响应 DTO
 */
export interface ThemeDetailResponseDto extends ThemeResponseDto {
  /** 完整主题定义 */
  definition: IThemeDefinition;
  /** 使用统计 */
  statistics?: {
    usageCount: number;
    lastUsed?: Date;
    totalDuration: number;
  };
}

/**
 * 主题配置响应 DTO
 */
export interface ThemeConfigResponseDto {
  /** 用户ID */
  userId: string;
  /** 当前激活主题ID */
  activeThemeId: string;
  /** 主题配置 */
  config: IThemeConfig;
  /** 可用主题列表 */
  availableThemes: ThemeResponseDto[];
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 主题应用结果响应 DTO
 */
export interface ThemeApplicationResultDto {
  /** 是否成功 */
  success: boolean;
  /** 应用的主题ID */
  appliedThemeId: string;
  /** 应用时间 */
  appliedAt: Date;
  /** 应用的CSS */
  appliedCss?: string;
  /** 错误信息 */
  error?: string;
  /** 警告信息 */
  warnings?: string[];
}

/**
 * 主题导出结果响应 DTO
 */
export interface ThemeExportResultDto {
  /** 是否成功 */
  success: boolean;
  /** 导出文件URL或内容 */
  exportData: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 导出格式 */
  format: string;
  /** 导出时间 */
  exportedAt: Date;
}

/**
 * 主题导入结果响应 DTO
 */
export interface ThemeImportResultDto {
  /** 是否成功 */
  success: boolean;
  /** 成功导入的主题 */
  importedThemes: ThemeResponseDto[];
  /** 失败的主题 */
  failedThemes: Array<{
    name: string;
    error: string;
  }>;
  /** 总数 */
  total: number;
  /** 成功数 */
  successful: number;
  /** 失败数 */
  failed: number;
  /** 导入时间 */
  importedAt: Date;
}

/**
 * 主题列表响应 DTO
 */
export interface ThemeListResponseDto {
  /** 主题列表 */
  themes: ThemeResponseDto[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 主题统计响应 DTO
 */
export interface ThemeStatisticsResponseDto {
  /** 用户ID */
  userId: string;
  /** 总主题数 */
  totalThemes: number;
  /** 内置主题数 */
  builtInThemes: number;
  /** 自定义主题数 */
  customThemes: number;
  /** 按类型统计 */
  byType: Record<ThemeType, number>;
  /** 最常用的主题 */
  mostUsedTheme: {
    id: string;
    name: string;
    usageCount: number;
  };
  /** 主题使用时长（分钟） */
  totalUsageDuration: number;
  /** 今日使用时长（分钟） */
  todayUsageDuration: number;
  /** 统计更新时间 */
  updatedAt: Date;
}
