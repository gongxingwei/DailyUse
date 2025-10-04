import { Router } from 'express';
import reminderTemplateRoutes from './routes/reminderTemplateRoutes';
import reminderTemplateGroupRoutes from './routes/reminderTemplateGroupRoutes';

/**
 * Reminder模块主路由
 * 采用 DDD 聚合根控制模式，一个聚合根对应一个路由文件
 *
 * 路由组织：
 * - reminderTemplateRoutes.ts → ReminderTemplateController（提醒模板聚合根）
 * - reminderTemplateGroupRoutes.ts → ReminderTemplateGroupController（提醒分组聚合根）
 */
const router = Router();

// ========== ReminderTemplate 聚合根路由 ==========
// 路径: /api/reminders/templates/*
router.use('/templates', reminderTemplateRoutes);

// ========== ReminderTemplateGroup 聚合根路由 ==========
// 路径: /api/reminders/groups/*
router.use('/groups', reminderTemplateGroupRoutes);

export default router;
