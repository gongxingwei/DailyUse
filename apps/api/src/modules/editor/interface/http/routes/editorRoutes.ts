import { Router, type Router as ExpressRouter } from 'express';
import { EditorWorkspaceController } from '../controllers/EditorWorkspaceController';
import { validate, validateAll } from '../middleware/validationMiddleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceUuidParamSchema,
  accountUuidParamSchema,
  addSessionSchema,
  workspaceUuidPathSchema,
} from '../validation/editorWorkspaceSchemas';

const router: ExpressRouter = Router();

// ===== Workspace Routes =====

// 创建工作区
router.post(
  '/workspaces',
  validate(createWorkspaceSchema, 'body'),
  EditorWorkspaceController.createWorkspace,
);

// 获取工作区详情
router.get(
  '/workspaces/:uuid',
  validate(workspaceUuidParamSchema, 'params'),
  EditorWorkspaceController.getWorkspace,
);

// 获取账户的所有工作区
router.get(
  '/accounts/:accountUuid/workspaces',
  validate(accountUuidParamSchema, 'params'),
  EditorWorkspaceController.listWorkspaces,
);

// 更新工作区
router.put(
  '/workspaces/:uuid',
  validateAll({
    params: workspaceUuidParamSchema,
    body: updateWorkspaceSchema,
  }),
  EditorWorkspaceController.updateWorkspace,
);

// 删除工作区
router.delete(
  '/workspaces/:uuid',
  validate(workspaceUuidParamSchema, 'params'),
  EditorWorkspaceController.deleteWorkspace,
);

// ===== Session Routes =====

// 添加会话到工作区
router.post(
  '/workspaces/:workspaceUuid/sessions',
  validateAll({
    params: workspaceUuidPathSchema,
    body: addSessionSchema,
  }),
  EditorWorkspaceController.addSession,
);

// 获取工作区的所有会话
router.get(
  '/workspaces/:workspaceUuid/sessions',
  validate(workspaceUuidPathSchema, 'params'),
  EditorWorkspaceController.getSessions,
);

export default router;
