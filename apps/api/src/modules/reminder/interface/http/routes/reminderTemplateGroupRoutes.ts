import { Router } from 'express';
import { ReminderTemplateGroupController } from '../controllers/ReminderTemplateGroupController';

/**
 * @swagger
 * tags:
 *   - name: Reminder Template Groups
 *     description: 提醒模板分组管理接口
 */

/**
 * ReminderTemplateGroup 聚合根的独立路由
 * 路径前缀：/api/reminders/groups
 */
const router = Router();

// ========== ReminderTemplateGroup 聚合根路由 ==========

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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分组名称
 *               description:
 *                 type: string
 *                 description: 分组描述
 *               color:
 *                 type: string
 *                 description: 分组颜色标识
 *               isEnabled:
 *                 type: boolean
 *                 default: true
 *                 description: 是否启用
 *     responses:
 *       201:
 *         description: 分组创建成功
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
 *     tags: [Reminder Template Groups]
 *     summary: 获取提醒模板分组列表
 *     description: 获取当前用户的所有提醒模板分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *         description: 筛选启用状态
 *     responses:
 *       200:
 *         description: 分组列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/', ReminderTemplateGroupController.createTemplateGroup);
router.get('/', ReminderTemplateGroupController.getTemplateGroups);

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
 *         description: 分组详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 分组不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Reminder Template Groups]
 *     summary: 更新分组信息
 *     description: 更新提醒模板分组的信息
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
 *                 description: 分组名称
 *               description:
 *                 type: string
 *                 description: 分组描述
 *               color:
 *                 type: string
 *                 description: 分组颜色
 *     responses:
 *       200:
 *         description: 分组更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 分组不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Reminder Template Groups]
 *     summary: 删除分组
 *     description: 删除提醒模板分组（如果存在关联模板则不能删除）
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 分组下存在模板，不能删除
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 分组不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:groupUuid', ReminderTemplateGroupController.getTemplateGroup);
router.put('/:groupUuid', ReminderTemplateGroupController.updateTemplateGroup);
router.delete('/:groupUuid', ReminderTemplateGroupController.deleteTemplateGroup);

/**
 * @swagger
 * /reminders/groups/{groupUuid}/toggle:
 *   patch:
 *     tags: [Reminder Template Groups]
 *     summary: 切换分组状态
 *     description: 切换提醒模板分组的启用/禁用状态
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
 *         description: 状态切换成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 分组不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:groupUuid/toggle', ReminderTemplateGroupController.toggleTemplateGroupEnabled);

export default router;
