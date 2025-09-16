/**
 * Editor Aggregate Routes
 * 编辑器聚合根控制路由 - 基于DDD聚合根控制模式
 *
 * 根据DDD（领域驱动设计）的聚合根控制原则，所有对聚合内部实体的操作
 * 都必须通过聚合根进行。这确保了数据一致性和业务规则的完整性。
 *
 * 聚合根设计说明：
 * - EditorSession：编辑器会话聚合根，控制整个编辑器状态
 * - EditorGroup：编辑器组聚合，管理标签页集合（通过Session聚合根控制）
 * - EditorTab：标签页实体（通过Group聚合控制）
 * - EditorLayout：布局实体（独立聚合根）
 *
 * 路由设计原则：
 * 1. 聚合根控制：所有操作都通过聚合根路径进行
 * 2. 资源层次：URL结构反映聚合关系
 * 3. 操作语义：使用HTTP动词表达业务意图
 * 4. 批量操作：支持批量处理提高效率
 */

import { Router } from 'express';
import { EditorAggregateController } from './EditorAggregateController.js';

export function createEditorAggregateRoutes(): Router {
  const router = Router();

  // ============ 编辑器会话聚合根操作 ============

  /**
   * 创建新的编辑器会话
   * POST /sessions
   *
   * 聚合根控制：创建新的编辑器会话聚合，可同时创建默认布局
   * Body: CreateEditorSessionRequest
   */
  router.post('/sessions', async (req, res) => {
    await EditorAggregateController.createEditorSession(req, res);
  });

  /**
   * 获取用户的所有编辑器会话
   * GET /sessions
   *
   * 查询用户所有编辑器会话的概览信息
   */
  router.get('/sessions', async (req, res) => {
    await EditorAggregateController.getEditorSessions(req, res);
  });

  /**
   * 获取指定编辑器会话的完整状态
   * GET /sessions/:sessionId
   *
   * 聚合根查询：获取会话聚合的完整状态，包括所有子实体
   */
  router.get('/sessions/:sessionId', async (req, res) => {
    await EditorAggregateController.getEditorSession(req, res);
  });

  /**
   * 更新编辑器会话配置
   * PUT /sessions/:sessionId
   *
   * 聚合根控制：更新会话级别的配置（如自动保存设置）
   * Body: UpdateEditorSessionRequest
   */
  router.put('/sessions/:sessionId', async (req, res) => {
    await EditorAggregateController.updateEditorSession(req, res);
  });

  /**
   * 删除编辑器会话
   * DELETE /sessions/:sessionId
   *
   * 聚合根控制：删除整个会话聚合及其所有子实体
   */
  router.delete('/sessions/:sessionId', async (req, res) => {
    await EditorAggregateController.deleteEditorSession(req, res);
  });

  /**
   * 切换当前活动会话
   * PUT /sessions/:sessionId/activate
   *
   * 聚合根控制：设置当前活动的编辑器会话
   * Body: SwitchSessionRequest
   */
  router.put('/sessions/:sessionId/activate', async (req, res) => {
    await EditorAggregateController.switchEditorSession(req, res);
  });

  // ============ 编辑器组聚合操作（通过会话聚合根控制） ============

  /**
   * 在指定会话中创建编辑器组
   * POST /sessions/:sessionId/groups
   *
   * 聚合根控制：通过会话聚合根在其内部创建新的编辑器组
   * Body: CreateEditorGroupRequest
   */
  router.post('/sessions/:sessionId/groups', async (req, res) => {
    await EditorAggregateController.createEditorGroup(req, res);
  });

  /**
   * 获取指定会话的所有编辑器组
   * GET /sessions/:sessionId/groups
   *
   * 聚合查询：获取会话内所有编辑器组的信息
   */
  router.get('/sessions/:sessionId/groups', async (req, res) => {
    await EditorAggregateController.getEditorGroups(req, res);
  });

  /**
   * 更新指定编辑器组
   * PUT /sessions/:sessionId/groups/:groupId
   *
   * 聚合根控制：通过会话聚合根更新组的属性
   * Body: UpdateEditorGroupRequest
   */
  router.put('/sessions/:sessionId/groups/:groupId', async (req, res) => {
    await EditorAggregateController.updateEditorGroup(req, res);
  });

  /**
   * 删除指定编辑器组
   * DELETE /sessions/:sessionId/groups/:groupId
   *
   * 聚合根控制：通过会话聚合根删除组及其所有标签页
   */
  router.delete('/sessions/:sessionId/groups/:groupId', async (req, res) => {
    await EditorAggregateController.deleteEditorGroup(req, res);
  });

  /**
   * 激活指定编辑器组
   * PUT /sessions/:sessionId/groups/:groupId/activate
   *
   * 聚合根控制：设置会话中的活动编辑器组
   */
  router.put('/sessions/:sessionId/groups/:groupId/activate', async (req, res) => {
    await EditorAggregateController.activateEditorGroup(req, res);
  });

  // ============ 标签页操作（通过组聚合控制） ============

  /**
   * 在指定组中创建标签页
   * POST /sessions/:sessionId/groups/:groupId/tabs
   *
   * 聚合根控制：通过会话聚合根，在指定组中创建新标签页
   * Body: CreateEditorTabRequest
   */
  router.post('/sessions/:sessionId/groups/:groupId/tabs', async (req, res) => {
    await EditorAggregateController.createEditorTab(req, res);
  });

  /**
   * 批量创建标签页
   * POST /sessions/:sessionId/groups/:groupId/tabs/batch
   *
   * 聚合根控制：批量创建多个标签页，提高操作效率
   * Body: BatchCreateTabsRequest
   */
  router.post('/sessions/:sessionId/groups/:groupId/tabs/batch', async (req, res) => {
    await EditorAggregateController.batchCreateTabs(req, res);
  });

  /**
   * 获取指定组的所有标签页
   * GET /sessions/:sessionId/groups/:groupId/tabs
   *
   * 聚合查询：获取组内所有标签页信息
   */
  router.get('/sessions/:sessionId/groups/:groupId/tabs', async (req, res) => {
    await EditorAggregateController.getEditorTabs(req, res);
  });

  /**
   * 更新指定标签页
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId
   *
   * 聚合根控制：通过会话聚合根更新标签页属性
   * Body: UpdateEditorTabRequest
   */
  router.put('/sessions/:sessionId/groups/:groupId/tabs/:tabId', async (req, res) => {
    await EditorAggregateController.updateEditorTab(req, res);
  });

  /**
   * 删除指定标签页
   * DELETE /sessions/:sessionId/groups/:groupId/tabs/:tabId
   *
   * 聚合根控制：通过会话聚合根删除标签页
   */
  router.delete('/sessions/:sessionId/groups/:groupId/tabs/:tabId', async (req, res) => {
    await EditorAggregateController.deleteEditorTab(req, res);
  });

  /**
   * 激活指定标签页
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId/activate
   *
   * 聚合根控制：设置组中的活动标签页
   */
  router.put('/sessions/:sessionId/groups/:groupId/tabs/:tabId/activate', async (req, res) => {
    await EditorAggregateController.activateEditorTab(req, res);
  });

  // ============ 文件操作（跨聚合操作） ============

  /**
   * 批量保存文件
   * POST /sessions/:sessionId/files/save
   *
   * 聚合根控制：通过会话聚合根批量保存文件
   * Body: BatchSaveFilesRequest
   */
  router.post('/sessions/:sessionId/files/save', async (req, res) => {
    await EditorAggregateController.batchSaveFiles(req, res);
  });

  /**
   * 保存指定标签页的文件
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId/save
   *
   * 聚合根控制：保存特定标签页的文件内容
   */
  router.put('/sessions/:sessionId/groups/:groupId/tabs/:tabId/save', async (req, res) => {
    await EditorAggregateController.saveTabFile(req, res);
  });

  // ============ 布局聚合根操作 ============

  /**
   * 创建编辑器布局
   * POST /layouts
   *
   * 聚合根控制：创建新的布局聚合根
   * Body: CreateEditorLayoutRequest
   */
  router.post('/layouts', async (req, res) => {
    await EditorAggregateController.createEditorLayout(req, res);
  });

  /**
   * 获取用户的所有布局
   * GET /layouts
   *
   * 查询用户所有可用的编辑器布局
   */
  router.get('/layouts', async (req, res) => {
    await EditorAggregateController.getEditorLayouts(req, res);
  });

  /**
   * 更新编辑器布局
   * PUT /layouts/:layoutId
   *
   * 聚合根控制：更新布局配置
   * Body: UpdateEditorLayoutRequest
   */
  router.put('/layouts/:layoutId', async (req, res) => {
    await EditorAggregateController.updateEditorLayout(req, res);
  });

  /**
   * 删除编辑器布局
   * DELETE /layouts/:layoutId
   *
   * 聚合根控制：删除布局聚合根
   */
  router.delete('/layouts/:layoutId', async (req, res) => {
    await EditorAggregateController.deleteEditorLayout(req, res);
  });

  /**
   * 应用布局到会话
   * PUT /sessions/:sessionId/layout/:layoutId
   *
   * 聚合根控制：将指定布局应用到编辑器会话
   */
  router.put('/sessions/:sessionId/layout/:layoutId', async (req, res) => {
    await EditorAggregateController.applyLayoutToSession(req, res);
  });

  // ============ 聚合状态查询 ============

  /**
   * 获取当前编辑器完整状态
   * GET /state
   *
   * 聚合查询：获取用户当前的完整编辑器状态，包括活动会话及其所有子实体
   */
  router.get('/state', async (req, res) => {
    await EditorAggregateController.getEditorState(req, res);
  });

  return router;
}
