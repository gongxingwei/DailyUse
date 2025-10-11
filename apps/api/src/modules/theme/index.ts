/**
 * Theme Module Index
 * 主题模块统一导出
 */

// Domain Layer (now in @dailyuse/domain-server)
// export { UserThemePreference } from '@dailyuse/domain-server';
// export { ThemeDomainService } from '@dailyuse/domain-server';

// Repository Interface (in infrastructure)
export type { IUserThemePreferenceRepository } from './infrastructure/repositories/IUserThemePreferenceRepository';

// Application Layer
export { ThemeApplicationService } from './application/services/ThemeApplicationService';

// Infrastructure Layer
export { PrismaUserThemePreferenceRepository } from './infrastructure/repositories/PrismaUserThemePreferenceRepository';

// Interface Layer
export { ThemeController, themeRouter } from './interface';

// Initialization Layer
export { registerThemeInitializationTasks } from './initialization/themeInitialization';
