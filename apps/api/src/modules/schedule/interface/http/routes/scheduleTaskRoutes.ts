/**
 * ScheduleTask Routes
 * 调度任务聚合根的路由定义
 *
 * 符合 RESTful API 设计原则，包含完整的 Swagger 文档注释
 */

import { Router, type Router as ExpressRouter } from 'express';
import { ScheduleTaskController } from '../controllers/ScheduleTaskController';

const router: ExpressRouter = Router();
const controller = new ScheduleTaskController();

// ===== Special Routes (在参数路由之前) =====

/**
 * @swagger
 * /schedules/upcoming:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取即将到来的任务
 *     description: 获取接下来要执行的调度任务列表
 *     parameters:
 *       - in: query
 *         name: withinMinutes
 *         schema:
 *           type: integer
 *           default: 60
 *         description: 时间范围（分钟）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回任务数量限制
 *     responses:
 *       200:
 *         description: 即将到来的任务列表
 */
router.get('/upcoming', controller.getUpcomingTasks.bind(controller));

/**
 * @swagger
 * /schedules/statistics:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取统计信息
 *     description: 获取调度任务的统计数据
 *     responses:
 *       200:
 *         description: 统计信息
 */
router.get('/statistics', controller.getStatistics.bind(controller));

/**
 * @swagger
 * /schedules/quick-reminder:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 快速创建提醒
 *     description: 创建一个简单的一次性提醒任务
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - triggerTime
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               triggerTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 提醒创建成功
 */
router.post('/quick-reminder', controller.createQuickReminder.bind(controller));

/**
 * @swagger
 * /schedules/batch:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 批量操作调度任务
 *     description: 对多个调度任务执行批量操作
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - taskUuids
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [enable, disable, delete, pause, resume]
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量操作完成
 */
router.post('/batch', controller.batchOperateTasks.bind(controller));

// ===== CRUD Routes =====

/**
 * @swagger
 * /schedules:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取所有调度任务
 *     description: 分页获取调度任务列表，支持搜索和过滤
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED]
 *         description: 任务状态筛选
 *       - in: query
 *         name: taskType
 *         schema:
 *           type: string
 *           enum: [TASK_REMINDER, GOAL_REMINDER, CUSTOM_REMINDER]
 *         description: 任务类型筛选
 *     responses:
 *       200:
 *         description: 任务列表
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 创建调度任务
 *     description: 创建一个新的调度任务
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 任务创建成功
 */
router.get('/', controller.getAllScheduleTasks.bind(controller));
router.post('/', controller.createScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取单个调度任务
 *     description: 根据 UUID 获取特定调度任务的详细信息
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 任务唯一标识
 *     responses:
 *       200:
 *         description: 任务详情
 *       404:
 *         description: 任务不存在
 *   put:
 *     tags: [Schedule Tasks]
 *     summary: 更新调度任务
 *     description: 更新现有调度任务的信息
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 任务更新成功
 *       404:
 *         description: 任务不存在
 *   delete:
 *     tags: [Schedule Tasks]
 *     summary: 删除调度任务
 *     description: 删除指定的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务删除成功
 *       404:
 *         description: 任务不存在
 */
router.get('/:uuid', controller.getScheduleTaskById.bind(controller));
router.put('/:uuid', controller.updateScheduleTask.bind(controller));
router.delete('/:uuid', controller.deleteScheduleTask.bind(controller));

// ===== State Management Routes =====

/**
 * @swagger
 * /schedules/{uuid}/execute:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 执行调度任务
 *     description: 立即执行指定的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务执行成功
 */
router.post('/:uuid/execute', controller.executeScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/enable:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 启用调度任务
 *     description: 启用指定的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务启用成功
 */
router.post('/:uuid/enable', controller.enableScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/disable:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 禁用调度任务
 *     description: 禁用指定的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务禁用成功
 */
router.post('/:uuid/disable', controller.disableScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/pause:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 暂停调度任务
 *     description: 暂停指定的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务暂停成功
 */
router.post('/:uuid/pause', controller.pauseScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/resume:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 恢复调度任务
 *     description: 恢复已暂停的调度任务
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务恢复成功
 */
router.post('/:uuid/resume', controller.resumeScheduleTask.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/snooze:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 延后提醒
 *     description: 延后指定调度任务的提醒时间
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - snoozeMinutes
 *             properties:
 *               snoozeMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 description: 延后分钟数
 *               reason:
 *                 type: string
 *                 description: 延后原因
 *     responses:
 *       200:
 *         description: 提醒延后成功
 */
router.post('/:uuid/snooze', controller.snoozeReminder.bind(controller));

/**
 * @swagger
 * /schedules/{uuid}/history:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取执行历史
 *     description: 获取指定调度任务的执行历史记录
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 执行历史列表
 */
router.get('/:uuid/history', controller.getExecutionHistory.bind(controller));

export { router as scheduleTaskRoutes };
