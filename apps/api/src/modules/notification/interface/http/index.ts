/**
 * Notification Module HTTP Interface
 * @description 导出所有控制器和路由
 */

export * from './controllers/NotificationController';
export * from './controllers/NotificationPreferenceController';
export {
  default as notificationRoutes,
  notificationPreferenceRoutes,
} from './routes/notificationRoutes';
