/**
 * Notification Module HTTP Interface
 * @description 导出所有控制器和路由
 */

export * from './controllers/NotificationController';
export * from './controllers/NotificationPreferenceController';
export * from './controllers/NotificationTemplateController';
export {
  router as notificationRouter,
  notificationPreferenceRouter,
  notificationTemplateRouter,
} from './routes/notificationRoutes';
export { notificationSSERouter, sseClientManager } from './routes/notificationSSERoutes';
