import type { Request, Response } from 'express';
import { EditorWorkspaceApplicationService } from '../../../application/services/EditorWorkspaceApplicationService';

/**
 * EditorWorkspace Controller
 * 处理工作区相关的 HTTP 请求
 */
export class EditorWorkspaceController {
  /**
   * 创建工作区
   * POST /api/v1/editor/workspaces
   */
  static async createWorkspace(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const workspace = await service.createWorkspace(req.body);
      return res.status(201).json({ success: true, data: workspace });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取工作区详情
   * GET /api/v1/editor/workspaces/:uuid
   */
  static async getWorkspace(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const workspace = await service.getWorkspace(req.params.uuid);

      if (!workspace) {
        return res.status(404).json({ success: false, message: 'Workspace not found' });
      }

      return res.json({ success: true, data: workspace });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取账户的所有工作区
   * GET /api/v1/editor/accounts/:accountUuid/workspaces
   */
  static async listWorkspaces(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const workspaces = await service.getWorkspacesByAccount(req.params.accountUuid);
      return res.json({ success: true, data: workspaces });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 更新工作区
   * PUT /api/v1/editor/workspaces/:uuid
   */
  static async updateWorkspace(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const workspace = await service.updateWorkspace({
        uuid: req.params.uuid,
        ...req.body,
      });
      return res.json({ success: true, data: workspace });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 删除工作区
   * DELETE /api/v1/editor/workspaces/:uuid
   */
  static async deleteWorkspace(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const result = await service.deleteWorkspace(req.params.uuid);
      return res.json({ success: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 添加会话到工作区
   * POST /api/v1/editor/workspaces/:workspaceUuid/sessions
   */
  static async addSession(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const session = await service.addSession({
        workspaceUuid: req.params.workspaceUuid,
        ...req.body,
      });
      return res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取工作区的所有会话
   * GET /api/v1/editor/workspaces/:workspaceUuid/sessions
   */
  static async getSessions(req: Request, res: Response) {
    try {
      const service = await EditorWorkspaceApplicationService.getInstance();
      const sessions = await service.getSessions(req.params.workspaceUuid);
      return res.json({ success: true, data: sessions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
