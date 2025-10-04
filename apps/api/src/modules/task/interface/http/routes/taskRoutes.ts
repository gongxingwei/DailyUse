import { Router } from 'express';
import { TaskTemplateController } from '../controllers/TaskTemplateController';
import { TaskMetaTemplateController } from '../controllers/TaskMetaTemplateController';

/**
 * Task Routes - 统一任务路由
 *
 * 路由设计原则：
 * 1. 基于DDD聚合根控制模式
 * 2. TaskInstance 通过 TaskTemplate 聚合根管理
 * 3. TaskMetaTemplate 作为独立聚合根
 * 4. 使用统一的响应格式
 *
 * @swagger
 * tags:
 *   - name: Task Templates
 *     description: 任务模板管理接口（聚合根）
 *   - name: Task Instances
 *     description: 任务实例管理接口（子实体）
 *   - name: Task Meta Templates
 *     description: 任务元模板管理接口（独立聚合根）
 *   - name: Task Stats
 *     description: 任务统计和查询接口
 */

const router = Router();

// ============ TaskTemplate 聚合根管理 ============

/**
 * @swagger
 * /tasks/templates:
 *   post:
 *     tags: [Task Templates]
 *     summary: 创建任务模板
 *     description: 创建新的任务模板（聚合根）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskTemplateRequest'
 *     responses:
 *       200:
 *         description: 模板创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板列表
 *     description: 获取用户的任务模板列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 模板列表获取成功
 */
router.post('/templates', TaskTemplateController.createTemplate);
router.get('/templates', TaskTemplateController.getTemplates);

/**
 * @swagger
 * /tasks/templates/{templateId}:
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模板详情
 *   put:
 *     tags: [Task Templates]
 *     summary: 更新任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskTemplateRequest'
 *     responses:
 *       200:
 *         description: 模板更新成功
 *   delete:
 *     tags: [Task Templates]
 *     summary: 删除任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模板删除成功
 */
router.get('/templates/:templateId', TaskTemplateController.getTemplateById);
router.put('/templates/:templateId', TaskTemplateController.updateTemplate);
router.delete('/templates/:templateId', TaskTemplateController.deleteTemplate);

// ============ TaskTemplate 状态管理 ============

/**
 * @swagger
 * /tasks/templates/{templateId}/activate:
 *   post:
 *     tags: [Task Templates]
 *     summary: 激活任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模板激活成功
 */
router.post('/templates/:templateId/activate', TaskTemplateController.activateTemplate);

/**
 * @swagger
 * /tasks/templates/{templateId}/pause:
 *   post:
 *     tags: [Task Templates]
 *     summary: 暂停任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模板暂停成功
 */
router.post('/templates/:templateId/pause', TaskTemplateController.pauseTemplate);

/**
 * @swagger
 * /tasks/templates/{templateId}/archive:
 *   post:
 *     tags: [Task Templates]
 *     summary: 归档任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模板归档成功
 */
router.post('/templates/:templateId/archive', TaskTemplateController.archiveTemplate);

// ============ TaskInstance 管理（通过聚合根）============

/**
 * @swagger
 * /tasks/instances:
 *   post:
 *     tags: [Task Instances]
 *     summary: 创建任务实例
 *     description: 创建任务实例（通过聚合根控制）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInstanceRequest'
 *     responses:
 *       200:
 *         description: 任务实例创建成功
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 任务实例列表
 */
router.post('/instances', TaskTemplateController.createInstance);
router.get('/instances', TaskTemplateController.getInstances);

/**
 * @swagger
 * /tasks/instances/{instanceId}:
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务实例详情
 *   put:
 *     tags: [Task Instances]
 *     summary: 更新任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskInstanceRequest'
 *     responses:
 *       200:
 *         description: 任务实例更新成功
 *   delete:
 *     tags: [Task Instances]
 *     summary: 删除任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务实例删除成功
 */
router.get('/instances/:instanceId', TaskTemplateController.getInstanceById);
router.put('/instances/:instanceId', TaskTemplateController.updateInstance);
router.delete('/instances/:instanceId', TaskTemplateController.deleteInstance);

// ============ TaskInstance 状态管理 ============

/**
 * @swagger
 * /tasks/instances/{instanceId}/complete:
 *   post:
 *     tags: [Task Instances]
 *     summary: 完成任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务完成成功
 */
router.post('/instances/:instanceId/complete', TaskTemplateController.completeTask);

/**
 * @swagger
 * /tasks/instances/{instanceId}/undo-complete:
 *   post:
 *     tags: [Task Instances]
 *     summary: 撤销完成状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 撤销完成成功
 */
router.post('/instances/:instanceId/undo-complete', TaskTemplateController.undoCompleteTask);

/**
 * @swagger
 * /tasks/instances/{instanceId}/start:
 *   post:
 *     tags: [Task Instances]
 *     summary: 开始任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务开始成功
 */
router.post('/instances/:instanceId/start', TaskTemplateController.startTask);

/**
 * @swagger
 * /tasks/instances/{instanceId}/cancel:
 *   post:
 *     tags: [Task Instances]
 *     summary: 取消任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务取消成功
 */
router.post('/instances/:instanceId/cancel', TaskTemplateController.cancelTask);

/**
 * @swagger
 * /tasks/instances/{instanceId}/reschedule:
 *   post:
 *     tags: [Task Instances]
 *     summary: 重新调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务重新调度成功
 */
router.post('/instances/:instanceId/reschedule', TaskTemplateController.rescheduleTask);

// ============ 提醒管理 ============

/**
 * @swagger
 * /tasks/instances/{instanceId}/reminders/{reminderId}/trigger:
 *   post:
 *     tags: [Task Instances]
 *     summary: 触发提醒
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 提醒触发成功
 */
router.post(
  '/instances/:instanceId/reminders/:reminderId/trigger',
  TaskTemplateController.triggerReminder,
);

/**
 * @swagger
 * /tasks/instances/{instanceId}/reminders/{reminderId}/snooze:
 *   post:
 *     tags: [Task Instances]
 *     summary: 延后提醒
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [snoozeUntil]
 *             properties:
 *               snoozeUntil:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 提醒延后成功
 */
router.post(
  '/instances/:instanceId/reminders/:reminderId/snooze',
  TaskTemplateController.snoozeReminder,
);

/**
 * @swagger
 * /tasks/instances/{instanceId}/reminders/{reminderId}/dismiss:
 *   post:
 *     tags: [Task Instances]
 *     summary: 忽略提醒
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 提醒忽略成功
 */
router.post(
  '/instances/:instanceId/reminders/:reminderId/dismiss',
  TaskTemplateController.dismissReminder,
);

// ============ 统计和查询 ============

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     tags: [Task Stats]
 *     summary: 获取任务统计
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 任务统计信息
 */
router.get('/stats', TaskTemplateController.getTaskStats);

/**
 * @swagger
 * /tasks/search:
 *   get:
 *     tags: [Task Stats]
 *     summary: 搜索任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', TaskTemplateController.searchTasks);

/**
 * @swagger
 * /tasks/upcoming:
 *   get:
 *     tags: [Task Stats]
 *     summary: 获取即将到来的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 即将到来的任务列表
 */
router.get('/upcoming', TaskTemplateController.getUpcomingTasks);

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     tags: [Task Stats]
 *     summary: 获取过期任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 过期任务列表
 */
router.get('/overdue', TaskTemplateController.getOverdueTasks);

/**
 * @swagger
 * /tasks/today:
 *   get:
 *     tags: [Task Stats]
 *     summary: 获取今日任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 今日任务列表
 */
router.get('/today', TaskTemplateController.getTodayTasks);

// ============ TaskMetaTemplate 管理（独立聚合根）============

/**
 * @swagger
 * /tasks/meta-templates:
 *   post:
 *     tags: [Task Meta Templates]
 *     summary: 创建任务元模板
 *     description: 创建新的任务元模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskMetaTemplateRequest'
 *     responses:
 *       200:
 *         description: 元模板创建成功
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 获取任务元模板列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 元模板列表
 */
router.post('/meta-templates', TaskMetaTemplateController.createMetaTemplate);
router.get('/meta-templates', TaskMetaTemplateController.getMetaTemplates);

/**
 * @swagger
 * /tasks/meta-templates/favorites:
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 获取收藏的元模板
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 收藏的元模板列表
 */
router.get('/meta-templates/favorites', TaskMetaTemplateController.getFavoriteMetaTemplates);

/**
 * @swagger
 * /tasks/meta-templates/popular:
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 获取热门元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 热门元模板列表
 */
router.get('/meta-templates/popular', TaskMetaTemplateController.getPopularMetaTemplates);

/**
 * @swagger
 * /tasks/meta-templates/recently-used:
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 获取最近使用的元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 最近使用的元模板列表
 */
router.get(
  '/meta-templates/recently-used',
  TaskMetaTemplateController.getRecentlyUsedMetaTemplates,
);

/**
 * @swagger
 * /tasks/meta-templates/by-category/{category}:
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 按类别获取元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 指定类别的元模板列表
 */
router.get(
  '/meta-templates/by-category/:category',
  TaskMetaTemplateController.getMetaTemplatesByCategory,
);

/**
 * @swagger
 * /tasks/meta-templates/{metaTemplateId}:
 *   get:
 *     tags: [Task Meta Templates]
 *     summary: 获取任务元模板详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 元模板详情
 *   put:
 *     tags: [Task Meta Templates]
 *     summary: 更新任务元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskMetaTemplateRequest'
 *     responses:
 *       200:
 *         description: 元模板更新成功
 *   delete:
 *     tags: [Task Meta Templates]
 *     summary: 删除任务元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 元模板删除成功
 */
router.get('/meta-templates/:metaTemplateId', TaskMetaTemplateController.getMetaTemplateById);
router.put('/meta-templates/:metaTemplateId', TaskMetaTemplateController.updateMetaTemplate);
router.delete('/meta-templates/:metaTemplateId', TaskMetaTemplateController.deleteMetaTemplate);

/**
 * @swagger
 * /tasks/meta-templates/{metaTemplateId}/activate:
 *   post:
 *     tags: [Task Meta Templates]
 *     summary: 激活元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 元模板激活成功
 */
router.post(
  '/meta-templates/:metaTemplateId/activate',
  TaskMetaTemplateController.activateMetaTemplate,
);

/**
 * @swagger
 * /tasks/meta-templates/{metaTemplateId}/deactivate:
 *   post:
 *     tags: [Task Meta Templates]
 *     summary: 停用元模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 元模板停用成功
 */
router.post(
  '/meta-templates/:metaTemplateId/deactivate',
  TaskMetaTemplateController.deactivateMetaTemplate,
);

/**
 * @swagger
 * /tasks/meta-templates/{metaTemplateId}/toggle-favorite:
 *   post:
 *     tags: [Task Meta Templates]
 *     summary: 切换收藏状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 收藏状态切换成功
 */
router.post(
  '/meta-templates/:metaTemplateId/toggle-favorite',
  TaskMetaTemplateController.toggleFavorite,
);

/**
 * @swagger
 * /tasks/meta-templates/{metaTemplateId}/create-template:
 *   post:
 *     tags: [Task Meta Templates]
 *     summary: 从元模板创建任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metaTemplateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskTemplateRequest'
 *     responses:
 *       200:
 *         description: 任务模板创建成功
 */
router.post(
  '/meta-templates/:metaTemplateId/create-template',
  TaskMetaTemplateController.createTemplateFromMetaTemplate,
);

export default router;
