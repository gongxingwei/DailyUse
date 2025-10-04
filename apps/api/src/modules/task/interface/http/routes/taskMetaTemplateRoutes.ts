import { Router } from 'express';
import { TaskMetaTemplateController } from '../controllers/TaskMetaTemplateController';

/**
 * TaskMetaTemplate Routes - 任务元模板聚合根路由
 *
 * 路由设计原则：
 * 1. 基于DDD聚合根控制模式
 * 2. TaskMetaTemplate 作为独立聚合根
 * 3. 使用统一的响应格式
 *
 * @swagger
 * tags:
 *   - name: Task Meta Templates
 *     description: 任务元模板管理接口（独立聚合根）
 */

const router = Router();

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
router.post('/', TaskMetaTemplateController.createMetaTemplate);
router.get('/', TaskMetaTemplateController.getMetaTemplates);

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
router.get('/favorites', TaskMetaTemplateController.getFavoriteMetaTemplates);

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
router.get('/popular', TaskMetaTemplateController.getPopularMetaTemplates);

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
router.get('/recently-used', TaskMetaTemplateController.getRecentlyUsedMetaTemplates);

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
router.get('/by-category/:category', TaskMetaTemplateController.getMetaTemplatesByCategory);

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
router.get('/:metaTemplateId', TaskMetaTemplateController.getMetaTemplateById);
router.put('/:metaTemplateId', TaskMetaTemplateController.updateMetaTemplate);
router.delete('/:metaTemplateId', TaskMetaTemplateController.deleteMetaTemplate);

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
router.post('/:metaTemplateId/activate', TaskMetaTemplateController.activateMetaTemplate);

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
router.post('/:metaTemplateId/deactivate', TaskMetaTemplateController.deactivateMetaTemplate);

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
router.post('/:metaTemplateId/toggle-favorite', TaskMetaTemplateController.toggleFavorite);

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
  '/:metaTemplateId/create-template',
  TaskMetaTemplateController.createTemplateFromMetaTemplate,
);

export default router;
