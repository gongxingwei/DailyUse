import { Router } from 'express';
import { ReminderTemplateController } from '../controllers/ReminderTemplateController';

/**
 * @swagger
 * tags:
 *   - name: Reminder Templates
 *     description: 提醒模板管理接口
 */

/**
 * ReminderTemplate 聚合根的独立路由
 * 路径前缀：/api/reminders/templates
 */
const router = Router();

// ========== ReminderTemplate 聚合根路由 ==========

/**
 * @swagger
 * /reminders/templates:
 *   post:
 *     tags: [Reminder Templates]
 *     summary: 创建提醒模板
 *     description: 创建新的提醒模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, triggerTime]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 模板标题
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               triggerTime:
 *                 type: string
 *                 format: date-time
 *                 description: 触发时间
 *               repeatType:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY]
 *                 default: NONE
 *                 description: 重复类型
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
 */
router.post('/', ReminderTemplateController.createTemplate);

/**
 * @swagger
 * /reminders/templates:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取提醒模板列表
 *     description: 获取当前用户的所有提醒模板
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 筛选启用状态
 *     responses:
 *       200:
 *         description: 模板列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', ReminderTemplateController.getTemplatesByAccount);

/**
 * @swagger
 * /reminders/templates/search:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 搜索提醒模板
 *     description: 根据关键词搜索提醒模板
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
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/search', ReminderTemplateController.searchTemplates);

/**
 * @swagger
 * /reminders/templates/active:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取活跃的提醒模板
 *     description: 获取当前用户所有启用的提醒模板
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 活跃模板列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/active', ReminderTemplateController.getActiveTemplates);

/**
 * @swagger
 * /reminders/templates/account-stats:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取账户统计信息
 *     description: 获取当前用户的提醒模板统计数据
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 账户统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTemplates:
 *                       type: integer
 *                       description: 总模板数
 *                     activeTemplates:
 *                       type: integer
 *                       description: 活跃模板数
 *                     totalInstances:
 *                       type: integer
 *                       description: 总实例数
 *                     completedInstances:
 *                       type: integer
 *                       description: 已完成实例数
 */
router.get('/account-stats', ReminderTemplateController.getAccountStats);

/**
 * @swagger
 * /reminders/templates/{templateUuid}:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取单个提醒模板
 *     description: 根据UUID获取提醒模板详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
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
 *     tags: [Reminder Templates]
 *     summary: 更新提醒模板
 *     description: 更新指定的提醒模板信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
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
 *               triggerTime:
 *                 type: string
 *                 format: date-time
 *               repeatType:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY]
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
 *     tags: [Reminder Templates]
 *     summary: 删除提醒模板
 *     description: 删除指定的提醒模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
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
router.get('/:templateUuid', ReminderTemplateController.getTemplate);
router.put('/:templateUuid', ReminderTemplateController.updateTemplate);
router.delete('/:templateUuid', ReminderTemplateController.deleteTemplate);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/toggle:
 *   patch:
 *     tags: [Reminder Templates]
 *     summary: 切换模板启用状态
 *     description: 切换提醒模板的启用/禁用状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
 *     responses:
 *       200:
 *         description: 状态切换成功
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
router.patch('/:templateUuid/toggle', ReminderTemplateController.toggleTemplateEnabled);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/stats:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取模板统计信息
 *     description: 获取指定模板的统计数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
 *     responses:
 *       200:
 *         description: 模板统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     instanceCount:
 *                       type: integer
 *                       description: 实例总数
 *                     completedCount:
 *                       type: integer
 *                       description: 已完成数
 *                     activeCount:
 *                       type: integer
 *                       description: 活跃数
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:templateUuid/stats', ReminderTemplateController.getTemplateStats);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/generate-instances:
 *   post:
 *     tags: [Reminder Templates]
 *     summary: 生成模板实例
 *     description: 为指定模板生成实例和调度
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 生成开始日期
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 生成结束日期
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: 生成实例数量
 *     responses:
 *       201:
 *         description: 实例生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     generatedCount:
 *                       type: integer
 *                       description: 生成的实例数量
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:templateUuid/generate-instances',
  ReminderTemplateController.generateInstancesAndSchedules,
);

export default router;
