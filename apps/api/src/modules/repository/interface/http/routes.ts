/**
 * Repository Routes
 * 仓储路由配置
 */

import { Router } from 'express';
import { RepositoryController } from './RepositoryController.js';

export function createRepositoryRoutes(): Router {
  const router = Router();

  // ============ 仓储管理路由 ============

  /**
   * 创建仓储
   * POST /repositories
   */
  router.post('/', async (req, res) => {
    await RepositoryController.createRepository(req, res);
  });

  /**
   * 获取仓储列表（支持查询参数）
   * GET /repositories
   */
  router.get('/', async (req, res) => {
    await RepositoryController.getRepositories(req, res);
  });

  /**
   * 根据ID获取仓储
   * GET /repositories/:uuid
   */
  router.get('/:uuid', async (req, res) => {
    await RepositoryController.getRepositoryById(req, res);
  });

  /**
   * 更新仓储
   * PUT /repositories/:uuid
   */
  router.put('/:uuid', async (req, res) => {
    await RepositoryController.updateRepository(req, res);
  });

  /**
   * 删除仓储
   * DELETE /repositories/:uuid
   */
  router.delete('/:uuid', async (req, res) => {
    await RepositoryController.deleteRepository(req, res);
  });

  /**
   * 激活仓储
   * POST /repositories/:uuid/activate
   */
  router.post('/:uuid/activate', async (req, res) => {
    await RepositoryController.activateRepository(req, res);
  });

  /**
   * 归档仓储
   * POST /repositories/:uuid/archive
   */
  router.post('/:uuid/archive', async (req, res) => {
    await RepositoryController.archiveRepository(req, res);
  });

  // ============ Git 操作路由 ============

  /**
   * 获取Git状态
   * GET /repositories/:uuid/git/status
   */
  router.get('/:uuid/git/status', async (req, res) => {
    await RepositoryController.getGitStatus(req, res);
  });

  /**
   * Git提交
   * POST /repositories/:uuid/git/commit
   */
  router.post('/:uuid/git/commit', async (req, res) => {
    await RepositoryController.commitChanges(req, res);
  });

  // ============ 资源管理路由 ============

  /**
   * 获取仓储资源
   * GET /repositories/:repositoryUuid/resources
   */
  router.get('/:repositoryUuid/resources', async (req, res) => {
    await RepositoryController.getResources(req, res);
  });

  /**
   * 创建资源
   * POST /repositories/:repositoryUuid/resources
   */
  router.post('/:repositoryUuid/resources', async (req, res) => {
    await RepositoryController.createResource(req, res);
  });

  /**
   * 更新资源
   * PUT /repositories/:repositoryUuid/resources/:resourceUuid
   */
  router.put('/:repositoryUuid/resources/:resourceUuid', async (req, res) => {
    await RepositoryController.updateResource(req, res);
  });

  /**
   * 删除资源
   * DELETE /repositories/:repositoryUuid/resources/:resourceUuid
   */
  router.delete('/:repositoryUuid/resources/:resourceUuid', async (req, res) => {
    await RepositoryController.deleteResource(req, res);
  });

  return router;
}
