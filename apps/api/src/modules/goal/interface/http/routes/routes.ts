import { Router } from 'express';
import { GoalController } from '../controllers/GoalController.js';
import { GoalAggregateController } from '../controllers/GoalAggregateController.js';
import { goalAggregateRoutes } from './goalAggregateRoutes.js';

/**
 * @swagger
 * tags:
 *   - name: Goals
 *     description: 目标管理相关接口
 */

const router = Router();

// ============ DDD聚合根控制路由（推荐使用）============
// 体现DDD聚合根控制模式，通过聚合根管理所有子实体
// 注意：必须在通用路由之前注册，避免路由冲突
router.use('/', goalAggregateRoutes);

// ============ 传统CRUD路由（向后兼容）============
// 注意：这些路由要放在聚合路由之后，避免 /:id 匹配到聚合路由

/**
 * @swagger
 * /goals/search:
 *   get:
 *     tags: [Goals]
 *     summary: 搜索目标
 *     description: 根据关键词搜索目标
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, COMPLETED, ARCHIVED]
 *         description: 目标状态筛选
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/search', GoalController.searchGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     tags: [Goals]
 *     summary: 创建目标
 *     description: 创建新的目标
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
 *                 description: 目标标题
 *               description:
 *                 type: string
 *                 description: 目标描述
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 description: 目标完成日期
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: NORMAL
 *     responses:
 *       201:
 *         description: 目标创建成功
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
 *     tags: [Goals]
 *     summary: 获取目标列表
 *     description: 获取用户的目标列表，支持分页和筛选
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, COMPLETED, ARCHIVED]
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 目标列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/', GoalController.createGoal);
router.get('/', GoalController.getGoals);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     tags: [Goals]
 *     summary: 获取目标详情
 *     description: 根据ID获取目标详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *     responses:
 *       200:
 *         description: 目标详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Goals]
 *     summary: 更新目标
 *     description: 更新指定的目标信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
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
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: 目标更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Goals]
 *     summary: 删除目标
 *     description: 删除指定的目标
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *     responses:
 *       200:
 *         description: 目标删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

/**
 * @swagger
 * /goals/{id}/activate:
 *   post:
 *     tags: [Goals]
 *     summary: 激活目标
 *     description: 将暂停或已存档的目标设置为活跃状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *     responses:
 *       200:
 *         description: 目标激活成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/activate', GoalController.activateGoal);

/**
 * @swagger
 * /goals/{id}/pause:
 *   post:
 *     tags: [Goals]
 *     summary: 暂停目标
 *     description: 将活跃的目标设置为暂停状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 暂停原因
 *     responses:
 *       200:
 *         description: 目标暂停成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/pause', GoalController.pauseGoal);

/**
 * @swagger
 * /goals/{id}/complete:
 *   post:
 *     tags: [Goals]
 *     summary: 完成目标
 *     description: 将目标标记为已完成状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
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
 *               actualProgress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: 实际完成进度
 *     responses:
 *       200:
 *         description: 目标完成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/complete', GoalController.completeGoal);

/**
 * @swagger
 * /goals/{id}/archive:
 *   post:
 *     tags: [Goals]
 *     summary: 存档目标
 *     description: 将目标移至存档状态，不再显示在活跃列表中
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 存档原因
 *     responses:
 *       200:
 *         description: 目标存档成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 目标不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/archive', GoalController.archiveGoal);

export default router;
