import { Router } from 'express';
import { RepositoryStatisticsController } from '../controllers/RepositoryStatisticsController';

/**
 * @swagger
 * tags:
 *   - name: Repository Statistics
 *     description: 仓库统计信息管理接口
 */

/**
 * RepositoryStatistics 路由配置
 * 采用 DDD 聚合根独立路由设计
 *
 * 路由设计原则：
 * 1. 每个聚合根独立的路由文件
 * 2. 清晰的职责边界
 * 3. 统一的响应格式
 */
const router = Router();

/**
 * @swagger
 * /repositories/statistics:
 *   get:
 *     tags: [Repository Statistics]
 *     summary: 获取仓库统计信息
 *     description: 获取当前账户的仓库统计数据（总数、资源、Git等），如果不存在则自动初始化
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 2000
 *                 message:
 *                   type: string
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountUuid:
 *                       type: string
 *                     totalRepositories:
 *                       type: integer
 *                     activeRepositories:
 *                       type: integer
 *                     archivedRepositories:
 *                       type: integer
 *                     totalResources:
 *                       type: integer
 *                     totalFiles:
 *                       type: integer
 *                     totalFolders:
 *                       type: integer
 *                     gitEnabledRepos:
 *                       type: integer
 *                     totalCommits:
 *                       type: integer
 *                     totalReferences:
 *                       type: integer
 *                     totalLinkedContents:
 *                       type: integer
 *                     totalSizeBytes:
 *                       type: string
 *                     lastUpdatedAt:
 *                       type: number
 *                     createdAt:
 *                       type: number
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/', RepositoryStatisticsController.getStatistics);

/**
 * @swagger
 * /repositories/statistics/initialize:
 *   post:
 *     tags: [Repository Statistics]
 *     summary: 初始化统计信息
 *     description: 从现有仓库数据重新计算并初始化账户的统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 统计信息初始化成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/initialize', RepositoryStatisticsController.initializeStatistics);

/**
 * @swagger
 * /repositories/statistics/recalculate:
 *   post:
 *     tags: [Repository Statistics]
 *     summary: 重新计算统计信息
 *     description: 重新计算账户的仓库统计（用于修复数据不一致问题）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: 是否强制重新计算（即使已有数据）
 *     responses:
 *       200:
 *         description: 统计信息重算成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/recalculate', RepositoryStatisticsController.recalculateStatistics);

/**
 * @swagger
 * /repositories/statistics:
 *   delete:
 *     tags: [Repository Statistics]
 *     summary: 删除统计信息
 *     description: 删除账户的仓库统计数据（通常在删除账户时使用）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 统计信息不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/', RepositoryStatisticsController.deleteStatistics);

export default router;
