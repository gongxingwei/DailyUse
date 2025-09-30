import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { TaskTemplateController } from '../controllers/TaskTemplateController';
import { TaskInstanceController } from '../controllers/TaskInstanceController';
import taskAggregateRoutes from './taskAggregateRoutes';

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: 任务管理相关接口
 *   - name: Task Templates
 *     description: 任务模板管理接口
 *   - name: Task Instances
 *     description: 任务实例管理接口
 */

const router = Router();

// ============ DDD聚合根控制路由（推荐使用）============
// 体现DDD聚合根控制模式，通过TaskTemplate聚合根管理TaskInstance实体
// 使用 /aggregates 前缀避免与传统CRUD路由冲突
router.use('/aggregates', taskAggregateRoutes);

// ============ 传统CRUD路由（向后兼容）============
// 注意：这些路由要放在聚合路由之后，避免 /:id 匹配到聚合路由

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     tags: [Tasks]
 *     summary: 获取任务统计信息
 *     description: 获取用户的任务统计数据，包括完成率、分类统计等
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', TaskController.getTaskStats);

/**
 * @swagger
 * /tasks/stats/timeline:
 *   get:
 *     tags: [Tasks]
 *     summary: 获取任务时间线统计
 *     description: 获取任务完成情况的时间线数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 时间线数据获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/stats/timeline', TaskController.getTaskTimeline);

/**
 * @swagger
 * /tasks/search:
 *   get:
 *     tags: [Tasks]
 *     summary: 搜索任务
 *     description: 根据关键词搜索任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/search', TaskController.searchTasks);

/**
 * @swagger
 * /tasks/upcoming:
 *   get:
 *     tags: [Tasks]
 *     summary: 获取即将到期的任务
 *     description: 获取即将到期的任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 7
 *         description: 未来天数
 *     responses:
 *       200:
 *         description: 即将到期任务列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/upcoming', TaskController.getUpcomingTasks);

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     tags: [Tasks]
 *     summary: 获取逾期任务
 *     description: 获取已逾期的任务列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 逾期任务列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/overdue', TaskController.getOverdueTasks);

/**
 * @swagger
 * /tasks/templates:
 *   post:
 *     tags: [Task Templates]
 *     summary: 创建任务模板
 *     description: 创建新的任务模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 模板标题
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: NORMAL
 *               estimatedDuration:
 *                 type: integer
 *                 description: 预计耗时（分钟）
 *     responses:
 *       201:
 *         description: 模板创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板列表
 *     description: 获取用户的任务模板列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: 模板列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/templates', TaskTemplateController.createTemplate);
router.get('/templates', TaskTemplateController.getTemplates);

/**
 * @swagger
 * /tasks/templates/{id}:
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板详情
 *     description: 根据ID获取任务模板详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 模板详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Task Templates]
 *     summary: 更新任务模板
 *     description: 更新指定的任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: 模板更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Task Templates]
 *     summary: 删除任务模板
 *     description: 删除指定的任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 模板删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/templates/:id', TaskTemplateController.getTemplateById);
router.put('/templates/:id', TaskTemplateController.updateTemplate);
router.delete('/templates/:id', TaskTemplateController.deleteTemplate);

/**
 * @swagger
 * /tasks/templates/{id}/activate:
 *   post:
 *     tags: [Task Templates]
 *     summary: 激活任务模板
 *     description: 激活指定的任务模板，使其可以用于创建任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 模板激活成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/templates/:id/activate', TaskTemplateController.activateTemplate);

/**
 * @swagger
 * /tasks/templates/{id}/pause:
 *   post:
 *     tags: [Task Templates]
 *     summary: 暂停任务模板
 *     description: 暂停指定的任务模板，暂停后不能创建新实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 模板暂停成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/templates/:id/pause', TaskTemplateController.pauseTemplate);

/**
 * @swagger
 * /tasks/instances:
 *   post:
 *     tags: [Task Instances]
 *     summary: 创建任务实例
 *     description: 从模板或直接创建任务实例
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 任务标题
 *               description:
 *                 type: string
 *                 description: 任务描述
 *               templateId:
 *                 type: string
 *                 description: 模板ID（可选）
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: 截止时间
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: NORMAL
 *     responses:
 *       201:
 *         description: 任务实例创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例列表
 *     description: 获取用户的任务实例列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: 任务状态筛选
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 任务实例列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/instances', TaskInstanceController.createInstance);
router.get('/instances', TaskInstanceController.getInstances);

/**
 * @swagger
 * /tasks/instances/{id}:
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务实例详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   put:
 *     tags: [Task Instances]
 *     summary: 更新任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: 任务实例更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   delete:
 *     tags: [Task Instances]
 *     summary: 删除任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务实例删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/instances/:id', TaskInstanceController.getInstanceById);
router.put('/instances/:id', TaskInstanceController.updateInstance);
router.delete('/instances/:id', TaskInstanceController.deleteInstance);
/**
 * @swagger
 * /tasks/instances/{id}/complete:
 *   post:
 *     tags: [Task Instances]
 *     summary: 完成任务
 *     description: 将任务实例标记为已完成状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNote:
 *                 type: string
 *                 description: 完成备注
 *     responses:
 *       200:
 *         description: 任务完成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/instances/:id/complete', TaskInstanceController.completeTask);

/**
 * @swagger
 * /tasks/instances/{id}/undo-complete:
 *   post:
 *     tags: [Task Instances]
 *     summary: 撤销完成状态
 *     description: 将已完成的任务重新设置为进行中状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 撤销原因
 *     responses:
 *       200:
 *         description: 撤销完成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/instances/:id/undo-complete', TaskInstanceController.undoComplete);

/**
 * @swagger
 * /tasks/instances/{id}/reschedule:
 *   post:
 *     tags: [Task Instances]
 *     summary: 重新安排任务
 *     description: 修改任务实例的截止时间或安排
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newDueDate]
 *             properties:
 *               newDueDate:
 *                 type: string
 *                 format: date-time
 *                 description: 新的截止时间
 *               reason:
 *                 type: string
 *                 description: 重新安排原因
 *     responses:
 *       200:
 *         description: 任务重新安排成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/instances/:id/reschedule', TaskInstanceController.rescheduleTask);

/**
 * @swagger
 * /tasks/instances/{id}/cancel:
 *   post:
 *     tags: [Task Instances]
 *     summary: 取消任务
 *     description: 将任务实例标记为已取消状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例ID
 *     requestBody:
 *       required: false
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
 *         description: 任务取消成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/instances/:id/cancel', TaskInstanceController.cancelTask);

// 任务提醒路由
router.post('/instances/:id/reminders/:alertId/trigger', TaskInstanceController.triggerReminder);
router.post('/instances/:id/reminders/:alertId/snooze', TaskInstanceController.snoozeReminder);
router.post('/instances/:id/reminders/:alertId/dismiss', TaskInstanceController.dismissReminder);

export default router;
