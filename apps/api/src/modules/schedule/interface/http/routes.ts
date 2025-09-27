/**
 * Schedule Module Routes
 * 任务调度模块路由
 */

import { Router } from 'express';
import { ScheduleController } from './scheduleController';
import { sseController } from './SSEController';

const router = Router();
const scheduleController = new ScheduleController();

// 注意路由顺序：具体路径要在参数路径之前

// ===== Special Routes (before parameter routes) =====

/**
 * GET /schedules/events - SSE 事件流连接
 */
router.get('/events', sseController.connect);

/**
 * GET /schedules/events/status - SSE 连接状态
 */
router.get('/events/status', (req, res) => {
  res.json(sseController.getStatus());
});

/**
 * GET /schedules/upcoming - 获取即将到来的任务
 */
router.get('/upcoming', scheduleController.getUpcomingSchedules.bind(scheduleController));

/**
 * GET /schedules/statistics - 获取统计信息
 */
router.get('/statistics', scheduleController.getStatistics.bind(scheduleController));

/**
 * POST /schedules/quick-reminder - 快速创建提醒
 */
router.post('/quick-reminder', scheduleController.createQuickReminder.bind(scheduleController));

/**
 * POST /schedules/batch - 批量操作计划任务
 */
router.post('/batch', scheduleController.batchOperateSchedules.bind(scheduleController));

// ===== Schedule Task Management Routes =====

/**
 * GET /schedules - 获取所有计划任务
 */
router.get('/', scheduleController.getAllSchedules.bind(scheduleController));

/**
 * POST /schedules - 创建计划任务
 */
router.post('/', scheduleController.createSchedule.bind(scheduleController));

/**
 * GET /schedules/:uuid - 获取单个计划任务
 */
router.get('/:uuid', scheduleController.getScheduleById.bind(scheduleController));

/**
 * PUT /schedules/:uuid - 更新计划任务
 */
router.put('/:uuid', scheduleController.updateSchedule.bind(scheduleController));

/**
 * DELETE /schedules/:uuid - 删除计划任务
 */
router.delete('/:uuid', scheduleController.deleteSchedule.bind(scheduleController));

// ===== Schedule Operations Routes =====

/**
 * POST /schedules/:uuid/execute - 执行计划任务
 */
router.post('/:uuid/execute', scheduleController.executeSchedule.bind(scheduleController));

/**
 * POST /schedules/:uuid/enable - 启用计划任务
 */
router.post('/:uuid/enable', scheduleController.enableSchedule.bind(scheduleController));

/**
 * POST /schedules/:uuid/disable - 禁用计划任务
 */
router.post('/:uuid/disable', scheduleController.disableSchedule.bind(scheduleController));

/**
 * POST /schedules/:uuid/pause - 暂停计划任务
 */
router.post('/:uuid/pause', scheduleController.pauseSchedule.bind(scheduleController));

/**
 * POST /schedules/:uuid/resume - 恢复计划任务
 */
router.post('/:uuid/resume', scheduleController.resumeSchedule.bind(scheduleController));

/**
 * POST /schedules/:uuid/snooze - 延后提醒
 */
router.post('/:uuid/snooze', scheduleController.snoozeReminder.bind(scheduleController));

/**
 * GET /schedules/:uuid/history - 获取执行历史
 */
router.get('/:uuid/history', scheduleController.getExecutionHistory.bind(scheduleController));

export { router as scheduleRoutes };
