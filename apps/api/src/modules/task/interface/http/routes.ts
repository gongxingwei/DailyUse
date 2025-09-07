import { Router } from 'express';
import { TaskController } from './controllers/TaskController';
import { TaskTemplateController } from './controllers/TaskTemplateController';
import { TaskInstanceController } from './controllers/TaskInstanceController';

const router = Router();

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

// 任务统计路由
router.get('/stats', TaskController.getTaskStats);
router.get('/stats/timeline', TaskController.getTaskTimeline);

// 任务查询路由
router.get('/search', TaskController.searchTasks);
router.get('/upcoming', TaskController.getUpcomingTasks);
router.get('/overdue', TaskController.getOverdueTasks);

export default router;
