import { Router, type Router as ExpressRouter } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationPreferenceController } from '../controllers/NotificationPreferenceController';
import { NotificationTemplateController } from '../controllers/NotificationTemplateController';

// Get controller instances
const getNotificationController = () => NotificationController.getInstance();
const getPreferenceController = () => NotificationPreferenceController.getInstance();
const getTemplateController = () => NotificationTemplateController.getInstance();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: 通知管理相关接口（DDD 聚合根控制模式）
 *   - name: Notification Preferences
 *     description: 通知偏好设置
 *   - name: Notification Templates
 *     description: 通知模板管理
 */

/**
 * Notification 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. Notification 是聚合根
 * 2. 状态转换通过聚合根方法（markAsRead, markAsDismissed）
 * 3. 批量操作保证业务规则一致性
 * 4. 所有方法统一使用 responseBuilder
 */
export const router: ExpressRouter = Router();

// ============ 查询和统计路由 ============
// 注意：必须在 /:id 路由之前注册

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: 获取未读通知数量
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 未读数量
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 */
router.get('/unread-count', (req, res) => getNotificationController().getUnreadCount(req, res));

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     tags: [Notifications]
 *     summary: 获取通知统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息
 */
router.get('/stats', (req, res) => getNotificationController().getNotificationStats(req, res));

/**
 * @swagger
 * /notifications/from-template:
 *   post:
 *     tags: [Notifications]
 *     summary: 使用模板创建通知
 *     description: 根据预定义模板创建通知，自动渲染变量
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateUuid, variables]
 *             properties:
 *               templateUuid:
 *                 type: string
 *                 description: 模板UUID
 *               variables:
 *                 type: object
 *                 description: 模板变量键值对
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 发送渠道（覆盖模板默认值）
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 description: 优先级（覆盖模板默认值）
 *     responses:
 *       201:
 *         description: 通知创建成功
 *       404:
 *         description: 模板不存在
 */
router.post('/from-template', (req, res) =>
  getNotificationController().createFromTemplate(req, res),
);

// ============ 批量操作路由 ============

/**
 * @swagger
 * /notifications/batch-read:
 *   post:
 *     tags: [Notifications]
 *     summary: 批量标记为已读
 *     description: 批量标记多个通知为已读状态
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationIds]
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 通知UUID数组
 *     responses:
 *       200:
 *         description: 批量标记成功
 */
router.post('/batch-read', (req, res) => getNotificationController().batchMarkAsRead(req, res));

/**
 * @swagger
 * /notifications/batch-dismiss:
 *   post:
 *     tags: [Notifications]
 *     summary: 批量标记为已忽略
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationIds]
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量标记成功
 */
router.post('/batch-dismiss', (req, res) =>
  getNotificationController().batchMarkAsDismissed(req, res),
);

/**
 * @swagger
 * /notifications/batch-delete:
 *   post:
 *     tags: [Notifications]
 *     summary: 批量删除通知
 *     description: 批量删除多个通知及其关联的发送回执
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationIds]
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
router.post('/batch-delete', (req, res) =>
  getNotificationController().batchDeleteNotifications(req, res),
);

// ============ 基础 CRUD 路由 ============

/**
 * @swagger
 * /notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: 创建通知
 *     description: 创建新的通知并发送
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, title, content, type, priority, channels]
 *             properties:
 *               uuid:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INFO, WARNING, ERROR, SUCCESS, REMINDER, GOAL, TASK, SCHEDULE, SYSTEM]
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [IN_APP, SSE, SYSTEM, EMAIL, SMS, PUSH]
 *               icon:
 *                 type: string
 *               image:
 *                 type: string
 *               actions:
 *                 type: array
 *               scheduledAt:
 *                 type: number
 *               expiresAt:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: 通知创建成功
 *       400:
 *         description: 请求参数错误或用户已禁用该类型通知
 *   get:
 *     tags: [Notifications]
 *     summary: 获取通知列表
 *     description: 获取用户的通知列表，支持分页和筛选
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, READ, DISMISSED, EXPIRED, FAILED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, WARNING, ERROR, SUCCESS, REMINDER, GOAL, TASK, SCHEDULE, SYSTEM]
 *       - in: query
 *         name: channels
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, sentAt, readAt, priority]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 通知列表获取成功
 */
router.post('/', (req, res) => getNotificationController().createNotification(req, res));
router.get('/', (req, res) => getNotificationController().getNotifications(req, res));

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: 获取通知详情
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
 *         description: 通知详情
 *       404:
 *         description: 通知不存在
 *   delete:
 *     tags: [Notifications]
 *     summary: 删除通知
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
 *         description: 通知删除成功
 *       404:
 *         description: 通知不存在
 */
router.get('/:id', (req, res) => getNotificationController().getNotificationById(req, res));
router.delete('/:id', (req, res) => getNotificationController().deleteNotification(req, res));

// ============ 聚合根状态转换路由 ============

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: 标记通知为已读
 *     description: 将通知状态从 SENT 转换为 READ
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
 *         description: 标记成功
 *       400:
 *         description: 状态转换不合法
 *       404:
 *         description: 通知不存在
 */
router.post('/:id/read', (req, res) => getNotificationController().markAsRead(req, res));

/**
 * @swagger
 * /notifications/{id}/dismiss:
 *   post:
 *     tags: [Notifications]
 *     summary: 标记通知为已忽略
 *     description: 将通知状态从 SENT 转换为 DISMISSED
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
 *         description: 标记成功
 *       400:
 *         description: 状态转换不合法
 *       404:
 *         description: 通知不存在
 */
router.post('/:id/dismiss', (req, res) => getNotificationController().markAsDismissed(req, res));

// ============ 通知偏好设置路由 ============

/**
 * @swagger
 * /notification-preferences:
 *   get:
 *     tags: [Notification Preferences]
 *     summary: 获取用户通知偏好设置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 偏好设置
 *   put:
 *     tags: [Notification Preferences]
 *     summary: 更新用户通知偏好设置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabledTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               channelPreferences:
 *                 type: object
 *               maxNotifications:
 *                 type: number
 *               autoArchiveDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 */

/**
 * @swagger
 * /notification-preferences/channels/{channel}:
 *   patch:
 *     tags: [Notification Preferences]
 *     summary: 更新指定渠道的设置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [IN_APP, SSE, SYSTEM, EMAIL, SMS, PUSH]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *               quietHours:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   startTime:
 *                     type: string
 *                     pattern: '^\d{2}:\d{2}$'
 *                   endTime:
 *                     type: string
 *                     pattern: '^\d{2}:\d{2}$'
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: 渠道设置更新成功
 */

export const notificationPreferenceRouter: ExpressRouter = Router();
notificationPreferenceRouter.get('/', (req, res) =>
  getPreferenceController().getPreference(req, res),
);
notificationPreferenceRouter.put('/', (req, res) =>
  getPreferenceController().updatePreference(req, res),
);
notificationPreferenceRouter.patch('/channels/:channel', (req, res) =>
  getPreferenceController().updateChannelPreference(req, res),
);

// ============================================================
// Notification Templates 路由
// ============================================================

/**
 * @swagger
 * /notification-templates:
 *   post:
 *     tags: [Notification Templates]
 *     summary: 创建通知模板
 *     description: 创建新的通知模板，用于批量生成相似通知
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, name, type, titleTemplate, contentTemplate, defaultPriority, defaultChannels, variables]
 *             properties:
 *               uuid:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 description: 模板名称（唯一）
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error, system, task_reminder, goal_milestone, schedule_reminder, notification, custom]
 *               titleTemplate:
 *                 type: string
 *                 description: 标题模板，支持 {{variable}} 变量
 *               contentTemplate:
 *                 type: string
 *                 description: 内容模板，支持 {{variable}} 变量
 *               defaultPriority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *               defaultChannels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, sse, system, email, sms, push]
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 模板变量列表
 *               icon:
 *                 type: string
 *               defaultActions:
 *                 type: array
 *                 items:
 *                   type: object
 *               enabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: 模板创建成功
 *       400:
 *         description: 验证失败或模板名称已存在
 *   get:
 *     tags: [Notification Templates]
 *     summary: 获取模板列表
 *     description: 查询通知模板列表，支持筛选
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 按类型筛选
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: 按启用状态筛选
 *       - in: query
 *         name: nameContains
 *         schema:
 *           type: string
 *         description: 按名称模糊搜索
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 模板列表
 */

/**
 * @swagger
 * /notification-templates/{id}:
 *   get:
 *     tags: [Notification Templates]
 *     summary: 获取模板详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 模板UUID
 *     responses:
 *       200:
 *         description: 模板详情
 *       404:
 *         description: 模板不存在
 *   put:
 *     tags: [Notification Templates]
 *     summary: 更新模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               titleTemplate:
 *                 type: string
 *               contentTemplate:
 *                 type: string
 *               defaultPriority:
 *                 type: string
 *               defaultChannels:
 *                 type: array
 *               variables:
 *                 type: array
 *               icon:
 *                 type: string
 *               defaultActions:
 *                 type: array
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 模板不存在
 *   delete:
 *     tags: [Notification Templates]
 *     summary: 删除模板
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
 *         description: 删除成功
 *       404:
 *         description: 模板不存在
 */

/**
 * @swagger
 * /notification-templates/{id}/preview:
 *   post:
 *     tags: [Notification Templates]
 *     summary: 预览模板渲染结果
 *     description: 使用提供的变量预览模板渲染后的标题和内容
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
 *             required: [variables]
 *             properties:
 *               variables:
 *                 type: object
 *                 description: 变量键值对
 *                 example:
 *                   userName: "张三"
 *                   taskName: "完成报告"
 *     responses:
 *       200:
 *         description: 预览结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 variables:
 *                   type: object
 *       404:
 *         description: 模板不存在
 *       400:
 *         description: 缺少必需变量
 */

/**
 * @swagger
 * /notification-templates/{id}/enable:
 *   post:
 *     tags: [Notification Templates]
 *     summary: 启用模板
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
 *         description: 启用成功
 *       404:
 *         description: 模板不存在
 */

/**
 * @swagger
 * /notification-templates/{id}/disable:
 *   post:
 *     tags: [Notification Templates]
 *     summary: 禁用模板
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
 *         description: 禁用成功
 *       404:
 *         description: 模板不存在
 */

export const notificationTemplateRouter: ExpressRouter = Router();

// 特殊路由必须在 /:id 之前
notificationTemplateRouter.post('/:id/preview', (req, res) =>
  getTemplateController().previewTemplate(req, res),
);
notificationTemplateRouter.post('/:id/enable', (req, res) =>
  getTemplateController().enableTemplate(req, res),
);
notificationTemplateRouter.post('/:id/preview', (req, res) =>
  getTemplateController().previewTemplate(req, res),
);
notificationTemplateRouter.post('/:id/enable', (req, res) =>
  getTemplateController().enableTemplate(req, res),
);
notificationTemplateRouter.post('/:id/disable', (req, res) =>
  getTemplateController().disableTemplate(req, res),
);
notificationTemplateRouter.post('/', (req, res) =>
  getTemplateController().createTemplate(req, res),
);
notificationTemplateRouter.get('/', (req, res) => getTemplateController().getTemplates(req, res));
notificationTemplateRouter.get('/:id', (req, res) =>
  getTemplateController().getTemplateById(req, res),
);
notificationTemplateRouter.put('/:id', (req, res) =>
  getTemplateController().updateTemplate(req, res),
);
notificationTemplateRouter.delete('/:id', (req, res) =>
  getTemplateController().deleteTemplate(req, res),
);

/**
 * DDD 聚合根控制模式在 API 设计中的体现：
 *
 * 1. **聚合根边界清晰**
 *    - Notification 是聚合根
 *    - DeliveryReceipt 是子实体（不单独暴露 API）
 *    - 所有操作通过 Notification 聚合根进行
 *
 * 2. **状态转换通过聚合根方法**
 *    - POST /:id/read (markAsRead)
 *    - POST /:id/dismiss (markAsDismissed)
 *    - 聚合根内部验证状态转换合法性
 *
 * 3. **批量操作保证业务规则**
 *    - POST /batch-read - 批量标记已读
 *    - POST /batch-dismiss - 批量标记忽略
 *    - POST /batch-delete - 批量删除（级联删除子实体）
 *
 * 4. **模板系统集成**
 *    - POST /from-template - 使用模板创建通知
 *    - 自动渲染变量，应用默认配置
 *
 * 5. **用户偏好控制**
 *    - 独立的偏好设置路由 (/notification-preferences)
 *    - 创建通知时自动应用用户偏好
 *    - 支持按渠道细粒度配置
 *
 * 6. **统一响应处理**
 *    - 所有方法使用 responseBuilder
 *    - 统一的错误处理和日志记录
 *    - 一致的 API 响应格式
 */
