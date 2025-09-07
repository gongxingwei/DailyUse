/**
 * Repository Routes
 * 仓储路由配置
 */

import { Router } from 'express';
import { RepositoryController } from './RepositoryController.js';

export function createRepositoryRoutes(controller: RepositoryController): Router {
  const router = Router();

  // ============ 仓储管理路由 ============

  /**
   * 创建仓储
   * POST /repositories
   */
  router.post('/', async (req, res) => {
    await controller.createRepository(req, res);
  });

  /**
   * 获取所有仓储
   * GET /repositories
   */
  router.get('/', async (req, res) => {
    // 如果有查询参数，使用查询端点
    if (Object.keys(req.query).length > 0) {
      await controller.queryRepositories(req, res);
    } else {
      await controller.getAllRepositories(req, res);
    }
  });

  /**
   * 查询仓储
   * GET /repositories/query
   */
  router.get('/query', async (req, res) => {
    await controller.queryRepositories(req, res);
  });

  /**
   * 获取仓储统计
   * GET /repositories/stats
   */
  router.get('/stats', async (req, res) => {
    await controller.getRepositoryStats(req, res);
  });

  /**
   * 验证仓储路径
   * POST /repositories/validate-path
   */
  router.post('/validate-path', async (req, res) => {
    await controller.validatePath(req, res);
  });

  /**
   * 根据名称获取仓储
   * GET /repositories/by-name/:name
   */
  router.get('/by-name/:name', async (req, res) => {
    await controller.getRepositoryByName(req, res);
  });

  /**
   * 根据路径获取仓储
   * POST /repositories/by-path
   */
  router.post('/by-path', async (req, res) => {
    await controller.getRepositoryByPath(req, res);
  });

  /**
   * 根据目标获取相关仓储
   * GET /repositories/by-goal/:goalId
   */
  router.get('/by-goal/:goalId', async (req, res) => {
    await controller.getRepositoriesByGoal(req, res);
  });

  /**
   * 检查仓储是否存在
   * GET /repositories/exists/:name
   */
  router.get('/exists/:name', async (req, res) => {
    await controller.repositoryExists(req, res);
  });

  /**
   * 根据ID获取仓储
   * GET /repositories/:uuid
   */
  router.get('/:uuid', async (req, res) => {
    await controller.getRepository(req, res);
  });

  /**
   * 更新仓储
   * PUT /repositories/:uuid
   */
  router.put('/:uuid', async (req, res) => {
    await controller.updateRepository(req, res);
  });

  /**
   * 删除仓储
   * DELETE /repositories/:uuid
   */
  router.delete('/:uuid', async (req, res) => {
    await controller.deleteRepository(req, res);
  });

  // ============ Git 操作路由 ============

  /**
   * 初始化Git仓储
   * POST /repositories/:uuid/git/init
   */
  router.post('/:uuid/git/init', async (req, res) => {
    await controller.initGit(req, res);
  });

  /**
   * 获取Git状态
   * GET /repositories/:uuid/git/status
   */
  router.get('/:uuid/git/status', async (req, res) => {
    await controller.getGitStatus(req, res);
  });

  /**
   * 添加文件到Git
   * POST /repositories/:uuid/git/add
   */
  router.post('/:uuid/git/add', async (req, res) => {
    await controller.addToGit(req, res);
  });

  /**
   * Git提交
   * POST /repositories/:uuid/git/commit
   */
  router.post('/:uuid/git/commit', async (req, res) => {
    await controller.commitToGit(req, res);
  });

  /**
   * 获取Git提交历史
   * GET /repositories/:uuid/git/log
   */
  router.get('/:uuid/git/log', async (req, res) => {
    await controller.getGitLog(req, res);
  });

  return router;
}
