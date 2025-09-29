/**
 * Theme Module Server Implementation Index
 * @description 主题模块服务端实现入口
 * @author DailyUse Team
 * @date 2025-09-29
 */

// 导出聚合
export { ThemeDefinition, ThemeConfig } from './aggregates/ThemeServer';

// 导出服务
export { ThemeService } from './services/ThemeService';
export type {
  CreateThemeRequest,
  ThemeResponse,
  ApplyThemeRequest,
  ThemeApplicationResult,
  ThemeConfigResponse,
  UpdateThemeConfigRequest,
} from './services/ThemeService';
