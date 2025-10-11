import { Router, type Router as ExpressRouter } from 'express';
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
const router: ExpressRouter = Router();

// ========== ReminderTemplate 聚合根路由 ==========

/**
 * @swagger
 * /reminders/templates:
 *   post:
 *     tags: [Reminder Templates]
 *     summary: 创建提醒模板（智能版）
 *     description: |
 *       创建新的提醒模板，并自动生成提醒实例。
 *
 *       **智能特性**：
 *       - 如果 `enabled=true` 且 `selfEnabled=true`，自动生成未来 N 天的提醒实例
 *       - 支持自定义生成天数（默认 7 天）
 *       - 一次请求完成模板创建和实例生成
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, name, message, timeConfig, priority, category, tags]
 *             properties:
 *               uuid:
 *                 type: string
 *                 format: uuid
 *                 description: 模板唯一标识（前端生成）
 *               name:
 *                 type: string
 *                 description: 模板名称
 *                 example: "每日站会提醒"
 *               message:
 *                 type: string
 *                 description: 提醒消息内容
 *                 example: "记得参加每日站会"
 *               description:
 *                 type: string
 *                 description: 模板描述（可选）
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: 是否启用（启用时会自动生成实例）
 *               selfEnabled:
 *                 type: boolean
 *                 default: true
 *                 description: 自身启用状态
 *               timeConfig:
 *                 type: object
 *                 description: 时间配置
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [daily, weekly, monthly, absolute]
 *                     description: 时间类型
 *                   times:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["09:00", "14:00"]
 *                     description: 触发时间点
 *                   weekDays:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     example: [1, 3, 5]
 *                     description: 周几（1-7，仅 weekly 类型）
 *               priority:
 *                 type: string
 *                 enum: [urgent, high, normal, low]
 *                 description: 优先级
 *               category:
 *                 type: string
 *                 description: 分类
 *                 example: "work"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签
 *                 example: ["meeting", "daily"]
 *               instanceDays:
 *                 type: integer
 *                 default: 7
 *                 description: 自动生成实例的天数（可选）
 *                 example: 30
 *               autoGenerateInstances:
 *                 type: boolean
 *                 default: true
 *                 description: 是否自动生成实例（可选）
 *     responses:
 *       201:
 *         description: 模板创建成功（包含自动生成的实例）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                     name:
 *                       type: string
 *                     instances:
 *                       type: array
 *                       description: 自动生成的提醒实例列表
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                   example: "Reminder template created successfully with 7 instances"
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
 * /reminders/templates/upcoming:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取即将到来的提醒列表
 *     description: |
 *       根据所有启用的模板计算即将到来的提醒，不依赖 Schedule 模块。
 *
 *       **特性**：
 *       - 仅计算启用的模板
 *       - 支持自定义时间窗口（默认24小时）
 *       - 支持限制返回数量
 *       - 按触发时间排序
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回的最大数量
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 24
 *         description: 时间窗口（小时）
 *     responses:
 *       200:
 *         description: 即将到来的提醒列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       templateUuid:
 *                         type: string
 *                       templateName:
 *                         type: string
 *                       message:
 *                         type: string
 *                       nextTriggerTime:
 *                         type: string
 *                         format: date-time
 *                       priority:
 *                         type: string
 *                       category:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       icon:
 *                         type: string
 *                       color:
 *                         type: string
 */
router.get('/upcoming', ReminderTemplateController.getUpcomingReminders);

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
 * /reminders/templates/{templateUuid}/schedule-status:
 *   get:
 *     tags: [Reminder Templates]
 *     summary: 获取模板的调度状态
 *     description: |
 *       获取模板关联的 RecurringScheduleTask 信息
 *
 *       ⚠️ 架构更改：
 *       - 不再返回 ReminderInstance 列表
 *       - 返回 Schedule 模块的调度任务状态
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
 *         description: 调度状态
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
 *                     hasSchedule:
 *                       type: boolean
 *                       description: 是否有调度任务
 *                     enabled:
 *                       type: boolean
 *                       description: 调度是否启用
 *                     nextRunAt:
 *                       type: string
 *                       format: date-time
 *                       description: 下次执行时间
 *                     lastRunAt:
 *                       type: string
 *                       format: date-time
 *                       description: 上次执行时间
 *                     executionCount:
 *                       type: integer
 *                       description: 执行次数
 *                     recentExecutions:
 *                       type: array
 *                       description: 最近执行记录
 *                       items:
 *                         type: object
 *                     cronExpression:
 *                       type: string
 *                       description: Cron 表达式
 *                     cronDescription:
 *                       type: string
 *                       description: Cron 描述（人类可读）
 *       404:
 *         description: 模板不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:templateUuid/schedule-status', ReminderTemplateController.getScheduleStatus);

export default router;
