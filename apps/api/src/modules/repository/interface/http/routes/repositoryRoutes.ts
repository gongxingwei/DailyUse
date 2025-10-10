import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';
import repositoryStatisticsRoutes from './repositoryStatisticsRoutes';

/**
 * @swagger
 * tags:
 *   - name: Repositories
 *     description: 仓库管理相关接口（DDD 聚合根控制模式）
 *   - name: Repository Aggregates
 *     description: 仓库聚合根管理（资源、引用、链接内容、浏览器）
 */

/**
 * Repository 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. 子实体操作必须通过聚合根路径
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 * 4. 所有方法统一使用 responseBuilder
 * 5. 每个聚合根独立的路由文件
 */
const router = Router();

// ============ DDD 聚合根控制路由 ============
// 注意：聚合路由必须在通用 CRUD 路由之前注册，避免 /:id 路由冲突

// ===== 聚合根控制：统计信息 =====
// 统计信息路由已独立到 repositoryStatisticsRoutes.ts
router.use('/statistics', repositoryStatisticsRoutes);

// ===== 聚合根控制：仓库操作 =====

/**
 * @swagger
 * /repositories/{id}/sync:
 *   post:
 *     tags: [Repository Aggregates]
 *     summary: 同步仓库
 *     description: 同步 Git 仓库（pull/push/both）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 仓库UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [pull, push, both]
 *                 default: both
 *     responses:
 *       200:
 *         description: 同步成功
 */
router.post('/:id/sync', RepositoryController.syncRepository);

/**
 * @swagger
 * /repositories/{id}/scan:
 *   post:
 *     tags: [Repository Aggregates]
 *     summary: 扫描仓库文件
 *     description: 扫描仓库文件系统并更新资源列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 仓库UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deep:
 *                 type: boolean
 *                 default: false
 *                 description: 是否深度扫描
 *               updateResources:
 *                 type: boolean
 *                 default: true
 *                 description: 是否更新资源信息
 *     responses:
 *       200:
 *         description: 扫描成功
 */
router.post('/:id/scan', RepositoryController.scanRepository);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /repositories:
 *   post:
 *     tags: [Repositories]
 *     summary: 创建仓库
 *     description: 创建新的代码仓库
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - path
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [git, file, web, database, api, other]
 *               path:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *               initializeGit:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 仓库创建成功
 *   get:
 *     tags: [Repositories]
 *     summary: 获取仓库列表
 *     description: 获取用户的所有仓库
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含子实体（资源、浏览器）
 *     responses:
 *       200:
 *         description: 成功返回仓库列表
 */
router.post('/', RepositoryController.createRepository);
router.get('/', RepositoryController.getRepositories);

/**
 * @swagger
 * /repositories/{id}:
 *   get:
 *     tags: [Repositories]
 *     summary: 获取仓库详情
 *     description: 根据UUID获取仓库详细信息（包含所有子实体）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 仓库UUID
 *     responses:
 *       200:
 *         description: 成功返回仓库详情
 *       404:
 *         description: 仓库不存在
 *   put:
 *     tags: [Repositories]
 *     summary: 更新仓库
 *     description: 更新仓库配置信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 仓库UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 仓库不存在
 *   delete:
 *     tags: [Repositories]
 *     summary: 删除仓库
 *     description: 删除仓库及其所有子实体
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 仓库UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deleteFiles:
 *                 type: boolean
 *                 default: false
 *                 description: 是否删除物理文件
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 仓库不存在
 */
router.get('/:id', RepositoryController.getRepository);
router.put('/:id', RepositoryController.updateRepository);
router.delete('/:id', RepositoryController.deleteRepository);

export default router;
