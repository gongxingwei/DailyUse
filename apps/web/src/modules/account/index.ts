/**
 * 账户模块导出
 * Account Module Exports
 */

// 初始化函数导出
export { registerAccountInitializationTasks } from './initialization/accountInitialization';

// 事件处理器导出
export { AccountEventHandlers } from './application/events/accountEventHandlers';

// 应用服务导出
export { ApplicationService as AccountApplicationService } from './application/services/ApplicationService';

// API 客户端导出
export { AccountApiService } from './infrastructure/api/ApiClient';

// Store 导出
export { useAccountStore } from './presentation/stores/useAccountStore';

// Composables 导出
export { useAccountService } from './presentation/composables/useAccountService';
