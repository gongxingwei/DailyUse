/**
 * Editor Aggregate Routes
 * 编辑器聚合根控制路由 - 基于DDD聚合根控制模式
 *
 * 根据DDD（领域驱动设计）的聚合根控制原则，所有对聚合内部实体的操作
 * 都必须通过聚合根进行。这确保了数据一致性和业务规则的完整性。
 *
 * 聚合根设计说明：
 * - Document：文档聚合根，控制文档内容和元数据
 * - EditorWorkspace：工作区聚合根，管理打开的文档和布局状态
 *
 * 路由设计原则：
 * 1. 聚合根控制：所有操作都通过聚合根路径进行
 * 2. 资源层次：URL结构反映聚合关系
 * 3. 操作语义：使用HTTP动词表达业务意图
 * 4. 批量操作：支持批量处理提高效率
 */

import { Router } from 'express';
import { EditorAggregateController } from '../controllers/EditorAggregateController.js';

export function createEditorAggregateRoutes(): Router {
  const router = Router();

  // ============ 文档聚合根操作 ============

  /**
   * 创建新文档
   * POST /documents
   *
   * 聚合根控制：创建新的文档聚合根
   * Body: CreateDocumentDTO
   */
  router.post('/documents', async (req, res) => {
    await EditorAggregateController.createDocument(req, res);
  });

  /**
   * 获取文档
   * GET /documents/:documentId
   *
   * 聚合根查询：获取文档聚合的完整状态
   */
  router.get('/documents/:documentId', async (req, res) => {
    await EditorAggregateController.getDocument(req, res);
  });

  /**
   * 更新文档
   * PUT /documents/:documentId
   *
   * 聚合根控制：更新文档内容和元数据
   * Body: UpdateDocumentDTO
   */
  router.put('/documents/:documentId', async (req, res) => {
    await EditorAggregateController.updateDocument(req, res);
  });

  /**
   * 删除文档
   * DELETE /documents/:documentId
   *
   * 聚合根控制：删除文档聚合根
   */
  router.delete('/documents/:documentId', async (req, res) => {
    await EditorAggregateController.deleteDocument(req, res);
  });

  /**
   * 搜索文档
   * GET /documents/search
   *
   * 聚合查询：搜索文档内容
   * Query: q (search query), repository (repository filter)
   */
  router.get('/documents/search', async (req, res) => {
    await EditorAggregateController.searchDocuments(req, res);
  });

  // ============ 工作区聚合根操作 ============

  /**
   * 创建新工作区
   * POST /workspaces
   *
   * 聚合根控制：创建新的工作区聚合根
   * Body: CreateWorkspaceDTO
   */
  router.post('/workspaces', async (req, res) => {
    await EditorAggregateController.createWorkspace(req, res);
  });

  /**
   * 获取工作区
   * GET /workspaces/:workspaceId
   *
   * 聚合根查询：获取工作区聚合的完整状态
   */
  router.get('/workspaces/:workspaceId', async (req, res) => {
    await EditorAggregateController.getWorkspace(req, res);
  });

  /**
   * 获取用户的所有工作区
   * GET /workspaces
   *
   * 查询用户所有工作区的概览信息
   */
  router.get('/workspaces', async (req, res) => {
    await EditorAggregateController.getUserWorkspaces(req, res);
  });

  /**
   * 更新工作区
   * PUT /workspaces/:workspaceId
   *
   * 聚合根控制：更新工作区配置和布局
   * Body: UpdateWorkspaceDTO
   */
  router.put('/workspaces/:workspaceId', async (req, res) => {
    await EditorAggregateController.updateWorkspace(req, res);
  });

  /**
   * 删除工作区
   * DELETE /workspaces/:workspaceId
   *
   * 聚合根控制：删除工作区聚合根
   */
  router.delete('/workspaces/:workspaceId', async (req, res) => {
    await EditorAggregateController.deleteWorkspace(req, res);
  });

  // ============ 工作区文档操作（聚合间协作） ============

  /**
   * 在工作区中打开文档
   * POST /workspaces/:workspaceId/documents/:documentId/open
   *
   * 聚合根控制：在工作区中打开指定文档
   */
  router.post('/workspaces/:workspaceId/documents/:documentId/open', async (req, res) => {
    await EditorAggregateController.openDocumentInWorkspace(req, res);
  });

  /**
   * 从工作区关闭文档
   * DELETE /workspaces/:workspaceId/documents/:documentId
   *
   * 聚合根控制：从工作区中关闭指定文档
   */
  router.delete('/workspaces/:workspaceId/documents/:documentId', async (req, res) => {
    await EditorAggregateController.closeDocumentInWorkspace(req, res);
  });

  /**
   * 设置工作区当前活动文档
   * PUT /workspaces/:workspaceId/current-document/:documentId
   *
   * 聚合根控制：设置工作区中的当前活动文档
   */
  router.put('/workspaces/:workspaceId/current-document/:documentId', async (req, res) => {
    await EditorAggregateController.setCurrentDocumentInWorkspace(req, res);
  });

  return router;
}
