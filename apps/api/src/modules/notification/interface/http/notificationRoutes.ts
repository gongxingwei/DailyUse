import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { NotificationController } from './NotificationController';

const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 通知管理相关接口
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: 创建通知
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - title
 *               - content
 *               - type
 *               - category
 *             properties:
 *               accountUuid:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               relatedEntityType:
 *                 type: string
 *               relatedEntityUuid:
 *                 type: string
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 通知创建成功
 *       500:
 *         description: 服务器错误
 */
router.post('/', NotificationController.createNotification);

/**
 * @swagger
 * /api/notifications/from-template:
 *   post:
 *     summary: 从模板创建通知
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - templateUuid
 *               - variables
 *             properties:
 *               accountUuid:
 *                 type: string
 *               templateUuid:
 *                 type: string
 *               variables:
 *                 type: object
 *               relatedEntityType:
 *                 type: string
 *               relatedEntityUuid:
 *                 type: string
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 通知创建成功
 *       500:
 *         description: 服务器错误
 */
router.post('/from-template', NotificationController.createFromTemplate);

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: 批量发送通知
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 通知批量发送成功
 *       500:
 *         description: 服务器错误
 */
router.post('/bulk', NotificationController.sendBulk);

/**
 * @swagger
 * /api/notifications/{uuid}:
 *   get:
 *     summary: 获取通知详情
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 成功获取通知详情
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:uuid', NotificationController.getNotification);

/**
 * @swagger
 * /api/notifications/user/{accountUuid}:
 *   get:
 *     summary: 获取用户的通知列表
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeRead
 *         schema:
 *           type: boolean
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
 *         description: 成功获取通知列表
 *       500:
 *         description: 服务器错误
 */
router.get('/user/:accountUuid', NotificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications/user/{accountUuid}/unread:
 *   get:
 *     summary: 获取未读通知
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功获取未读通知
 *       500:
 *         description: 服务器错误
 */
router.get('/user/:accountUuid/unread', NotificationController.getUnreadNotifications);

/**
 * @swagger
 * /api/notifications/user/{accountUuid}/unread-count:
 *   get:
 *     summary: 获取未读通知数量
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取未读通知数量
 *       500:
 *         description: 服务器错误
 */
router.get('/user/:accountUuid/unread-count', NotificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/user/{accountUuid}/stats:
 *   get:
 *     summary: 获取分类统计
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取分类统计
 *       500:
 *         description: 服务器错误
 */
router.get('/user/:accountUuid/stats', NotificationController.getCategoryStats);

/**
 * @swagger
 * /api/notifications/{uuid}/read:
 *   patch:
 *     summary: 标记通知为已读
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 标记成功
 *       500:
 *         description: 服务器错误
 */
router.patch('/:uuid/read', NotificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/read/many:
 *   patch:
 *     summary: 批量标记为已读
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uuids
 *             properties:
 *               uuids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量标记成功
 *       500:
 *         description: 服务器错误
 */
router.patch('/read/many', NotificationController.markManyAsRead);

/**
 * @swagger
 * /api/notifications/user/{accountUuid}/read-all:
 *   patch:
 *     summary: 标记所有通知为已读
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 标记成功
 *       500:
 *         description: 服务器错误
 */
router.patch('/user/:accountUuid/read-all', NotificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{uuid}:
 *   delete:
 *     summary: 删除通知
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: 删除成功
 *       500:
 *         description: 服务器错误
 */
router.delete('/:uuid', NotificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications/many:
 *   delete:
 *     summary: 批量删除通知
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           default: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uuids
 *             properties:
 *               uuids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量删除成功
 *       500:
 *         description: 服务器错误
 */
router.delete('/many', NotificationController.deleteManyNotifications);

/**
 * @swagger
 * /api/notifications/preferences/{accountUuid}:
 *   get:
 *     summary: 获取用户偏好设置
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取偏好设置
 *       500:
 *         description: 服务器错误
 */
router.get('/preferences/:accountUuid', NotificationController.getPreference);

/**
 * @swagger
 * /api/notifications/preferences/{accountUuid}:
 *   put:
 *     summary: 更新用户偏好设置
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: accountUuid
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
 *               channelPreferences:
 *                 type: object
 *               categoryPreferences:
 *                 type: object
 *               doNotDisturbConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: 偏好设置更新成功
 *       500:
 *         description: 服务器错误
 */
router.put('/preferences/:accountUuid', NotificationController.updatePreference);

export default router;
