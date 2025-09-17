import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { TaskTemplateController } from '../controllers/TaskTemplateController';
import { TaskInstanceController } from '../controllers/TaskInstanceController';
import taskAggregateRoutes from './taskAggregateRoutes';

const router = Router();

// ============ DDD聚合根控制路由（推荐使用）============
// 体现DDD聚合根控制模式，通过TaskTemplate聚合根管理TaskInstance实体
// 注意：必须在通用路由之前注册，避免路由冲突
router.use('/', taskAggregateRoutes);

// ============ 传统CRUD路由（向后兼容）============
// 注意：这些路由要放在聚合路由之后，避免 /:id 匹配到聚合路由

// 任务统计路由（必须在其他路由之前）
router.get('/stats', TaskController.getTaskStats);
router.get('/stats/timeline', TaskController.getTaskTimeline);

// 任务查询路由（必须在 /:id 之前）
router.get('/search', TaskController.searchTasks);
router.get('/upcoming', TaskController.getUpcomingTasks);
router.get('/overdue', TaskController.getOverdueTasks);

// 任务模板路由
router.post('/templates', TaskTemplateController.createTemplate);
router.get('/templates', TaskTemplateController.getTemplates);
router.get('/templates/:id', TaskTemplateController.getTemplateById);
router.put('/templates/:id', TaskTemplateController.updateTemplate);
router.delete('/templates/:id', TaskTemplateController.deleteTemplate);
router.post('/templates/:id/activate', TaskTemplateController.activateTemplate);
router.post('/templates/:id/pause', TaskTemplateController.pauseTemplate);

// 任务实例路由
router.post('/instances', TaskInstanceController.createInstance);
router.get('/instances', TaskInstanceController.getInstances);
router.get('/instances/:id', TaskInstanceController.getInstanceById);
router.put('/instances/:id', TaskInstanceController.updateInstance);
router.delete('/instances/:id', TaskInstanceController.deleteInstance);
router.post('/instances/:id/complete', TaskInstanceController.completeTask);
router.post('/instances/:id/undo-complete', TaskInstanceController.undoComplete);
router.post('/instances/:id/reschedule', TaskInstanceController.rescheduleTask);
router.post('/instances/:id/cancel', TaskInstanceController.cancelTask);

// 任务提醒路由
router.post('/instances/:id/reminders/:alertId/trigger', TaskInstanceController.triggerReminder);
router.post('/instances/:id/reminders/:alertId/snooze', TaskInstanceController.snoozeReminder);
router.post('/instances/:id/reminders/:alertId/dismiss', TaskInstanceController.dismissReminder);

export default router;
