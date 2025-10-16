import { Router } from 'express';
import { ReminderController } from './ReminderController';

/**
 * Reminder 模块路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 * 4. 路由分组：模板管理、搜索统计
 */

const router = Router();

// ===== 提醒模板管理 =====

/**
 * @swagger
 * /api/reminders/templates:
 *   post:
 *     tags: [Reminder]
 *     summary: 创建提醒模板
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - name
 *               - targetType
 *               - triggerType
 *             properties:
 *               accountUuid:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [TASK, EVENT, GOAL, HABIT, CUSTOM]
 *               triggerType:
 *                 type: string
 *                 enum: [FIXED_TIME, INTERVAL]
 *               advanceMinutes:
 *                 type: number
 *               reminderContent:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 提醒模板创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/templates', ReminderController.createReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取提醒模板详情
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 提醒模板不存在
 */
router.get('/templates/:uuid', ReminderController.getReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   patch:
 *     tags: [Reminder]
 *     summary: 更新提醒模板
 *     parameters:
 *       - in: path
 *         name: uuid
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               advanceMinutes:
 *                 type: number
 *               reminderContent:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 提醒模板不存在
 */
router.patch('/templates/:uuid', ReminderController.updateReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   delete:
 *     tags: [Reminder]
 *     summary: 删除提醒模板
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 提醒模板不存在
 */
router.delete('/templates/:uuid', ReminderController.deleteReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}/toggle:
 *   post:
 *     tags: [Reminder]
 *     summary: 切换提醒模板启用状态
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 切换成功
 *       404:
 *         description: 提醒模板不存在
 */
router.post('/templates/:uuid/toggle', ReminderController.toggleReminderTemplateStatus);

// ===== 查询和统计 =====

/**
 * @swagger
 * /api/reminders/templates/user/{accountUuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取用户的所有提醒模板
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/templates/user/:accountUuid', ReminderController.getUserReminderTemplates);

/**
 * @swagger
 * /api/reminders/templates/search:
 *   get:
 *     tags: [Reminder]
 *     summary: 搜索提醒模板
 *     parameters:
 *       - in: query
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/templates/search', ReminderController.searchReminderTemplates);

/**
 * @swagger
 * /api/reminders/statistics/{accountUuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取提醒统计
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics/:accountUuid', ReminderController.getReminderStatistics);

export default router;
