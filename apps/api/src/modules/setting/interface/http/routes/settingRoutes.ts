import { Router, type Router as ExpressRouter } from 'express';
import { SettingController } from '../controllers/SettingController';

/**
 * @swagger
 * tags:
 *   - name: Settings
 *     description: 设置管理相关接口（DDD 聚合根控制模式）
 */

/**
 * Setting 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. 聚合根是操作的基本单位
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 * 4. 所有方法统一使用 responseBuilder
 */
const router: ExpressRouter = Router();

// ============ DDD 聚合根控制路由 ============
// 注意：特殊路由必须在通用 CRUD 路由之前注册，避免 /:id 路由冲突

// ===== 快捷查询路由 =====

/**
 * @swagger
 * /settings/user:
 *   get:
 *     tags: [Settings]
 *     summary: 获取用户设置列表
 *     description: 获取当前用户的所有设置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含历史记录
 *     responses:
 *       200:
 *         description: 成功返回用户设置列表
 */
router.get('/user', SettingController.getUserSettings);

/**
 * @swagger
 * /settings/system:
 *   get:
 *     tags: [Settings]
 *     summary: 获取系统设置列表
 *     description: 获取系统级别的所有设置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含历史记录
 *     responses:
 *       200:
 *         description: 成功返回系统设置列表
 */
router.get('/system', SettingController.getSystemSettings);

/**
 * @swagger
 * /settings/search:
 *   get:
 *     tags: [Settings]
 *     summary: 搜索设置
 *     description: 根据关键词搜索设置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [SYSTEM, USER, DEVICE]
 *         description: 可选的作用域过滤
 *     responses:
 *       200:
 *         description: 成功返回搜索结果
 */
router.get('/search', SettingController.searchSettings);

/**
 * @swagger
 * /settings/key/{key}:
 *   get:
 *     tags: [Settings]
 *     summary: 通过 key 获取设置
 *     description: 根据设置键获取设置详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置键
 *       - in: query
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SYSTEM, USER, DEVICE]
 *         description: 作用域
 *     responses:
 *       200:
 *         description: 成功返回设置详情
 *       404:
 *         description: 设置不存在
 */
router.get('/key/:key', SettingController.getSettingByKey);

// ===== 聚合根控制：设置操作 =====

/**
 * @swagger
 * /settings/{id}/value:
 *   patch:
 *     tags: [Settings]
 *     summary: 更新设置值
 *     description: 更新设置的值（自动记录历史）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 description: 新的设置值
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 设置不存在
 *       403:
 *         description: 设置为只读
 */
router.patch('/:id/value', SettingController.updateSettingValue);

/**
 * @swagger
 * /settings/{id}/reset:
 *   post:
 *     tags: [Settings]
 *     summary: 重置设置
 *     description: 将设置重置为默认值
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *     responses:
 *       200:
 *         description: 重置成功
 *       404:
 *         description: 设置不存在
 *       403:
 *         description: 设置为只读
 */
router.post('/:id/reset', SettingController.resetSetting);

/**
 * @swagger
 * /settings/{id}/sync:
 *   post:
 *     tags: [Settings]
 *     summary: 同步设置
 *     description: 同步设置到云端/设备
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *     responses:
 *       200:
 *         description: 同步成功
 *       404:
 *         description: 设置不存在
 */
router.post('/:id/sync', SettingController.syncSetting);

/**
 * @swagger
 * /settings/{id}/validate:
 *   post:
 *     tags: [Settings]
 *     summary: 验证设置值
 *     description: 验证给定的值是否符合设置的验证规则
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 description: 要验证的值
 *     responses:
 *       200:
 *         description: 返回验证结果
 */
router.post('/:id/validate', SettingController.validateSettingValue);

// ===== 批量操作路由 =====

/**
 * @swagger
 * /settings/batch:
 *   patch:
 *     tags: [Settings]
 *     summary: 批量更新设置
 *     description: 批量更新多个设置的值
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - uuid
 *                     - value
 *                   properties:
 *                     uuid:
 *                       type: string
 *                     value:
 *                       description: 新的值
 *     responses:
 *       200:
 *         description: 批量更新成功
 */
router.patch('/batch', SettingController.updateManySettings);

// ===== 导入导出路由 =====

/**
 * @swagger
 * /settings/export:
 *   get:
 *     tags: [Settings]
 *     summary: 导出设置配置
 *     description: 导出指定作用域的所有设置配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SYSTEM, USER, DEVICE]
 *         description: 作用域
 *     responses:
 *       200:
 *         description: 成功导出配置
 */
router.get('/export', SettingController.exportSettings);

/**
 * @swagger
 * /settings/import:
 *   post:
 *     tags: [Settings]
 *     summary: 导入设置配置
 *     description: 导入设置配置，更新现有设置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scope
 *               - config
 *             properties:
 *               scope:
 *                 type: string
 *                 enum: [SYSTEM, USER, DEVICE]
 *               config:
 *                 type: object
 *                 description: key-value 格式的配置对象
 *     responses:
 *       200:
 *         description: 导入成功
 */
router.post('/import', SettingController.importSettings);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /settings:
 *   post:
 *     tags: [Settings]
 *     summary: 创建设置
 *     description: 创建新的设置项
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - name
 *               - valueType
 *               - value
 *               - defaultValue
 *               - scope
 *             properties:
 *               key:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               valueType:
 *                 type: string
 *                 enum: [STRING, NUMBER, BOOLEAN, JSON, ARRAY, OBJECT]
 *               value:
 *                 description: 当前值
 *               defaultValue:
 *                 description: 默认值
 *               scope:
 *                 type: string
 *                 enum: [SYSTEM, USER, DEVICE]
 *               groupUuid:
 *                 type: string
 *               validation:
 *                 type: object
 *               ui:
 *                 type: object
 *               isEncrypted:
 *                 type: boolean
 *               isReadOnly:
 *                 type: boolean
 *               isSystemSetting:
 *                 type: boolean
 *               syncConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: 设置创建成功
 *       409:
 *         description: 设置键已存在
 */
router.post('/', SettingController.createSetting);

/**
 * @swagger
 * /settings/{id}:
 *   get:
 *     tags: [Settings]
 *     summary: 获取设置详情
 *     description: 根据UUID获取设置详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含历史记录
 *     responses:
 *       200:
 *         description: 成功返回设置详情
 *       404:
 *         description: 设置不存在
 *   delete:
 *     tags: [Settings]
 *     summary: 删除设置
 *     description: 删除设置（软删除）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 设置UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 设置不存在
 *       403:
 *         description: 无法删除系统设置
 */
router.get('/:id', SettingController.getSetting);
router.delete('/:id', SettingController.deleteSetting);

export default router;
