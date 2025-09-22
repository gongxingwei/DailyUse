/**
 * Editor Aggregate Controller
 * 编辑器聚合根控制器 - 基于DDD聚合根控制模式
 *
 * 职责说明：
 * 1. 处理HTTP请求和响应
 * 2. 执行身份验证和授权
 * 3. 调用应用服务执行业务操作
 * 4. 处理错误和异常情况
 * 5. 确保聚合根控制原则的执行
 *
 * 设计原则：
 * - 聚合根控制：所有操作都通过Document/Workspace聚合根进行
 * - 应用层协调：通过EditorApplicationService协调业务流程
 * - 统一错误处理：标准化错误响应格式
 * - JWT身份验证：从Bearer token提取用户信息
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { EditorContracts } from '@dailyuse/contracts';
import { EditorApplicationService } from '../../../application/services/EditorApplicationService.js';

export class EditorAggregateController {
  private static editorApplicationService: EditorApplicationService;

  /**
   * 初始化控制器
   * 注入编辑器应用服务
   */
  static initialize(editorApplicationService: EditorApplicationService) {
    this.editorApplicationService = editorApplicationService;
  }

  /**
   * 从请求中提取用户账户UUID
   * JWT令牌验证和用户身份提取
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 标准化成功响应
   */
  private static sendSuccessResponse(res: Response, data: any, message: string, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * 标准化错误响应
   */
  private static sendErrorResponse(
    res: Response,
    error: Error,
    errorCode: string,
    statusCode = 500,
  ) {
    console.error(`API Error [${errorCode}]:`, error);
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: error.message,
      timestamp: Date.now(),
    });
  }

  // ============ 文档操作 ============

  /**
   * 创建新文档
   * POST /documents
   */
  static async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const request: EditorContracts.CreateDocumentDTO = req.body;

      if (!request.title?.trim()) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Document title is required'),
          'INVALID_DOCUMENT_TITLE',
          400,
        );
        return;
      }

      const document = await EditorAggregateController.editorApplicationService.createDocument(
        accountUuid,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        document,
        'Document created successfully',
        201,
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'CREATE_DOCUMENT_ERROR');
    }
  }

  /**
   * 获取文档
   * GET /documents/:documentId
   */
  static async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { documentId } = req.params;

      if (!documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Document ID is required'),
          'INVALID_DOCUMENT_ID',
          400,
        );
        return;
      }

      const document = await EditorAggregateController.editorApplicationService.getDocument(
        accountUuid,
        documentId,
      );

      if (!document) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Document not found'),
          'DOCUMENT_NOT_FOUND',
          404,
        );
        return;
      }

      EditorAggregateController.sendSuccessResponse(
        res,
        document,
        'Document retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_DOCUMENT_ERROR');
    }
  }

  /**
   * 更新文档
   * PUT /documents/:documentId
   */
  static async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { documentId } = req.params;
      const request: EditorContracts.UpdateDocumentDTO = req.body;

      if (!documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Document ID is required'),
          'INVALID_DOCUMENT_ID',
          400,
        );
        return;
      }

      const document = await EditorAggregateController.editorApplicationService.updateDocument(
        accountUuid,
        documentId,
        request,
      );

      EditorAggregateController.sendSuccessResponse(res, document, 'Document updated successfully');
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'UPDATE_DOCUMENT_ERROR');
    }
  }

  /**
   * 删除文档
   * DELETE /documents/:documentId
   */
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { documentId } = req.params;

      if (!documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Document ID is required'),
          'INVALID_DOCUMENT_ID',
          400,
        );
        return;
      }

      await EditorAggregateController.editorApplicationService.deleteDocument(
        accountUuid,
        documentId,
      );

      EditorAggregateController.sendSuccessResponse(res, null, 'Document deleted successfully');
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'DELETE_DOCUMENT_ERROR');
    }
  }

  /**
   * 搜索文档
   * GET /documents/search
   */
  static async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { q: query, repository } = req.query;

      if (!query || typeof query !== 'string') {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Search query is required'),
          'INVALID_SEARCH_QUERY',
          400,
        );
        return;
      }

      const documents = await EditorAggregateController.editorApplicationService.searchDocuments(
        accountUuid,
        query,
        repository as string,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        documents,
        'Documents searched successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'SEARCH_DOCUMENTS_ERROR');
    }
  }

  // ============ 工作区操作 ============

  /**
   * 创建新工作区
   * POST /workspaces
   */
  static async createWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const request: EditorContracts.CreateWorkspaceDTO = req.body;

      if (!request.name?.trim()) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace name is required'),
          'INVALID_WORKSPACE_NAME',
          400,
        );
        return;
      }

      const workspace = await EditorAggregateController.editorApplicationService.createWorkspace(
        accountUuid,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Workspace created successfully',
        201,
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'CREATE_WORKSPACE_ERROR');
    }
  }

  /**
   * 获取工作区
   * GET /workspaces/:workspaceId
   */
  static async getWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId } = req.params;

      if (!workspaceId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID is required'),
          'INVALID_WORKSPACE_ID',
          400,
        );
        return;
      }

      const workspace = await EditorAggregateController.editorApplicationService.getWorkspace(
        accountUuid,
        workspaceId,
      );

      if (!workspace) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace not found'),
          'WORKSPACE_NOT_FOUND',
          404,
        );
        return;
      }

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Workspace retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_WORKSPACE_ERROR');
    }
  }

  /**
   * 获取用户的所有工作区
   * GET /workspaces
   */
  static async getUserWorkspaces(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);

      const workspaces =
        await EditorAggregateController.editorApplicationService.getUserWorkspaces(accountUuid);

      EditorAggregateController.sendSuccessResponse(
        res,
        workspaces,
        'Workspaces retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_WORKSPACES_ERROR');
    }
  }

  /**
   * 在工作区中打开文档
   * POST /workspaces/:workspaceId/documents/:documentId/open
   */
  static async openDocumentInWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId, documentId } = req.params;

      if (!workspaceId || !documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID and Document ID are required'),
          'INVALID_PARAMETERS',
          400,
        );
        return;
      }

      const workspace =
        await EditorAggregateController.editorApplicationService.openDocumentInWorkspace(
          accountUuid,
          workspaceId,
          documentId,
        );

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Document opened in workspace successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'OPEN_DOCUMENT_ERROR');
    }
  }

  // ============ 占位符方法（待实现） ============

  /**
   * 更新工作区
   * PUT /workspaces/:workspaceId
   */
  static async updateWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId } = req.params;
      const request: EditorContracts.UpdateWorkspaceDTO = req.body;

      if (!workspaceId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID is required'),
          'INVALID_WORKSPACE_ID',
          400,
        );
        return;
      }

      const workspace = await EditorAggregateController.editorApplicationService.updateWorkspace(
        accountUuid,
        workspaceId,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Workspace updated successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'UPDATE_WORKSPACE_ERROR');
    }
  }

  /**
   * 删除工作区
   * DELETE /workspaces/:workspaceId
   */
  static async deleteWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId } = req.params;

      if (!workspaceId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID is required'),
          'INVALID_WORKSPACE_ID',
          400,
        );
        return;
      }

      await EditorAggregateController.editorApplicationService.deleteWorkspace(
        accountUuid,
        workspaceId,
      );

      EditorAggregateController.sendSuccessResponse(res, null, 'Workspace deleted successfully');
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'DELETE_WORKSPACE_ERROR');
    }
  }

  /**
   * 从工作区关闭文档
   * DELETE /workspaces/:workspaceId/documents/:documentId
   */
  static async closeDocumentInWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId, documentId } = req.params;

      if (!workspaceId || !documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID and Document ID are required'),
          'INVALID_PARAMETERS',
          400,
        );
        return;
      }

      const workspace =
        await EditorAggregateController.editorApplicationService.closeDocumentInWorkspace(
          accountUuid,
          workspaceId,
          documentId,
        );

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Document closed in workspace successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'CLOSE_DOCUMENT_ERROR');
    }
  }

  /**
   * 设置工作区当前活动文档
   * PUT /workspaces/:workspaceId/current-document/:documentId
   */
  static async setCurrentDocumentInWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { workspaceId, documentId } = req.params;

      if (!workspaceId || !documentId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Workspace ID and Document ID are required'),
          'INVALID_PARAMETERS',
          400,
        );
        return;
      }

      const workspace =
        await EditorAggregateController.editorApplicationService.setCurrentDocumentInWorkspace(
          accountUuid,
          workspaceId,
          documentId,
        );

      EditorAggregateController.sendSuccessResponse(
        res,
        workspace,
        'Current document set successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(
        res,
        error as Error,
        'SET_CURRENT_DOCUMENT_ERROR',
      );
    }
  }
}
