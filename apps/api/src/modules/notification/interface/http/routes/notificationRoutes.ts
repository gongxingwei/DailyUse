import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationPreferenceController } from '../controllers/NotificationPreferenceController';

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: 通知管理相关接口（DDD 聚合根控制模式）
 *   - name: Notification Preferences
 *     description: 通知偏好设置
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
const router = Router();

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
router.get('/unread-count', NotificationController.getUnreadCount);

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
router.get('/stats', NotificationController.getNotificationStats);

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
router.post('/from-template', NotificationController.createFromTemplate);

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
router.post('/batch-read', NotificationController.batchMarkAsRead);

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
router.post('/batch-dismiss', NotificationController.batchMarkAsDismissed);

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
router.post('/batch-delete', NotificationController.batchDeleteNotifications);

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
router.post('/', NotificationController.createNotification);
router.get('/', NotificationController.getNotifications);

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
router.get('/:id', NotificationController.getNotificationById);
router.delete('/:id', NotificationController.deleteNotification);

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
router.post('/:id/read', NotificationController.markAsRead);

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
router.post('/:id/dismiss', NotificationController.markAsDismissed);

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

export const notificationPreferenceRoutes = Router();
notificationPreferenceRoutes.get('/', NotificationPreferenceController.getPreference);
notificationPreferenceRoutes.put('/', NotificationPreferenceController.updatePreference);
notificationPreferenceRoutes.patch(
  '/channels/:channel',
  NotificationPreferenceController.updateChannelPreference,
);

export default router;

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
