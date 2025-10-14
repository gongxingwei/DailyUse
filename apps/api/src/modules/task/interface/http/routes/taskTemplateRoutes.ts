import { Router, type Router as ExpressRouter } from 'express';
import { TaskTemplateController } from '../controllers/TaskTemplateController';
import taskInstanceRoutes from './taskInstanceRoutes';

/**
 * @swagger
 * tags:
 *   - name: Task Templates
 *     description: 任务模板管理相关接口
 */

/**
 * TaskTemplate 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 */
const router: ExpressRouter = Router();

// ============ 子路由：任务实例 ============
router.use('/instances', taskInstanceRoutes);

// ============ 聚合根操作路由 ============

/**
 * @swagger
 * /task-templates/{id}/activate:
 *   post:
 *     tags: [Task Templates]
 *     summary: 激活任务模板
 *     description: 将任务模板状态设置为激活
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功激活模板
 */
router.post('/:id/activate', TaskTemplateController.activateTaskTemplate);

/**
 * @swagger
 * /task-templates/{id}/pause:
 *   post:
 *     tags: [Task Templates]
 *     summary: 暂停任务模板
 *     description: 将任务模板状态设置为暂停
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功暂停模板
 */
router.post('/:id/pause', TaskTemplateController.pauseTaskTemplate);

/**
 * @swagger
 * /task-templates/{id}/archive:
 *   post:
 *     tags: [Task Templates]
 *     summary: 归档任务模板
 *     description: 将任务模板状态设置为归档
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功归档模板
 */
router.post('/:id/archive', TaskTemplateController.archiveTaskTemplate);

/**
 * @swagger
 * /task-templates/{id}/generate-instances:
 *   post:
 *     tags: [Task Templates]
 *     summary: 生成任务实例
 *     description: 根据模板和重复规则生成任务实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toDate
 *             properties:
 *               toDate:
 *                 type: number
 *                 description: 生成到的日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功生成任务实例
 */
router.post('/:id/generate-instances', TaskTemplateController.generateInstances);

/**
 * @swagger
 * /task-templates/{id}/bind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 绑定到目标
 *     description: 将任务模板绑定到OKR目标
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalUuid
 *               - keyResultUuid
 *               - incrementValue
 *             properties:
 *               goalUuid:
 *                 type: string
 *                 description: 目标UUID
 *               keyResultUuid:
 *                 type: string
 *                 description: 关键结果UUID
 *               incrementValue:
 *                 type: number
 *                 description: 完成任务时增加的值
 *     responses:
 *       200:
 *         description: 成功绑定到目标
 */
router.post('/:id/bind-goal', TaskTemplateController.bindToGoal);

/**
 * @swagger
 * /task-templates/{id}/unbind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 解除目标绑定
 *     description: 解除任务模板与OKR目标的绑定
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 成功解除绑定
 */
router.post('/:id/unbind-goal', TaskTemplateController.unbindFromGoal);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /task-templates:
 *   post:
 *     tags: [Task Templates]
 *     summary: 创建任务模板
 *     description: 创建新的任务模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - taskType
 *               - timeConfig
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               taskType:
 *                 type: string
 *                 enum: [ONE_TIME, RECURRING]
 *               timeConfig:
 *                 type: object
 *               recurrenceRule:
 *                 type: object
 *               reminderConfig:
 *                 type: object
 *               importance:
 *                 type: string
 *               urgency:
 *                 type: string
 *               folderUuid:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: 任务模板创建成功
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板列表
 *     description: 获取用户的所有任务模板
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, ARCHIVED, DELETED]
 *         description: 按状态过滤
 *       - in: query
 *         name: folderUuid
 *         schema:
 *           type: string
 *         description: 按文件夹过滤
 *       - in: query
 *         name: goalUuid
 *         schema:
 *           type: string
 *         description: 按目标过滤
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 按标签过滤（逗号分隔）
 *     responses:
 *       200:
 *         description: 成功返回任务模板列表
 */
router.post('/', TaskTemplateController.createTaskTemplate);
router.get('/', TaskTemplateController.getTaskTemplates);

/**
 * @swagger
 * /task-templates/{id}:
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板详情
 *     description: 根据UUID获取任务模板详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含子实体（实例和历史记录）
 *     responses:
 *       200:
 *         description: 成功返回任务模板详情
 *       404:
 *         description: 任务模板不存在
 *   delete:
 *     tags: [Task Templates]
 *     summary: 删除任务模板
 *     description: 删除任务模板及其所有实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 任务模板不存在
 */
router.get('/:id', TaskTemplateController.getTaskTemplate);
router.delete('/:id', TaskTemplateController.deleteTaskTemplate);

export default router;
