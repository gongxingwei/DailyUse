/**
 * Editor Routes
 * 编辑器路由配置
 *
 * 包含两套路由：
 * 1. 聚合根控制路由（推荐） - 基于DDD聚合根控制模式
 * 2. 传统CRUD路由（兼容） - 保持向后兼容性
 */

import { Router } from 'express';
import { EditorController } from './EditorController.js';
import { createEditorAggregateRoutes } from './editorAggregateRoutes.js';

export function createEditorRoutes(): Router {
  const router = Router();

  // ============ 聚合根控制路由（推荐使用） ============

  /**
   * 挂载聚合根控制路由
   * 基于DDD聚合根控制模式，确保数据一致性和业务规则完整性
   */
  router.use('/aggregate', createEditorAggregateRoutes());

  // ============ 传统CRUD路由（兼容性保留） ============

  /**
   * 获取编辑器状态
   * GET /editor/state
   */
  router.get('/state', async (req, res) => {
    await EditorController.getEditorState(req, res);
  });

  // ============ 编辑器组管理路由 ============

  /**
   * 获取所有编辑器组
   * GET /editor/groups
   */
  router.get('/groups', async (req, res) => {
    await EditorController.getEditorGroups(req, res);
  });

  /**
   * 获取活动编辑器组
   * GET /editor/groups/active
   */
  router.get('/groups/active', async (req, res) => {
    await EditorController.getActiveEditorGroup(req, res);
  });

  /**
   * 获取指定编辑器组
   * GET /editor/groups/:groupId
   */
  router.get('/groups/:groupId', async (req, res) => {
    await EditorController.getEditorGroup(req, res);
  });

  /**
   * 设置活动编辑器组
   * PUT /editor/groups/:groupId/activate
   */
  router.put('/groups/:groupId/activate', async (req, res) => {
    await EditorController.setActiveEditorGroup(req, res);
  });

  /**
   * 分割编辑器
   * POST /editor/groups/:groupId/split
   */
  router.post('/groups/:groupId/split', async (req, res) => {
    await EditorController.splitEditor(req, res);
  });

  /**
   * 调整编辑器大小
   * PUT /editor/groups/:groupId/resize
   */
  router.put('/groups/:groupId/resize', async (req, res) => {
    await EditorController.resizeEditor(req, res);
  });

  // ============ 文件操作路由 ============

  /**
   * 打开文件
   * POST /editor/files/open
   */
  router.post('/files/open', async (req, res) => {
    await EditorController.openFile(req, res);
  });

  /**
   * 获取文件内容
   * GET /editor/files/content
   */
  router.get('/files/content', async (req, res) => {
    await EditorController.getFileContent(req, res);
  });

  /**
   * 保存所有文件
   * PUT /editor/files/save-all
   */
  router.put('/files/save-all', async (req, res) => {
    await EditorController.saveAllFiles(req, res);
  });

  // ============ 标签页管理路由 ============

  /**
   * 关闭所有标签页
   * DELETE /editor/tabs
   */
  router.delete('/tabs', async (req, res) => {
    await EditorController.closeAllTabs(req, res);
  });

  /**
   * 关闭组内所有标签页
   * DELETE /editor/groups/:groupId/tabs
   */
  router.delete('/groups/:groupId/tabs', async (req, res) => {
    await EditorController.closeAllTabs(req, res);
  });

  /**
   * 关闭标签页
   * DELETE /editor/groups/:groupId/tabs/:tabId
   */
  router.delete('/groups/:groupId/tabs/:tabId', async (req, res) => {
    await EditorController.closeTab(req, res);
  });

  /**
   * 保存文件
   * PUT /editor/groups/:groupId/tabs/:tabId/save
   */
  router.put('/groups/:groupId/tabs/:tabId/save', async (req, res) => {
    await EditorController.saveFile(req, res);
  });

  /**
   * 保存组内所有文件
   * PUT /editor/groups/:groupId/files/save-all
   */
  router.put('/groups/:groupId/files/save-all', async (req, res) => {
    await EditorController.saveAllFiles(req, res);
  });

  return router;
}
