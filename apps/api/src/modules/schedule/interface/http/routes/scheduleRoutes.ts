import { Router, type Router as ExpressRouter } from 'express';
import { ScheduleTaskController } from '../controllers/ScheduleTaskController';
import scheduleStatisticsRoutes from './scheduleStatisticsRoutes';

/**
 * @swagger
 * tags:
 *   - name: Schedule Tasks
 *     description: 调度任务管理相关接口（DDD 聚合根控制模式）
 *   - name: Schedule Statistics
 *     description: 调度任务统计信息
 */

/**
 * Schedule 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. 子实体操作必须通过聚合根路径
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 * 4. 所有方法统一使用 responseBuilder
 * 5. 每个聚合根独立的路由文件
 */
const router: ExpressRouter = Router();

// ============ DDD 聚合根控制路由 ============
// 注意：聚合路由必须在通用 CRUD 路由之前注册，避免 /:id 路由冲突

// ===== 聚合根控制：统计信息 =====
// 统计信息路由已独立到 scheduleStatisticsRoutes.ts
router.use('/statistics', scheduleStatisticsRoutes);

// ===== 聚合根控制：任务操作 =====

/**
 * @swagger
 * /schedules/tasks/due:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 查找需要执行的任务
 *     description: 查找所有需要在指定时间之前执行的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: beforeTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 截止时间（默认为当前时间）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 查找成功
 */
router.get('/tasks/due', ScheduleTaskController.getDueTasks);

/**
 * @swagger
 * /schedules/tasks/batch:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 批量创建调度任务
 *     description: 批量创建多个调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 批量创建成功
 */
router.post('/tasks/batch', ScheduleTaskController.createTasksBatch);

/**
 * @swagger
 * /schedules/tasks/batch/delete:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 批量删除调度任务
 *     description: 批量删除多个调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
router.post('/tasks/batch/delete', ScheduleTaskController.deleteTasksBatch);

/**
 * @swagger
 * /schedules/tasks/{id}/pause:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 暂停任务
 *     description: 暂停指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 暂停成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/pause', ScheduleTaskController.pauseTask);

/**
 * @swagger
 * /schedules/tasks/{id}/resume:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 恢复任务
 *     description: 恢复已暂停的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 恢复成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/resume', ScheduleTaskController.resumeTask);

/**
 * @swagger
 * /schedules/tasks/{id}/complete:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 完成任务
 *     description: 标记调度任务为已完成
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 完成原因
 *     responses:
 *       200:
 *         description: 完成成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/complete', ScheduleTaskController.completeTask);

/**
 * @swagger
 * /schedules/tasks/{id}/cancel:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 取消任务
 *     description: 取消指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 取消成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/cancel', ScheduleTaskController.cancelTask);

/**
 * @swagger
 * /schedules/tasks/{id}/metadata:
 *   patch:
 *     tags: [Schedule Tasks]
 *     summary: 更新任务元数据
 *     description: 更新调度任务的元数据（payload、tags）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *               tagsToAdd:
 *                 type: array
 *                 items:
 *                   type: string
 *               tagsToRemove:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 任务不存在
 */
router.patch('/tasks/:id/metadata', ScheduleTaskController.updateTaskMetadata);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /schedules/tasks:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 创建调度任务
 *     description: 创建新的调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sourceModule
 *               - sourceEntityId
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceModule:
 *                 type: string
 *                 enum: [reminder, task, goal, notification]
 *               sourceEntityId:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   cronExpression:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   startDate:
 *                     type: number
 *                   endDate:
 *                     type: number
 *                   maxExecutions:
 *                     type: number
 *               retryConfig:
 *                 type: object
 *               payload:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 任务创建成功
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取调度任务列表
 *     description: 获取用户的所有调度任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.post('/tasks', ScheduleTaskController.createTask);
router.get('/tasks', ScheduleTaskController.getTasks);

/**
 * @swagger
 * /schedules/tasks/{id}:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取调度任务详情
 *     description: 根据UUID获取调度任务详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回任务详情
 *       404:
 *         description: 任务不存在
 *   delete:
 *     tags: [Schedule Tasks]
 *     summary: 删除调度任务
 *     description: 删除指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 任务不存在
 */
router.get('/tasks/:id', ScheduleTaskController.getTask);
router.delete('/tasks/:id', ScheduleTaskController.deleteTask);

export default router;
