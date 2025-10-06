/**
 * Theme Module Server Implementation Index
 * @description 主题模块服务端实现入口
 * @author DailyUse Team
 * @date 2025-10-06
 */

// 导出聚合
export { ThemeDefinition } from './aggregates/ThemeDefinition';

// TODO: ThemeConfig needs refactoring - currently a stub for backwards compatibility
export { ThemeConfig } from './aggregates/ThemeServer';

// 导出实体
export { UserThemePreference } from './entities/UserThemePreference';

// 导出领域服务
export { ThemeDomainService } from './services/ThemeDomainService';

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
