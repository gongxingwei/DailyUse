import { Router } from 'express';
import reminderRoutes from './routes/reminderRoutes';

/**
 * Reminder模块主路由
 * 使用DDD架构，按聚合根组织路由
 * 已整合 ReminderTemplate 和 ReminderTemplateGroup 路由到单一文件
 */
const router = Router();

// ========== 统一的Reminder路由 ==========
// 包含:
// - /api/reminders/templates/* - ReminderTemplate 聚合根路由
// - /api/reminders/groups/* - ReminderTemplateGroup 聚合根路由
router.use('/', reminderRoutes);

export default router;
