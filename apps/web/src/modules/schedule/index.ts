/**
 * Schedule 模块导出
 * @description 按照DDD架构重新组织的调度模块导出
 * @author DailyUse Team
 * @date 2025-01-09
 */

// 应用服务层
export {
  scheduleWebApplicationService,
  getScheduleWebService,
} from './application/services/ScheduleWebApplicationService';

// 表示层 - Composables
export { useSchedule } from './presentation/composables/useSchedule';

// 基础设施层
export { scheduleApiClient } from './infrastructure/api/scheduleApiClient';

// 表示层 - 视图组件
export { default as ScheduleManagementView } from './presentation/views/ScheduleManagementView.vue';

// 表示层 - 工具组件
export { default as ScheduleTaskDialog } from './presentation/components/ScheduleTaskDialog.vue';
export { default as ScheduleIntegrationPanel } from './presentation/components/ScheduleIntegrationPanel.vue';
export { default as RealtimeNotificationPanel } from './presentation/components/RealtimeNotificationPanel.vue';

// 路由
export { scheduleRoutes } from './router';

// 初始化
export { registerScheduleInitializationTasks } from './initialization/scheduleInitialization';
