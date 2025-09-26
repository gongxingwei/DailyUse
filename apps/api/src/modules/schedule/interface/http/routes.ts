/**
 * Schedule Module Routes
 * 任务调度模块路由
 */

import { Router } from 'express';
import { ScheduleController } from './scheduleController';

const router = Router();
const scheduleController = new ScheduleController();

// ===== Schedule Management Routes =====

/**
 * GET /schedules - 获取所有计划任务
 */
router.get('/', scheduleController.getAllSchedules);

/**
 * GET /schedules/:id - 获取单个计划任务
 */
router.get('/:id', scheduleController.getScheduleById);

/**
 * POST /schedules - 创建计划任务
 */
router.post('/', scheduleController.createSchedule);

/**
 * PUT /schedules/:id - 更新计划任务
 */
router.put('/:id', scheduleController.updateSchedule);

/**
 * DELETE /schedules/:id - 删除计划任务
 */
router.delete('/:id', scheduleController.deleteSchedule);

// ===== Schedule Operations Routes =====

/**
 * POST /schedules/:id/start - 启动计划任务
 */
router.post('/:id/start', scheduleController.startSchedule);

/**
 * POST /schedules/:id/stop - 停止计划任务
 */
router.post('/:id/stop', scheduleController.stopSchedule);

/**
 * POST /schedules/:id/pause - 暂停计划任务
 */
router.post('/:id/pause', scheduleController.pauseSchedule);

/**
 * POST /schedules/:id/resume - 恢复计划任务
 */
router.post('/:id/resume', scheduleController.resumeSchedule);

/**
 * POST /schedules/:id/trigger - 手动触发计划任务
 */
router.post('/:id/trigger', scheduleController.triggerSchedule);

// ===== Schedule Status & Monitoring Routes =====

/**
 * GET /schedules/:id/status - 获取计划任务状态
 */
router.get('/:id/status', scheduleController.getScheduleStatus);

/**
 * GET /schedules/:id/history - 获取计划任务执行历史
 */
router.get('/:id/history', scheduleController.getScheduleHistory);

/**
 * GET /schedules/active - 获取所有活跃的计划任务
 */
router.get('/active', scheduleController.getActiveSchedules);

/**
 * GET /schedules/stats - 获取计划任务统计信息
 */
router.get('/stats', scheduleController.getScheduleStats);

export { router as scheduleRoutes };
