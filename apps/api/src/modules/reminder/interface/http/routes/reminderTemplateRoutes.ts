import { Router } from 'express';
import { ReminderTemplateController } from '../controllers/ReminderTemplateController';

/**
 * ReminderTemplate 聚合根的独立路由
 * 路径前缀：/api/reminders/templates
 */
const router = Router();

// ========== ReminderTemplate 聚合根路由 ==========

/**
 * 创建提醒模板
 * POST /api/reminders/templates
 */
router.post('/', ReminderTemplateController.createTemplate);

/**
 * 获取账户的所有提醒模板
 * GET /api/reminders/templates
 */
router.get('/', ReminderTemplateController.getTemplatesByAccount);

/**
 * 搜索提醒模板
 * GET /api/reminders/templates/search
 */
router.get('/search', ReminderTemplateController.searchTemplates);

/**
 * 获取活跃的提醒模板
 * GET /api/reminders/templates/active
 */
router.get('/active', ReminderTemplateController.getActiveTemplates);

/**
 * 获取账户统计信息
 * GET /api/reminders/templates/account-stats
 */
router.get('/account-stats', ReminderTemplateController.getAccountStats);

/**
 * 获取单个提醒模板
 * GET /api/reminders/templates/:templateUuid
 */
router.get('/:templateUuid', ReminderTemplateController.getTemplate);

/**
 * 更新提醒模板
 * PUT /api/reminders/templates/:templateUuid
 */
router.put('/:templateUuid', ReminderTemplateController.updateTemplate);

/**
 * 删除提醒模板
 * DELETE /api/reminders/templates/:templateUuid
 */
router.delete('/:templateUuid', ReminderTemplateController.deleteTemplate);

/**
 * 切换模板启用状态
 * PATCH /api/reminders/templates/:templateUuid/toggle
 */
router.patch('/:templateUuid/toggle', ReminderTemplateController.toggleTemplateEnabled);

/**
 * 获取模板统计信息
 * GET /api/reminders/templates/:templateUuid/stats
 */
router.get('/:templateUuid/stats', ReminderTemplateController.getTemplateStats);

/**
 * 为指定模板生成实例和调度
 * POST /api/reminders/templates/:templateUuid/generate-instances
 */
router.post(
  '/:templateUuid/generate-instances',
  ReminderTemplateController.generateInstancesAndSchedules,
);

export default router;
