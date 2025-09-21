import { Router } from 'express';
import { ReminderTemplateGroupController } from '../controllers/ReminderTemplateGroupController';

/**
 * ReminderTemplateGroup 聚合根的独立路由
 * 路径前缀：/api/reminders/groups
 */
const router = Router();

// ========== ReminderTemplateGroup 聚合根路由 ==========

/**
 * 创建提醒模板分组
 * POST /api/reminders/groups
 */
router.post('/', ReminderTemplateGroupController.createTemplateGroup);

/**
 * 获取账户的所有提醒模板分组
 * GET /api/reminders/groups
 */
router.get('/', ReminderTemplateGroupController.getTemplateGroups);

/**
 * 获取特定分组
 * GET /api/reminders/groups/:groupUuid
 */
router.get('/:groupUuid', ReminderTemplateGroupController.getTemplateGroup);

/**
 * 更新提醒模板分组
 * PUT /api/reminders/groups/:groupUuid
 */
router.put('/:groupUuid', ReminderTemplateGroupController.updateTemplateGroup);

/**
 * 删除提醒模板分组
 * DELETE /api/reminders/groups/:groupUuid
 */
router.delete('/:groupUuid', ReminderTemplateGroupController.deleteTemplateGroup);

/**
 * 切换分组启用状态
 * PATCH /api/reminders/groups/:groupUuid/toggle
 */
router.patch('/:groupUuid/toggle', ReminderTemplateGroupController.toggleTemplateGroupEnabled);

export default router;
