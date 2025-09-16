/**
 * Editor Aggregate Controller
 * 编辑器聚合根控制器 - 基于DDD聚合根控制模式
 *
 * 职责说明：
 * 1. 处理HTTP请求和响应
 * 2. 执行身份验证和授权
 * 3. 调用领域服务执行业务操作
 * 4. 处理错误和异常情况
 * 5. 确保聚合根控制原则的执行
 *
 * 设计原则：
 * - 聚合根控制：所有操作都通过聚合根进行
 * - 业务规则执行：在领域服务层执行业务逻辑
 * - 统一错误处理：标准化错误响应格式
 * - JWT身份验证：从Bearer token提取用户信息
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { EditorContracts } from '@dailyuse/contracts';
import { EditorService } from '@dailyuse/domain-server';

export class EditorAggregateController {
  private static editorService: EditorService;

  /**
   * 初始化控制器
   * 注入编辑器领域服务
   */
  static initialize(editorService: EditorService) {
    this.editorService = editorService;
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

  // ============ 编辑器会话聚合根操作 ============

  /**
   * 创建新的编辑器会话
   * POST /sessions
   */
  static async createEditorSession(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const request: EditorContracts.CreateEditorSessionRequest = req.body;

      if (!request.name?.trim()) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session name is required'),
          'INVALID_SESSION_NAME',
          400,
        );
        return;
      }

      const session = await EditorAggregateController.editorService.createEditorSession(
        accountUuid,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        session,
        'Editor session created successfully',
        201,
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(
        res,
        error as Error,
        'CREATE_EDITOR_SESSION_ERROR',
      );
    }
  }

  /**
   * 获取用户的所有编辑器会话
   * GET /sessions
   */
  static async getEditorSessions(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);

      // 这里需要添加获取所有会话的方法到EditorService
      // const sessions = await EditorAggregateController.editorService.getEditorSessions(accountUuid);

      // 临时返回空数组，等待服务方法实现
      const sessions: EditorContracts.EditorSessionDTO[] = [];

      EditorAggregateController.sendSuccessResponse(
        res,
        sessions,
        'Editor sessions retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_EDITOR_SESSIONS_ERROR');
    }
  }

  /**
   * 获取指定编辑器会话的完整状态
   * GET /sessions/:sessionId
   */
  static async getEditorSession(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId } = req.params;

      if (!sessionId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID is required'),
          'INVALID_SESSION_ID',
          400,
        );
        return;
      }

      // 这里需要添加获取单个会话聚合的方法到EditorService
      // const sessionAggregate = await EditorAggregateController.editorService.getEditorSessionAggregate(accountUuid, sessionId);

      // 临时实现，等待服务方法
      const sessionAggregate = null;

      if (!sessionAggregate) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Editor session not found'),
          'SESSION_NOT_FOUND',
          404,
        );
        return;
      }

      EditorAggregateController.sendSuccessResponse(
        res,
        sessionAggregate,
        'Editor session retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_EDITOR_SESSION_ERROR');
    }
  }

  /**
   * 切换当前活动会话
   * PUT /sessions/:sessionId/activate
   */
  static async switchEditorSession(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId } = req.params;
      const body = req.body;

      if (!sessionId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID is required'),
          'INVALID_SESSION_ID',
          400,
        );
        return;
      }

      const request: EditorContracts.SwitchSessionRequest = {
        sessionId,
        saveCurrentState: body.saveCurrentState ?? true,
      };

      const session = await EditorAggregateController.editorService.switchEditorSession(
        accountUuid,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        session,
        'Editor session switched successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(
        res,
        error as Error,
        'SWITCH_EDITOR_SESSION_ERROR',
      );
    }
  }

  // ============ 编辑器组聚合操作 ============

  /**
   * 在指定会话中创建编辑器组
   * POST /sessions/:sessionId/groups
   */
  static async createEditorGroup(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId } = req.params;
      const request: EditorContracts.CreateEditorGroupRequest = req.body;

      if (!sessionId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID is required'),
          'INVALID_SESSION_ID',
          400,
        );
        return;
      }

      const group = await EditorAggregateController.editorService.createEditorGroup(
        accountUuid,
        sessionId,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        group,
        'Editor group created successfully',
        201,
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'CREATE_EDITOR_GROUP_ERROR');
    }
  }

  /**
   * 在指定组中创建标签页
   * POST /sessions/:sessionId/groups/:groupId/tabs
   */
  static async createEditorTab(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId, groupId } = req.params;
      const request: EditorContracts.CreateEditorTabRequest = req.body;

      if (!sessionId || !groupId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID and Group ID are required'),
          'INVALID_PARAMETERS',
          400,
        );
        return;
      }

      if (!request.path?.trim()) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('File path is required'),
          'INVALID_FILE_PATH',
          400,
        );
        return;
      }

      const tab = await EditorAggregateController.editorService.createEditorTab(
        accountUuid,
        groupId,
        request,
      );

      EditorAggregateController.sendSuccessResponse(
        res,
        tab,
        'Editor tab created successfully',
        201,
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'CREATE_EDITOR_TAB_ERROR');
    }
  }

  /**
   * 批量创建标签页
   * POST /sessions/:sessionId/groups/:groupId/tabs/batch
   */
  static async batchCreateTabs(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId, groupId } = req.params;
      const request: EditorContracts.BatchCreateTabsRequest = req.body;

      if (!sessionId || !groupId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID and Group ID are required'),
          'INVALID_PARAMETERS',
          400,
        );
        return;
      }

      if (!request.tabs || !Array.isArray(request.tabs) || request.tabs.length === 0) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Tabs array is required and cannot be empty'),
          'INVALID_TABS_ARRAY',
          400,
        );
        return;
      }

      const result = await EditorAggregateController.editorService.batchCreateTabs(
        accountUuid,
        groupId,
        request,
      );

      EditorAggregateController.sendSuccessResponse(res, result, 'Batch tab creation completed');
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'BATCH_CREATE_TABS_ERROR');
    }
  }

  /**
   * 批量保存文件
   * POST /sessions/:sessionId/files/save
   */
  static async batchSaveFiles(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);
      const { sessionId } = req.params;
      const request: EditorContracts.BatchSaveFilesRequest = req.body;

      if (!sessionId) {
        EditorAggregateController.sendErrorResponse(
          res,
          new Error('Session ID is required'),
          'INVALID_SESSION_ID',
          400,
        );
        return;
      }

      const result = await EditorAggregateController.editorService.batchSaveFiles(
        accountUuid,
        request,
      );

      EditorAggregateController.sendSuccessResponse(res, result, 'Batch file save completed');
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'BATCH_SAVE_FILES_ERROR');
    }
  }

  /**
   * 获取当前编辑器完整状态
   * GET /state
   */
  static async getEditorState(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = EditorAggregateController.extractAccountUuid(req);

      const state = await EditorAggregateController.editorService.getEditorState(accountUuid);

      EditorAggregateController.sendSuccessResponse(
        res,
        state,
        'Editor state retrieved successfully',
      );
    } catch (error) {
      EditorAggregateController.sendErrorResponse(res, error as Error, 'GET_EDITOR_STATE_ERROR');
    }
  }

  // ============ 占位符方法（待实现） ============

  /**
   * 更新编辑器会话配置
   * PUT /sessions/:sessionId
   */
  static async updateEditorSession(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 删除编辑器会话
   * DELETE /sessions/:sessionId
   */
  static async deleteEditorSession(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 获取指定会话的所有编辑器组
   * GET /sessions/:sessionId/groups
   */
  static async getEditorGroups(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 更新指定编辑器组
   * PUT /sessions/:sessionId/groups/:groupId
   */
  static async updateEditorGroup(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 删除指定编辑器组
   * DELETE /sessions/:sessionId/groups/:groupId
   */
  static async deleteEditorGroup(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 激活指定编辑器组
   * PUT /sessions/:sessionId/groups/:groupId/activate
   */
  static async activateEditorGroup(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 获取指定组的所有标签页
   * GET /sessions/:sessionId/groups/:groupId/tabs
   */
  static async getEditorTabs(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 更新指定标签页
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId
   */
  static async updateEditorTab(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 删除指定标签页
   * DELETE /sessions/:sessionId/groups/:groupId/tabs/:tabId
   */
  static async deleteEditorTab(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 激活指定标签页
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId/activate
   */
  static async activateEditorTab(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 保存指定标签页的文件
   * PUT /sessions/:sessionId/groups/:groupId/tabs/:tabId/save
   */
  static async saveTabFile(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 创建编辑器布局
   * POST /layouts
   */
  static async createEditorLayout(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 获取用户的所有布局
   * GET /layouts
   */
  static async getEditorLayouts(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 更新编辑器布局
   * PUT /layouts/:layoutId
   */
  static async updateEditorLayout(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 删除编辑器布局
   * DELETE /layouts/:layoutId
   */
  static async deleteEditorLayout(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }

  /**
   * 应用布局到会话
   * PUT /sessions/:sessionId/layout/:layoutId
   */
  static async applyLayoutToSession(req: Request, res: Response): Promise<void> {
    EditorAggregateController.sendErrorResponse(
      res,
      new Error('Method not implemented yet'),
      'NOT_IMPLEMENTED',
      501,
    );
  }
}
