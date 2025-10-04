import { Router } from 'express';
import { ReminderTemplateController } from '../controllers/ReminderTemplateController';
import { ReminderTemplateGroupController } from '../controllers/ReminderTemplateGroupController';

/**
 * Reminder Routes - 统一提醒路由
 *
 * 路由设计原则：
 * 1. 基于DDD聚合根控制模式
 * 2. ReminderInstance 通过 ReminderTemplate 聚合根管理
 * 3. ReminderTemplateGroup 作为独立聚合根
 * 4. 使用统一的响应格式（ResponseBuilder）
 *
 * @swagger
 * tags:
 *   - name: Reminder Templates
 *     description: 提醒模板管理接口（聚合根）
 *   - name: Reminder Template Groups
 *     description: 提醒模板分组管理接口（独立聚合根）
 *   - name: Reminder Instances
 *     description: 提醒实例管理接口（子实体）
 *   - name: Reminder Stats
 *     description: 提醒统计和查询接口
 */

const router = Router();

// ============ ReminderTemplate 聚合根管理 ============

/**
 * @swagger
 * /reminders/templates:
 *   post:
 *     tags: [Reminder Templates]
 *     summary: 创建提醒模板
 *     description: 创建新的提醒模板（聚合根）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, name, message]
 *             properties:
 *               uuid:
 *                 type: string
 *                 description: 模板UUID（前端生成）
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               message:
 *                 type: string
 *                 description: 提醒消息内容
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: 是否启用
 *               category:
 *                 type: string
 *                 description: 分类
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签列表
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *                 description: 优先级
 *               groupUuid:
 *                 type: string
 *                 description: 所属分组UUID
 *               timeConfig:
 *                 type: object
 *                 description: 时间配置
 *     responses:
 *       201:
 *         description: 模板创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       409:
 *         description: 模板已存在
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取提醒模板列表
 *     description: 获取用户的所有提醒模板
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
 *     responses:
 *       200:
 *         description: 模板列表获取成功
 */
router.post('/templates', ReminderTemplateController.createTemplate);
router.get('/templates', ReminderTemplateController.getTemplatesByAccount);

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
 *         description: 搜索成功
 *       400:
 *         description: 缺少搜索关键词
 */
router.get('/templates/search', ReminderTemplateController.searchTemplates);

/**
 * @swagger
 * /reminders/templates/active:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取活跃的提醒模板
 *     description: 获取所有启用状态的提醒模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: 活跃模板列表获取成功
 */
router.get('/templates/active', ReminderTemplateController.getActiveTemplates);

/**
 * @swagger
 * /reminders/templates/account-stats:
 *   get:
 *     tags: [Reminder Stats]
 *     summary: 获取账户提醒统计
 *     description: 获取当前账户的提醒相关统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 */
router.get('/templates/account-stats', ReminderTemplateController.getAccountStats);

/**
 * @swagger
 * /reminders/templates/{templateUuid}:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取提醒模板详情
 *     description: 根据UUID获取特定提醒模板的详细信息
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
 *         description: 模板详情获取成功
 *       404:
 *         description: 模板不存在
 *   put:
 *     tags: [Reminder Templates]
 *     summary: 更新提醒模板
 *     description: 更新指定提醒模板的信息
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
 *               name:
 *                 type: string
 *               message:
 *                 type: string
 *               description:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *               groupUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 模板更新成功
 *       404:
 *         description: 模板不存在
 *       400:
 *         description: 验证错误
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
 *       404:
 *         description: 模板不存在
 */
router.get('/templates/:templateUuid', ReminderTemplateController.getTemplate);
router.put('/templates/:templateUuid', ReminderTemplateController.updateTemplate);
router.delete('/templates/:templateUuid', ReminderTemplateController.deleteTemplate);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/toggle:
 *   patch:
 *     tags: [Reminder Templates]
 *     summary: 切换模板启用状态
 *     description: 启用或禁用提醒模板
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
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: 启用状态
 *     responses:
 *       200:
 *         description: 状态切换成功
 *       404:
 *         description: 模板不存在
 */
router.patch('/templates/:templateUuid/toggle', ReminderTemplateController.toggleTemplateEnabled);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/stats:
 *   get:
 *     tags: [Reminder Stats]
 *     summary: 获取模板统计信息
 *     description: 获取指定模板的统计信息（触发次数、响应时间等）
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
 *         description: 统计信息获取成功
 *       404:
 *         description: 模板不存在
 */
router.get('/templates/:templateUuid/stats', ReminderTemplateController.getTemplateStats);

/**
 * @swagger
 * /reminders/templates/{templateUuid}/generate-instances:
 *   post:
 *     tags: [Reminder Templates]
 *     summary: 生成提醒实例和调度
 *     description: 为指定模板生成未来一段时间的提醒实例和调度
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
 *               days:
 *                 type: integer
 *                 default: 7
 *                 minimum: 1
 *                 maximum: 30
 *                 description: 生成天数
 *               regenerate:
 *                 type: boolean
 *                 default: false
 *                 description: 是否重新生成
 *     responses:
 *       200:
 *         description: 生成成功
 *       404:
 *         description: 模板不存在
 */
router.post(
  '/templates/:templateUuid/generate-instances',
  ReminderTemplateController.generateInstancesAndSchedules,
);

// ============ ReminderTemplateGroup 聚合根管理 ============

/**
 * @swagger
 * /reminders/groups:
 *   post:
 *     tags: [Reminder Template Groups]
 *     summary: 创建提醒模板分组
 *     description: 创建新的提醒模板分组用于组织管理模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, name]
 *             properties:
 *               uuid:
 *                 type: string
 *                 description: 分组UUID（前端生成）
 *               name:
 *                 type: string
 *                 description: 分组名称
 *               description:
 *                 type: string
 *                 description: 分组描述
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: 是否启用
 *               enableMode:
 *                 type: string
 *                 enum: [INDIVIDUAL, GROUP]
 *                 default: INDIVIDUAL
 *                 description: 启用模式
 *               parentUuid:
 *                 type: string
 *                 description: 父分组UUID（支持层级结构）
 *               icon:
 *                 type: string
 *                 description: 图标标识
 *               color:
 *                 type: string
 *                 description: 颜色标识
 *               sortOrder:
 *                 type: integer
 *                 description: 排序顺序
 *     responses:
 *       201:
 *         description: 分组创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       409:
 *         description: 分组已存在
 *   get:
 *     tags: [Reminder Template Groups]
 *     summary: 获取提醒模板分组列表
 *     description: 获取当前用户的所有提醒模板分组
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 分组列表获取成功
 */
router.post('/groups', ReminderTemplateGroupController.createTemplateGroup);
router.get('/groups', ReminderTemplateGroupController.getTemplateGroups);

/**
 * @swagger
 * /reminders/groups/{groupUuid}:
 *   get:
 *     tags: [Reminder Template Groups]
 *     summary: 获取分组详情
 *     description: 根据UUID获取特定提醒模板分组详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 分组UUID
 *     responses:
 *       200:
 *         description: 分组详情获取成功
 *       404:
 *         description: 分组不存在
 *   put:
 *     tags: [Reminder Template Groups]
 *     summary: 更新提醒模板分组
 *     description: 更新指定提醒模板分组的信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 分组UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               enableMode:
 *                 type: string
 *               parentUuid:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 分组更新成功
 *       404:
 *         description: 分组不存在
 *       400:
 *         description: 验证错误
 *   delete:
 *     tags: [Reminder Template Groups]
 *     summary: 删除提醒模板分组
 *     description: 删除指定的提醒模板分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 分组UUID
 *     responses:
 *       200:
 *         description: 分组删除成功
 *       404:
 *         description: 分组不存在
 *       400:
 *         description: 分组包含子分组或模板，无法删除
 */
router.get('/groups/:groupUuid', ReminderTemplateGroupController.getTemplateGroup);
router.put('/groups/:groupUuid', ReminderTemplateGroupController.updateTemplateGroup);
router.delete('/groups/:groupUuid', ReminderTemplateGroupController.deleteTemplateGroup);

/**
 * @swagger
 * /reminders/groups/{groupUuid}/toggle:
 *   patch:
 *     tags: [Reminder Template Groups]
 *     summary: 切换分组启用状态
 *     description: 启用或禁用提醒模板分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 分组UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: 启用状态
 *     responses:
 *       200:
 *         description: 状态切换成功
 *       404:
 *         description: 分组不存在
 */
router.patch(
  '/groups/:groupUuid/toggle',
  ReminderTemplateGroupController.toggleTemplateGroupEnabled,
);

export default router;
