import { Router } from 'express';
import reminderTemplateRoutes from './routes/reminderTemplateRoutes';
import reminderTemplateGroupRoutes from './routes/reminderTemplateGroupRoutes';

/**
 * Reminder模块主路由
 * 使用DDD架构，按聚合根分离路由
 */
const router = Router();

// ========== ReminderTemplate 聚合根路由 ==========
// 路径: /api/reminders/templates/*
router.use('/templates', reminderTemplateRoutes);

// ========== ReminderTemplateGroup 聚合根路由 ==========
// 路径: /api/reminders/groups/*
router.use('/groups', reminderTemplateGroupRoutes);

export default router;
