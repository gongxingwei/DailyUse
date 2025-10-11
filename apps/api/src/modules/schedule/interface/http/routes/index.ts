/**
 * Schedule Module Routes Index
 * 调度模块路由入口文件
 *
 * 整合所有调度相关的路由
 */

import { Router, type Router as ExpressRouter } from 'express';
import { scheduleTaskRoutes } from './scheduleTaskRoutes';
import { sseController } from '../SSEController';
import { ScheduleDebugController } from '../debugController';

const router: ExpressRouter = Router();
const debugController = new ScheduleDebugController();

// ===== SSE Event Routes =====

/**
 * @swagger
 * /schedules/events:
 *   get:
 *     tags: [Schedule Events]
 *     summary: SSE 事件流连接
 *     description: 建立 Server-Sent Events 连接以接收实时调度事件
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
 */
router.get('/events/status', (req, res) => {
  res.json(sseController.getStatus());
});

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
 */
router.get('/debug/info', debugController.getDebugInfo);

// ===== ScheduleTask Routes =====
router.use('/', scheduleTaskRoutes);

export default router;
