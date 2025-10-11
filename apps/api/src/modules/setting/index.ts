/**
 * Setting Module Index
 * 设置模块统一导出
 */

// Application Layer
export { UserPreferencesApplicationService } from './application/services/UserPreferencesApplicationService';

// Infrastructure Layer
export { PrismaUserPreferencesRepository } from './infrastructure/repositories/PrismaUserPreferencesRepository';
export { EventPublisher } from './infrastructure/events/EventPublisher';

// Initialization Layer
export { registerSettingInitializationTasks } from './initialization/settingInitialization';
