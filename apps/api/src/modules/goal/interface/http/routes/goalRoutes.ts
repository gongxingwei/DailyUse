import { Router, type Router as ExpressRouter } from 'express';
import { GoalController } from '../controllers/GoalController';

/**
 * @swagger
 * tags:
 *   - name: Goals
 *     description: 目标管理相关接口（DDD 聚合根控制模式）
 *   - name: Goal Aggregates
 *     description: 目标聚合根管理（关键结果、记录、复盘）
 */

/**
 * Goal 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. 子实体操作必须通过聚合根路径
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 * 4. 所有方法统一使用 responseBuilder
 */
const router: ExpressRouter = Router();

// ============ DDD 聚合根控制路由 ============
// 注意：聚合路由必须在通用 CRUD 路由之前注册，避免 /:id 路由冲突

// ===== 聚合根控制：关键结果管理 =====
// 体现DDD原则：KeyResult只能通过Goal聚合根操作

/**
 * @swagger
 * /goals/{id}/key-results:
 *   post:
 *     tags: [Goal Aggregates]
 *     summary: 创建关键结果
 *     description: 通过目标聚合根创建关键结果，维护业务规则一致性
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
 *             required: [name, startValue, targetValue, unit, weight]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 关键结果名称
 *               description:
 *                 type: string
 *                 description: 关键结果描述
 *               startValue:
 *                 type: number
 *                 description: 起始值
 *               targetValue:
 *                 type: number
 *                 description: 目标值
 *               currentValue:
 *                 type: number
 *                 description: 当前值
 *                 default: 0
 *               unit:
 *                 type: string
 *                 description: 单位
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: 权重（%）
 *               calculationMethod:
 *                 type: string
 *                 enum: [sum, average, ratio]
 *                 description: 计算方法
 *     responses:
 *       201:
 *         description: 关键结果创建成功
 *       400:
 *         description: 请求参数错误或权重超限
 */
router.post('/:id/key-results', GoalController.createKeyResult);

/**
 * @swagger
 * /goals/{id}/key-results/{keyResultId}:
 *   put:
 *     tags: [Goal Aggregates]
 *     summary: 更新关键结果
 *     description: 通过目标聚合根更新关键结果，重新验证权重总和
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *       - in: path
 *         name: keyResultId
 *         required: true
 *         schema:
 *           type: string
 *         description: 关键结果ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currentValue:
 *                 type: number
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               status:
 *                 type: string
 *                 enum: [active, paused, completed]
 *     responses:
 *       200:
 *         description: 关键结果更新成功
 *       400:
 *         description: 权重超限或参数错误
 *   delete:
 *     tags: [Goal Aggregates]
 *     summary: 删除关键结果
 *     description: 通过目标聚合根删除关键结果，级联删除相关记录
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标ID
 *       - in: path
 *         name: keyResultId
 *         required: true
 *         schema:
 *           type: string
 *         description: 关键结果ID
 *     responses:
 *       200:
 *         description: 关键结果删除成功
 *       404:
 *         description: 关键结果不存在
 */
router.put('/:id/key-results/:keyResultId', GoalController.updateKeyResult);
router.delete('/:id/key-results/:keyResultId', GoalController.deleteKeyResult);

/**
 * @swagger
 * /goals/{id}/key-results/batch-weight:
 *   put:
 *     tags: [Goal Aggregates]
 *     summary: 批量更新关键结果权重
 *     description: 通过聚合根验证权重总和不超过100%，原子性更新所有关键结果
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
 *               keyResults:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *     responses:
 *       200:
 *         description: 权重更新成功
 *       400:
 *         description: 权重总和超过100%
 */
router.put('/:id/key-results/batch-weight', GoalController.batchUpdateKeyResultWeights);

// ===== 聚合根控制：目标记录管理 =====

/**
 * @swagger
 * /goals/{id}/records:
 *   post:
 *     tags: [Goal Aggregates]
 *     summary: 创建目标记录
 *     description: 通过聚合根创建记录，自动更新关键结果当前值
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
 *             required: [keyResultUuid, value]
 *             properties:
 *               keyResultUuid:
 *                 type: string
 *               value:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: 记录创建成功
 *       400:
 *         description: 参数错误
 */
router.post('/:id/records', GoalController.createGoalRecord);

// ===== 聚合根控制：目标复盘管理 =====

/**
 * @swagger
 * /goals/{id}/reviews:
 *   post:
 *     tags: [Goal Aggregates]
 *     summary: 创建目标复盘
 *     description: 通过聚合根创建复盘，自动生成状态快照
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
 *             required: [title, type, content, rating]
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly, custom]
 *               content:
 *                 type: object
 *               rating:
 *                 type: object
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 复盘创建成功
 *       400:
 *         description: 参数错误
 */
router.post('/:id/reviews', GoalController.createGoalReview);

// ===== 聚合根完整视图 =====

/**
 * @swagger
 * /goals/{id}/aggregate:
 *   get:
 *     tags: [Goal Aggregates]
 *     summary: 获取聚合根完整视图
 *     description: 获取目标及所有子实体的完整数据
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
 *         description: 聚合视图获取成功
 *       404:
 *         description: 目标不存在
 */
router.get('/:id/aggregate', GoalController.getGoalAggregateView);

// ===== 聚合根批量操作 =====

/**
 * @swagger
 * /goals/{id}/clone:
 *   post:
 *     tags: [Goal Aggregates]
 *     summary: 克隆目标聚合根
 *     description: 复制目标及所有关键结果，保持数据关联关系
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
 *               newName:
 *                 type: string
 *               newDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: 克隆成功
 *       404:
 *         description: 目标不存在
 */
router.post('/:id/clone', GoalController.cloneGoalAggregate);

// ============ 基础 CRUD 路由 ============

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
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 搜索结果
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
 *               description:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: NORMAL
 *     responses:
 *       201:
 *         description: 目标创建成功
 *       400:
 *         description: 请求参数错误
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, COMPLETED, ARCHIVED]
 *     responses:
 *       200:
 *         description: 目标列表获取成功
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
 *     responses:
 *       200:
 *         description: 目标详情
 *       404:
 *         description: 目标不存在
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
 *       404:
 *         description: 目标不存在
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
 *     responses:
 *       200:
 *         description: 目标删除成功
 *       404:
 *         description: 目标不存在
 */
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// ============ 状态管理路由 ============

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
 *     responses:
 *       200:
 *         description: 目标激活成功
 *       404:
 *         description: 目标不存在
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 目标暂停成功
 *       404:
 *         description: 目标不存在
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNote:
 *                 type: string
 *               actualProgress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: 目标完成成功
 *       404:
 *         description: 目标不存在
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 目标存档成功
 *       404:
 *         description: 目标不存在
 */
router.post('/:id/archive', GoalController.archiveGoal);

export default router;

/**
 * DDD 聚合根控制模式在 API 设计中的体现：
 *
 * 1. **路由层次结构体现聚合边界**
 *    - /goals/:id/key-results/* (关键结果属于Goal聚合)
 *    - /goals/:id/records/* (记录属于Goal聚合)
 *    - /goals/:id/reviews/* (复盘属于Goal聚合)
 *
 * 2. **聚合根控制业务规则**
 *    - 关键结果权重总和验证
 *    - 数据一致性维护
 *    - 级联删除操作
 *
 * 3. **聚合根提供统一视图**
 *    - /goals/:id/aggregate 提供完整聚合视图
 *    - 包含所有相关子实体信息
 *    - 保证数据关联正确性
 *
 * 4. **批量操作通过聚合根**
 *    - 批量权重更新保证业务规则
 *    - 聚合根克隆保证完整性
 *    - 原子性操作保证一致性
 *
 * 5. **统一响应处理**
 *    - 所有方法使用 responseBuilder
 *    - 统一的错误处理和日志记录
 *    - 一致的 API 响应格式
 */
