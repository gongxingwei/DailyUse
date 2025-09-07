/**
 * Editor Routes
 * 编辑器模块路由配置
 */

import { Router } from 'express';
import { EditorController } from './EditorController.js';

export function createEditorRoutes(editorController: EditorController): Router {
  const router = Router();

  // 编辑器状态相关路由
  router.get('/state', editorController.getEditorState.bind(editorController));

  // 编辑器组相关路由
  router.get('/groups', editorController.getEditorGroups.bind(editorController));
  router.get('/groups/active', editorController.getActiveEditorGroup.bind(editorController));
  router.get('/groups/:groupId', editorController.getEditorGroup.bind(editorController));
  router.put(
    '/groups/:groupId/activate',
    editorController.setActiveEditorGroup.bind(editorController),
  );
  router.post('/groups/:groupId/split', editorController.splitEditor.bind(editorController));
  router.put('/groups/:groupId/resize', editorController.resizeEditor.bind(editorController));

  // 标签页相关路由
  router.delete('/groups/:groupId/tabs/:tabId', editorController.closeTab.bind(editorController));
  router.delete('/groups/:groupId/tabs', editorController.closeAllTabs.bind(editorController));
  router.delete('/tabs', editorController.closeAllTabs.bind(editorController));

  // 文件操作相关路由
  router.post('/files/open', editorController.openFile.bind(editorController));
  router.get('/files/content', editorController.getFileContent.bind(editorController));
  router.put('/groups/:groupId/tabs/:tabId/save', editorController.saveFile.bind(editorController));
  router.put(
    '/groups/:groupId/files/save-all',
    editorController.saveAllFiles.bind(editorController),
  );
  router.put('/files/save-all', editorController.saveAllFiles.bind(editorController));

  return router;
}
