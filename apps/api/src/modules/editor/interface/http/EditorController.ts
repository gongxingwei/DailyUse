/**
 * Editor HTTP Controller
 * 编辑器HTTP控制器 - 处理API请求
 */

import type { Request, Response } from 'express';
import { EditorContracts } from '@dailyuse/contracts';
import { EditorApplicationService } from '../../application/services/EditorApplicationService.js';

// 使用类型别名来简化类型引用
type IOpenFileCommand = EditorContracts.IOpenFileCommand;
type ICloseTabCommand = EditorContracts.ICloseTabCommand;
type ISplitEditorCommand = EditorContracts.ISplitEditorCommand;
type IResizeEditorCommand = EditorContracts.IResizeEditorCommand;

export class EditorController {
  constructor(private readonly editorApplicationService: EditorApplicationService) {}

  /**
   * 获取编辑器状态
   * GET /api/v1/editor/state
   */
  async getEditorState(req: Request, res: Response): Promise<void> {
    try {
      const state = await this.editorApplicationService.getEditorState();

      res.status(200).json({
        success: true,
        data: state,
        message: 'Editor state retrieved successfully',
      });
    } catch (error) {
      console.error('Failed to get editor state:', error);
      res.status(500).json({
        success: false,
        error: 'EDITOR_STATE_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 获取所有编辑器组
   * GET /api/v1/editor/groups
   */
  async getEditorGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.editorApplicationService.getEditorGroups();

      res.status(200).json({
        success: true,
        data: groups,
        message: 'Editor groups retrieved successfully',
      });
    } catch (error) {
      console.error('Failed to get editor groups:', error);
      res.status(500).json({
        success: false,
        error: 'GET_GROUPS_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 获取指定编辑器组
   * GET /api/v1/editor/groups/:groupId
   */
  async getEditorGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_GROUP_ID',
          message: 'Group ID is required',
        });
        return;
      }

      const group = await this.editorApplicationService.getEditorGroup(groupId);

      if (!group) {
        res.status(404).json({
          success: false,
          error: 'GROUP_NOT_FOUND',
          message: 'Editor group not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: group,
        message: 'Editor group retrieved successfully',
      });
    } catch (error) {
      console.error('Failed to get editor group:', error);
      res.status(500).json({
        success: false,
        error: 'GET_GROUP_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 获取活动编辑器组
   * GET /api/v1/editor/groups/active
   */
  async getActiveEditorGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await this.editorApplicationService.getActiveEditorGroup();

      res.status(200).json({
        success: true,
        data: group,
        message: 'Active editor group retrieved successfully',
      });
    } catch (error) {
      console.error('Failed to get active editor group:', error);
      res.status(500).json({
        success: false,
        error: 'GET_ACTIVE_GROUP_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 设置活动编辑器组
   * PUT /api/v1/editor/groups/:groupId/activate
   */
  async setActiveEditorGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_GROUP_ID',
          message: 'Group ID is required',
        });
        return;
      }

      await this.editorApplicationService.setActiveEditorGroup(groupId);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Active editor group set successfully',
      });
    } catch (error) {
      console.error('Failed to set active editor group:', error);
      res.status(500).json({
        success: false,
        error: 'SET_ACTIVE_GROUP_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 打开文件
   * POST /api/v1/editor/files/open
   */
  async openFile(req: Request, res: Response): Promise<void> {
    try {
      const command: IOpenFileCommand = req.body;

      if (!command.path) {
        res.status(400).json({
          success: false,
          error: 'INVALID_FILE_PATH',
          message: 'File path is required',
        });
        return;
      }

      const tab = await this.editorApplicationService.openFile(command);

      res.status(201).json({
        success: true,
        data: tab,
        message: 'File opened successfully',
      });
    } catch (error) {
      console.error('Failed to open file:', error);
      res.status(500).json({
        success: false,
        error: 'OPEN_FILE_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 关闭标签页
   * DELETE /api/v1/editor/groups/:groupId/tabs/:tabId
   */
  async closeTab(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, tabId } = req.params;
      const { saveChanges } = req.body;

      if (!groupId || !tabId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_PARAMETERS',
          message: 'Group ID and Tab ID are required',
        });
        return;
      }

      const command: ICloseTabCommand = {
        groupId,
        tabId,
        saveChanges: saveChanges || false,
      };

      await this.editorApplicationService.closeTab(command);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Tab closed successfully',
      });
    } catch (error) {
      console.error('Failed to close tab:', error);
      res.status(500).json({
        success: false,
        error: 'CLOSE_TAB_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 关闭所有标签页
   * DELETE /api/v1/editor/tabs
   * DELETE /api/v1/editor/groups/:groupId/tabs
   */
  async closeAllTabs(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      await this.editorApplicationService.closeAllTabs(groupId);

      res.status(200).json({
        success: true,
        data: null,
        message: groupId ? 'All tabs in group closed successfully' : 'All tabs closed successfully',
      });
    } catch (error) {
      console.error('Failed to close all tabs:', error);
      res.status(500).json({
        success: false,
        error: 'CLOSE_ALL_TABS_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 保存文件
   * PUT /api/v1/editor/groups/:groupId/tabs/:tabId/save
   */
  async saveFile(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, tabId } = req.params;

      if (!groupId || !tabId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_PARAMETERS',
          message: 'Group ID and Tab ID are required',
        });
        return;
      }

      await this.editorApplicationService.saveFile(groupId, tabId);

      res.status(200).json({
        success: true,
        data: null,
        message: 'File saved successfully',
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      res.status(500).json({
        success: false,
        error: 'SAVE_FILE_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 保存所有文件
   * PUT /api/v1/editor/files/save-all
   * PUT /api/v1/editor/groups/:groupId/files/save-all
   */
  async saveAllFiles(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      await this.editorApplicationService.saveAllFiles(groupId);

      res.status(200).json({
        success: true,
        data: null,
        message: groupId ? 'All files in group saved successfully' : 'All files saved successfully',
      });
    } catch (error) {
      console.error('Failed to save all files:', error);
      res.status(500).json({
        success: false,
        error: 'SAVE_ALL_FILES_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 分割编辑器
   * POST /api/v1/editor/groups/:groupId/split
   */
  async splitEditor(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { direction, copyCurrentTab } = req.body;

      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_GROUP_ID',
          message: 'Group ID is required',
        });
        return;
      }

      if (!direction || !['horizontal', 'vertical'].includes(direction)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_DIRECTION',
          message: 'Direction must be either "horizontal" or "vertical"',
        });
        return;
      }

      const command: ISplitEditorCommand = {
        sourceGroupId: groupId,
        direction,
        copyCurrentTab: copyCurrentTab || false,
      };

      const newGroup = await this.editorApplicationService.splitEditor(command);

      res.status(201).json({
        success: true,
        data: newGroup,
        message: 'Editor split successfully',
      });
    } catch (error) {
      console.error('Failed to split editor:', error);
      res.status(500).json({
        success: false,
        error: 'SPLIT_EDITOR_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 调整编辑器大小
   * PUT /api/v1/editor/groups/:groupId/resize
   */
  async resizeEditor(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { width, height } = req.body;

      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_GROUP_ID',
          message: 'Group ID is required',
        });
        return;
      }

      if (!width || width < 200) {
        res.status(400).json({
          success: false,
          error: 'INVALID_WIDTH',
          message: 'Width must be at least 200px',
        });
        return;
      }

      const command: IResizeEditorCommand = {
        groupId,
        width,
        height,
      };

      await this.editorApplicationService.resizeEditor(command);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Editor resized successfully',
      });
    } catch (error) {
      console.error('Failed to resize editor:', error);
      res.status(500).json({
        success: false,
        error: 'RESIZE_EDITOR_ERROR',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 获取文件内容
   * GET /api/v1/editor/files/content
   */
  async getFileContent(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.query;

      if (!path || typeof path !== 'string') {
        res.status(400).json({
          success: false,
          error: 'INVALID_FILE_PATH',
          message: 'File path is required',
        });
        return;
      }

      const content = await this.editorApplicationService.getFileContent(path);

      res.status(200).json({
        success: true,
        data: content,
        message: 'File content retrieved successfully',
      });
    } catch (error) {
      console.error('Failed to get file content:', error);
      res.status(500).json({
        success: false,
        error: 'GET_FILE_CONTENT_ERROR',
        message: (error as Error).message,
      });
    }
  }
}
