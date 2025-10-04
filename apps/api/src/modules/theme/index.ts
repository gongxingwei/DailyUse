/**
 * Theme Module Index
 * 主题模块统一导出
 */

// Domain Layer
export { UserThemePreference } from './domain/entities/UserThemePreference';
export { ThemeDomainService } from './domain/services/ThemeDomainService';
export type { IUserThemePreferenceRepository } from './domain/repositories/IUserThemePreferenceRepository';

// Application Layer
export { ThemeApplicationService } from './application/services/ThemeApplicationService';

// Infrastructure Layer
export { PrismaUserThemePreferenceRepository } from './infrastructure/repositories/PrismaUserThemePreferenceRepository';

// Interface Layer
export { ThemeController, themeRouter } from './interface';
