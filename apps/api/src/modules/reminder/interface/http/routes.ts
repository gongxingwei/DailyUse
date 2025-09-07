import { Router } from 'express';
import {
  ReminderTemplateController,
  ReminderInstanceController,
  ReminderController,
} from './controllers/ReminderController';

const router = Router();

// 提醒模板路由
router.post('/templates', ReminderTemplateController.createTemplate);
router.get('/templates', ReminderTemplateController.getTemplates);
router.get('/templates/:id', ReminderTemplateController.getTemplateById);
router.put('/templates/:id', ReminderTemplateController.updateTemplate);
router.delete('/templates/:id', ReminderTemplateController.deleteTemplate);
router.post('/templates/:id/activate', ReminderTemplateController.activateTemplate);
router.post('/templates/:id/pause', ReminderTemplateController.pauseTemplate);

// 提醒实例路由
router.post('/instances', ReminderInstanceController.createInstance);
router.get('/instances', ReminderInstanceController.getInstances);
router.get('/instances/:id', ReminderInstanceController.getInstanceById);
router.put('/instances/:id', ReminderInstanceController.updateInstance);
router.delete('/instances/:id', ReminderInstanceController.deleteInstance);
router.post('/instances/:id/trigger', ReminderInstanceController.triggerReminder);
router.post('/instances/:id/snooze', ReminderInstanceController.snoozeReminder);
router.post('/instances/:id/dismiss', ReminderInstanceController.dismissReminder);
router.post('/instances/:id/acknowledge', ReminderInstanceController.acknowledgeReminder);

// 批量操作路由
router.post('/batch/dismiss', ReminderController.batchDismissReminders);
router.post('/batch/snooze', ReminderController.batchSnoozeReminders);

// 查询路由
router.get('/search', ReminderController.searchReminders);
router.get('/stats', ReminderController.getReminderStats);
router.get('/account/:accountUuid/active', ReminderController.getActiveReminders);
router.get('/account/:accountUuid/pending', ReminderController.getPendingReminders);
router.get('/account/:accountUuid/overdue', ReminderController.getOverdueReminders);
router.get('/account/:accountUuid/upcoming', ReminderController.getUpcomingReminders);
router.get('/account/:accountUuid/history', ReminderController.getReminderHistory);

export default router;
