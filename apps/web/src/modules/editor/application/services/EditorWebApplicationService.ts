/**
 * Editor Web Application Service
 * 编辑器Web应用层服务 - 提供HTTP客户端功能
 */

import { EditorContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IEditorTab = EditorContracts.IEditorTab;
type IEditorGroup = EditorContracts.IEditorGroup;
type IOpenFileCommand = EditorContracts.IOpenFileCommand;
type ICloseTabCommand = EditorContracts.ICloseTabCommand;
type ISplitEditorCommand = EditorContracts.ISplitEditorCommand;
type IResizeEditorCommand = EditorContracts.IResizeEditorCommand;
type IEditorStateResponse = EditorContracts.IEditorStateResponse;
type IFileContentResponse = EditorContracts.IFileContentResponse;

export class EditorWebApplicationService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api/v1/editor') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取编辑器状态
   */
  async getEditorState(): Promise<IEditorStateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get editor state');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get editor state:', error);
      throw new EditorContracts.EditorError(
        `Failed to get editor state: ${(error as Error).message}`,
        'GET_EDITOR_STATE_FAILED',
      );
    }
  }

  /**
   * 获取所有编辑器组
   */
  async getEditorGroups(): Promise<IEditorGroup[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get editor groups');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get editor groups:', error);
      throw new EditorContracts.EditorError(
        `Failed to get editor groups: ${(error as Error).message}`,
        'GET_EDITOR_GROUPS_FAILED',
      );
    }
  }

  /**
   * 获取指定编辑器组
   */
  async getEditorGroup(groupId: string): Promise<IEditorGroup | null> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get editor group');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get editor group:', error);
      throw new EditorContracts.EditorError(
        `Failed to get editor group: ${(error as Error).message}`,
        'GET_EDITOR_GROUP_FAILED',
      );
    }
  }

  /**
   * 获取活动编辑器组
   */
  async getActiveEditorGroup(): Promise<IEditorGroup | null> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get active editor group');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get active editor group:', error);
      throw new EditorContracts.EditorError(
        `Failed to get active editor group: ${(error as Error).message}`,
        'GET_ACTIVE_EDITOR_GROUP_FAILED',
      );
    }
  }

  /**
   * 设置活动编辑器组
   */
  async setActiveEditorGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to set active editor group');
      }
    } catch (error) {
      console.error('Failed to set active editor group:', error);
      throw new EditorContracts.EditorError(
        `Failed to set active editor group: ${(error as Error).message}`,
        'SET_ACTIVE_EDITOR_GROUP_FAILED',
      );
    }
  }

  /**
   * 打开文件
   */
  async openFile(command: IOpenFileCommand): Promise<IEditorTab> {
    try {
      const response = await fetch(`${this.baseUrl}/files/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to open file');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to open file:', error);
      throw new EditorContracts.EditorError(
        `Failed to open file: ${(error as Error).message}`,
        'OPEN_FILE_FAILED',
      );
    }
  }

  /**
   * 关闭标签页
   */
  async closeTab(command: ICloseTabCommand): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${command.groupId}/tabs/${command.tabId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ saveChanges: command.saveChanges }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to close tab');
      }
    } catch (error) {
      console.error('Failed to close tab:', error);
      throw new EditorContracts.EditorError(
        `Failed to close tab: ${(error as Error).message}`,
        'CLOSE_TAB_FAILED',
      );
    }
  }

  /**
   * 关闭所有标签页
   */
  async closeAllTabs(groupId?: string): Promise<void> {
    try {
      const url = groupId ? `${this.baseUrl}/groups/${groupId}/tabs` : `${this.baseUrl}/tabs`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to close all tabs');
      }
    } catch (error) {
      console.error('Failed to close all tabs:', error);
      throw new EditorContracts.EditorError(
        `Failed to close all tabs: ${(error as Error).message}`,
        'CLOSE_ALL_TABS_FAILED',
      );
    }
  }

  /**
   * 保存文件
   */
  async saveFile(groupId: string, tabId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/tabs/${tabId}/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save file');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new EditorContracts.EditorError(
        `Failed to save file: ${(error as Error).message}`,
        'SAVE_FILE_FAILED',
      );
    }
  }

  /**
   * 保存所有文件
   */
  async saveAllFiles(groupId?: string): Promise<void> {
    try {
      const url = groupId
        ? `${this.baseUrl}/groups/${groupId}/files/save-all`
        : `${this.baseUrl}/files/save-all`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save all files');
      }
    } catch (error) {
      console.error('Failed to save all files:', error);
      throw new EditorContracts.EditorError(
        `Failed to save all files: ${(error as Error).message}`,
        'SAVE_ALL_FILES_FAILED',
      );
    }
  }

  /**
   * 分割编辑器
   */
  async splitEditor(command: ISplitEditorCommand): Promise<IEditorGroup> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${command.sourceGroupId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          direction: command.direction,
          copyCurrentTab: command.copyCurrentTab,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to split editor');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to split editor:', error);
      throw new EditorContracts.EditorError(
        `Failed to split editor: ${(error as Error).message}`,
        'SPLIT_EDITOR_FAILED',
      );
    }
  }

  /**
   * 调整编辑器大小
   */
  async resizeEditor(command: IResizeEditorCommand): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${command.groupId}/resize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          width: command.width,
          height: command.height,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to resize editor');
      }
    } catch (error) {
      console.error('Failed to resize editor:', error);
      throw new EditorContracts.EditorError(
        `Failed to resize editor: ${(error as Error).message}`,
        'RESIZE_EDITOR_FAILED',
      );
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(path: string): Promise<IFileContentResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/files/content?path=${encodeURIComponent(path)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get file content');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new EditorContracts.EditorError(
        `Failed to get file content: ${(error as Error).message}`,
        'GET_FILE_CONTENT_FAILED',
      );
    }
  }

  /**
   * 批量操作：打开多个文件
   */
  async openMultipleFiles(paths: string[], groupId?: string): Promise<IEditorTab[]> {
    try {
      const tabs: IEditorTab[] = [];

      for (const path of paths) {
        const tab = await this.openFile({
          path,
          groupId,
          isPreview: false,
          forceReopen: false,
        });
        tabs.push(tab);
      }

      return tabs;
    } catch (error) {
      console.error('Failed to open multiple files:', error);
      throw new EditorContracts.EditorError(
        `Failed to open multiple files: ${(error as Error).message}`,
        'OPEN_MULTIPLE_FILES_FAILED',
      );
    }
  }

  /**
   * 预览文件（在新的编辑器组中打开）
   */
  async previewFile(path: string): Promise<{ tab: IEditorTab; group: IEditorGroup }> {
    try {
      // 首先分割编辑器创建预览组
      const activeGroup = await this.getActiveEditorGroup();
      if (!activeGroup) {
        throw new Error('No active editor group found');
      }

      const previewGroup = await this.splitEditor({
        sourceGroupId: activeGroup.uuid,
        direction: 'horizontal',
        copyCurrentTab: false,
      });

      // 在预览组中打开文件
      const tab = await this.openFile({
        path,
        groupId: previewGroup.uuid,
        isPreview: true,
        forceReopen: false,
      });

      return { tab, group: previewGroup };
    } catch (error) {
      console.error('Failed to preview file:', error);
      throw new EditorContracts.EditorError(
        `Failed to preview file: ${(error as Error).message}`,
        'PREVIEW_FILE_FAILED',
      );
    }
  }
}
