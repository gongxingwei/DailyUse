/**
 * @swagger
 * tags:
 *   - name: Schedules
 *     description: 任务调度管理
 *   - name: Schedule Events
 *     description: 调度事件流（SSE）
 *
 * components:
 *   schemas:
 *     ScheduleTask:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - triggerTime
 *       properties:
 *         uuid:
 *           type: string
 *           format: uuid
 *           description: 任务唯一标识
 *         name:
 *           type: string
 *           description: 任务名称
 *         description:
 *           type: string
 *           description: 任务描述
 *         type:
 *           type: string
 *           enum: [ONCE, RECURRING, CONDITIONAL]
 *           description: 任务类型
 *         status:
 *           type: string
 *           enum: [PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED]
 *           description: 任务状态
 *         priority:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *           description: 优先级
 *         triggerTime:
 *           type: string
 *           format: date-time
 *           description: 触发时间
 *         nextExecutionTime:
 *           type: string
 *           format: date-time
 *           description: 下次执行时间
 *         recurrence:
 *           type: object
 *           description: 重复规则
 *         alertConfig:
 *           type: object
 *           description: 提醒配置
 *         payload:
 *           type: object
 *           description: 任务载荷
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateScheduleRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - triggerTime
 *       properties:
 *         name:
 *           type: string
 *           description: 任务名称
 *         description:
 *           type: string
 *           description: 任务描述
 *         type:
 *           type: string
 *           enum: [ONCE, RECURRING, CONDITIONAL]
 *           description: 任务类型
 *         priority:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *           default: NORMAL
 *         triggerTime:
 *           type: string
 *           format: date-time
 *           description: 触发时间
 *         recurrence:
 *           type: object
 *           description: 重复规则
 *         alertConfig:
 *           type: object
 *           description: 提醒配置
 *         payload:
 *           type: object
 *           description: 任务载荷
 */

import { Router } from 'express';
import { ScheduleController } from './scheduleController';
import { sseController } from './SSEController';
import { ScheduleDebugController } from './debugController';

const router = Router();
const scheduleController = new ScheduleController();
const debugController = new ScheduleDebugController();

// 注意路由顺序：具体路径要在参数路径之前

// ===== Debug Routes (Development Only) =====

/**
 * @swagger
 * /schedules/debug/trigger-reminder:
 *   post:
 *     tags: [Schedule Debug]
 *     summary: 手动触发测试提醒
 *     description: 开发调试用 - 立即触发一个测试提醒事件
 *     responses:
 *       200:
 *         description: 测试提醒已触发
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/debug/trigger-reminder', debugController.triggerTestReminder);

/**
 * @swagger
 * /schedules/debug/info:
 *   get:
 *     tags: [Schedule Debug]
 *     summary: 获取调试信息
 *     description: 开发调试用 - 获取当前调度模块的调试信息
 *     responses:
 *       200:
 *         description: 调试信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/debug/info', debugController.getDebugInfo);

// ===== Special Routes (before parameter routes) =====

/**
 * @swagger
 * /schedules/events:
 *   get:
 *     tags: [Schedule Events]
 *     summary: SSE 事件流连接
 *     description: 建立 Server-Sent Events 连接以接收实时调度事件。需要在 URL 参数中提供有效的 JWT token，后端将自动从 token 中提取用户信息。
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT 认证令牌
 *     responses:
 *       200:
 *         description: SSE 连接建立成功
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: 未认证或 token 无效
 */
router.get('/events', sseController.connect);

/**
 * @swagger
 * /schedules/events/status:
 *   get:
 *     tags: [Schedule Events]
 *     summary: SSE 连接状态
 *     description: 获取当前 SSE 连接状态和统计信息
 *     responses:
 *       200:
 *         description: 连接状态信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connectedClients:
 *                   type: integer
 *                 totalConnections:
 *                   type: integer
 *                 uptime:
 *                   type: integer
 */
router.get('/events/status', (req, res) => {
  res.json(sseController.getStatus());
});

/**
 * @swagger
 * /schedules/upcoming:
 *   get:
 *     tags: [Schedules]
 *     summary: 获取即将到来的任务
 *     description: 获取接下来要执行的调度任务列表
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回任务数量限制
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: 时间范围（小时）
 *     responses:
 *       200:
 *         description: 即将到来的任务列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/upcoming', scheduleController.getUpcomingSchedules.bind(scheduleController));

/**
 * @swagger
 * /schedules/statistics:
 *   get:
 *     tags: [Schedules]
 *     summary: 获取统计信息
 *     description: 获取调度任务的统计数据
 *     responses:
 *       200:
 *         description: 统计信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/statistics', scheduleController.getStatistics.bind(scheduleController));

/**
 * @swagger
 * /schedules/quick-reminder:
 *   post:
 *     tags: [Schedules]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/quick-reminder', scheduleController.createQuickReminder.bind(scheduleController));

/**
 * @swagger
 * /schedules/batch:
 *   post:
 *     tags: [Schedules]
 *     summary: 批量操作计划任务
 *     description: 对多个调度任务执行批量操作
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - taskIds
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [enable, disable, delete, pause, resume]
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量操作完成
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/batch', scheduleController.batchOperateSchedules.bind(scheduleController));

// ===== Schedule Task Management Routes =====

/**
 * @swagger
 * /schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: 获取所有计划任务
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED]
 *         description: 任务状态筛选
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ONCE, RECURRING, CONDITIONAL]
 *         description: 任务类型筛选
 *     responses:
 *       200:
 *         description: 任务列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags: [Schedules]
 *     summary: 创建计划任务
 *     description: 创建一个新的调度任务
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScheduleRequest'
 *     responses:
 *       201:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ScheduleTask'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', scheduleController.getAllSchedules.bind(scheduleController));
router.post('/', scheduleController.createSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}:
 *   get:
 *     tags: [Schedules]
 *     summary: 获取单个计划任务
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ScheduleTask'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Schedules]
 *     summary: 更新计划任务
 *     description: 更新现有调度任务的信息
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 任务唯一标识
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScheduleRequest'
 *     responses:
 *       200:
 *         description: 任务更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ScheduleTask'
 *       404:
 *         description: 任务不存在
 *   delete:
 *     tags: [Schedules]
 *     summary: 删除计划任务
 *     description: 删除指定的调度任务
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
 *         description: 任务删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 */
router.get('/:uuid', scheduleController.getScheduleById.bind(scheduleController));
router.put('/:uuid', scheduleController.updateSchedule.bind(scheduleController));
router.delete('/:uuid', scheduleController.deleteSchedule.bind(scheduleController));

// ===== Schedule Operations Routes =====

/**
 * @swagger
 * /schedules/{uuid}/execute:
 *   post:
 *     tags: [Schedules]
 *     summary: 执行计划任务
 *     description: 立即执行指定的调度任务
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
 *         description: 任务执行成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/:uuid/execute', scheduleController.executeSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/enable:
 *   post:
 *     tags: [Schedules]
 *     summary: 启用计划任务
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
router.post('/:uuid/enable', scheduleController.enableSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/disable:
 *   post:
 *     tags: [Schedules]
 *     summary: 禁用计划任务
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
router.post('/:uuid/disable', scheduleController.disableSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/pause:
 *   post:
 *     tags: [Schedules]
 *     summary: 暂停计划任务
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
router.post('/:uuid/pause', scheduleController.pauseSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/resume:
 *   post:
 *     tags: [Schedules]
 *     summary: 恢复计划任务
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
router.post('/:uuid/resume', scheduleController.resumeSchedule.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/snooze:
 *   post:
 *     tags: [Schedules]
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
 *               - minutes
 *             properties:
 *               minutes:
 *                 type: integer
 *                 minimum: 1
 *                 description: 延后分钟数
 *     responses:
 *       200:
 *         description: 提醒延后成功
 */
router.post('/:uuid/snooze', scheduleController.snoozeReminder.bind(scheduleController));

/**
 * @swagger
 * /schedules/{uuid}/history:
 *   get:
 *     tags: [Schedules]
 *     summary: 获取执行历史
 *     description: 获取指定调度任务的执行历史记录
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 任务唯一标识
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
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 执行历史列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/:uuid/history', scheduleController.getExecutionHistory.bind(scheduleController));

export { router as scheduleRoutes };
