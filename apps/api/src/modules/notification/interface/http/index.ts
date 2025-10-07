/**
 * Notification Module HTTP Interface
 * @description 导出所有控制器和路由
 */

export * from './controllers/NotificationController';
export * from './controllers/NotificationPreferenceController';
export * from './controllers/NotificationTemplateController';
export {
  default as notificationRoutes,
  notificationPreferenceRoutes,
  notificationTemplateRoutes,
} from './routes/notificationRoutes';
export { notificationSSERoutes } from './routes/notificationSSERoutes';
