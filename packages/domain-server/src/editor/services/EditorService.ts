/**
 * Editor聚合服务
 * 实现编辑器模块的领域服务逻辑，提供高层业务操作
 * 遵循聚合根控制模式，管理编辑器会话及其子实体
 */
import { EditorContracts } from '@dailyuse/contracts';
import type { IEditorRepository } from '../repositories/iEditorRepository';

export class EditorService {
  constructor(private readonly editorRepository: IEditorRepository) {}

  /**
   * 创建新的编辑器会话
   * 聚合根控制：统一管理会话创建流程
   */
  async createEditorSession(
    accountUuid: string,
    request: EditorContracts.CreateEditorSessionRequest,
  ): Promise<EditorContracts.EditorSessionDTO> {
    // 创建会话DTO
    const sessionData: Omit<EditorContracts.EditorSessionDTO, 'uuid' | 'createdAt' | 'updatedAt'> =
      {
        accountUuid,
        name: request.name,
        activeGroupId: null,
        layoutUuid: null,
        autoSave: request.autoSave ?? true,
        autoSaveInterval: request.autoSaveInterval ?? 30,
        lastSavedAt: undefined,
      };

    // 通过仓储创建会话
    const createdSession = await this.editorRepository.createEditorSession(
      accountUuid,
      sessionData,
    );

    // 如果提供了布局配置，创建默认布局
    if (request.layout) {
      const layoutData: Omit<EditorContracts.EditorLayoutDTO, 'uuid' | 'createdAt' | 'updatedAt'> =
        {
          accountUuid,
          name: `${request.name} - 布局`,
          activityBarWidth: request.layout.activityBarWidth ?? 48,
          sidebarWidth: request.layout.sidebarWidth ?? 300,
          minSidebarWidth: request.layout.minSidebarWidth ?? 200,
          resizeHandleWidth: request.layout.resizeHandleWidth ?? 4,
          minEditorWidth: request.layout.minEditorWidth ?? 300,
          editorTabWidth: request.layout.editorTabWidth ?? 120,
          windowWidth: request.layout.windowWidth ?? 1200,
          windowHeight: request.layout.windowHeight ?? 800,
          isDefault: false,
        };

      const layout = await this.editorRepository.createEditorLayout(accountUuid, layoutData);

      // 更新会话关联布局
      await this.editorRepository.updateEditorSession(accountUuid, createdSession.uuid, {
        layoutUuid: layout.uuid,
      });

      return {
        ...createdSession,
        layoutUuid: layout.uuid,
      };
    }

    return createdSession;
  }

  /**
   * 在会话中创建编辑器组
   * 聚合根控制：通过会话聚合根管理组的创建
   */
  async createEditorGroup(
    accountUuid: string,
    sessionUuid: string,
    request: EditorContracts.CreateEditorGroupRequest,
  ): Promise<EditorContracts.EditorGroupDTO> {
    // 验证会话存在
    const session = await this.editorRepository.getEditorSessionByUuid(accountUuid, sessionUuid);
    if (!session) {
      throw new Error(`编辑器会话不存在: ${sessionUuid}`);
    }

    // 获取现有组，用于确定排序
    const existingGroups = await this.editorRepository.getEditorGroupsBySessionUuid(
      accountUuid,
      sessionUuid,
    );

    const groupData: Omit<EditorContracts.EditorGroupDTO, 'uuid' | 'createdAt' | 'updatedAt'> = {
      accountUuid,
      sessionUuid,
      active: existingGroups.length === 0, // 第一个组默认激活
      width: request.width,
      height: request.height,
      activeTabId: null,
      title: request.title,
      order: request.order ?? existingGroups.length,
      lastAccessed: undefined,
    };

    const createdGroup = await this.editorRepository.createEditorGroup(accountUuid, groupData);

    // 如果这是第一个组，更新会话的活动组ID
    if (existingGroups.length === 0) {
      await this.editorRepository.updateEditorSession(accountUuid, sessionUuid, {
        activeGroupId: createdGroup.uuid,
      });
    }

    return createdGroup;
  }

  /**
   * 在编辑器组中创建标签页
   * 聚合根控制：通过组聚合管理标签页的创建
   */
  async createEditorTab(
    accountUuid: string,
    groupUuid: string,
    request: EditorContracts.CreateEditorTabRequest,
  ): Promise<EditorContracts.EditorTabDTO> {
    // 验证组存在
    const group = await this.editorRepository.getEditorGroupByUuid(accountUuid, groupUuid);
    if (!group) {
      throw new Error(`编辑器组不存在: ${groupUuid}`);
    }

    // 检查是否已存在相同路径的标签页
    const existingTab = await this.editorRepository.getEditorTabByPath(accountUuid, request.path);
    if (existingTab) {
      // 如果标签页在同一组中，激活它
      if (existingTab.groupUuid === groupUuid) {
        await this.editorRepository.updateEditorTab(accountUuid, existingTab.uuid, {
          active: true,
        });
        await this.editorRepository.updateEditorGroup(accountUuid, groupUuid, {
          activeTabId: existingTab.uuid,
        });
        return existingTab;
      } else {
        throw new Error(`文件 ${request.path} 已在其他组中打开`);
      }
    }

    // 获取现有标签页，用于确定是否为第一个
    const existingTabs = await this.editorRepository.getEditorTabsByGroupUuid(
      accountUuid,
      groupUuid,
    );

    const tabData: Omit<EditorContracts.EditorTabDTO, 'uuid' | 'createdAt' | 'updatedAt'> = {
      accountUuid,
      groupUuid,
      title: request.title,
      path: request.path,
      active: existingTabs.length === 0, // 第一个标签页默认激活
      isPreview: request.isPreview ?? false,
      fileType:
        request.fileType ??
        (this.detectFileType(request.path) as EditorContracts.SupportedFileType),
      isDirty: false,
      content: request.content ?? '',
      lastModified: undefined,
    };

    const createdTab = await this.editorRepository.createEditorTab(accountUuid, tabData);

    // 如果这是第一个标签页，更新组的活动标签页ID
    if (existingTabs.length === 0) {
      await this.editorRepository.updateEditorGroup(accountUuid, groupUuid, {
        activeTabId: createdTab.uuid,
      });
    }

    return createdTab;
  }

  /**
   * 切换会话
   * 聚合根控制：管理会话状态切换
   */
  async switchEditorSession(
    accountUuid: string,
    request: EditorContracts.SwitchSessionRequest,
  ): Promise<EditorContracts.EditorSessionDTO> {
    // 验证目标会话存在
    const targetSession = await this.editorRepository.getEditorSessionByUuid(
      accountUuid,
      request.sessionId,
    );
    if (!targetSession) {
      throw new Error(`编辑器会话不存在: ${request.sessionId}`);
    }

    // 如果需要保存当前会话状态
    if (request.saveCurrentState) {
      const currentSession = await this.editorRepository.getCurrentActiveSession(accountUuid);
      if (currentSession) {
        await this.saveSessionState(accountUuid, currentSession.uuid);
      }
    }

    // 设置新的活动会话
    await this.editorRepository.setCurrentActiveSession(accountUuid, request.sessionId);

    return targetSession;
  }

  /**
   * 批量创建标签页
   * 聚合根控制：统一处理批量操作
   */
  async batchCreateTabs(
    accountUuid: string,
    groupUuid: string,
    request: EditorContracts.BatchCreateTabsRequest,
  ): Promise<EditorContracts.BatchOperationResponse<EditorContracts.EditorTabDTO>> {
    const successful: Array<{ id: string; result: EditorContracts.EditorTabDTO }> = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const [index, tabRequest] of request.tabs.entries()) {
      try {
        const tab = await this.createEditorTab(accountUuid, groupUuid, tabRequest);
        successful.push({ id: `${index}`, result: tab });
      } catch (error) {
        failed.push({
          id: `${index}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      total: request.tabs.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  /**
   * 批量保存文件
   * 聚合根控制：统一管理文件保存操作
   */
  async batchSaveFiles(
    accountUuid: string,
    request: EditorContracts.BatchSaveFilesRequest,
  ): Promise<EditorContracts.BatchOperationResponse<EditorContracts.FileOperationResponse>> {
    let filesToSave: string[] = [];

    if (request.saveAll) {
      // 获取所有未保存的标签页
      const unsavedTabs = await this.editorRepository.getUnsavedTabs(accountUuid);
      filesToSave = unsavedTabs.map((tab) => tab.path);
    } else {
      filesToSave = request.paths;
    }

    const successful: Array<{ id: string; result: EditorContracts.FileOperationResponse }> = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const path of filesToSave) {
      try {
        // 获取对应的标签页
        const tab = await this.editorRepository.getEditorTabByPath(accountUuid, path);
        if (tab && tab.isDirty) {
          // 保存文件内容（这里需要实际的文件操作实现）
          const response: EditorContracts.FileOperationResponse = {
            operation: 'write' as EditorContracts.FileOperationType,
            path: path,
            success: true,
            timestamp: Date.now(),
          };

          // 更新标签页状态
          await this.editorRepository.updateEditorTab(accountUuid, tab.uuid, {
            isDirty: false,
            lastModified: Date.now(),
          });

          successful.push({ id: path, result: response });
        }
      } catch (error) {
        failed.push({
          id: path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      total: filesToSave.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  /**
   * 获取编辑器状态
   * 聚合根控制：提供聚合状态视图
   */
  async getEditorState(accountUuid: string): Promise<EditorContracts.EditorStateResponse> {
    const currentSession = await this.editorRepository.getCurrentActiveSession(accountUuid);

    if (!currentSession) {
      return {
        currentSession: null,
        groups: [],
        activeGroupId: null,
        layout: this.getDefaultLayoutDTO(),
        totalTabs: 0,
        activeTabs: 0,
        unsavedFiles: 0,
        hasUnsavedChanges: false,
      };
    }

    // 加载完整的会话聚合
    const aggregate = await this.editorRepository.loadEditorSessionAggregate(
      accountUuid,
      currentSession.uuid,
    );

    if (!aggregate) {
      throw new Error('无法加载编辑器会话聚合');
    }

    const activeTabs = aggregate.tabs.filter((tab) => tab.active).length;
    const unsavedFiles = aggregate.tabs.filter((tab) => tab.isDirty).length;

    return {
      currentSession: aggregate.session,
      groups: aggregate.groups,
      activeGroupId: aggregate.session.activeGroupId,
      layout: aggregate.layout || this.getDefaultLayoutDTO(),
      totalTabs: aggregate.tabs.length,
      activeTabs,
      unsavedFiles,
      hasUnsavedChanges: unsavedFiles > 0,
    };
  }

  /**
   * 保存会话状态
   * 内部方法：保存会话的当前状态
   */
  private async saveSessionState(accountUuid: string, sessionUuid: string): Promise<void> {
    // 这里可以实现会话状态的持久化逻辑
    // 例如保存当前打开的文件、组布局等
    await this.editorRepository.updateEditorSession(accountUuid, sessionUuid, {
      lastSavedAt: Date.now(),
    });
  }

  /**
   * 检测文件类型
   * 工具方法：根据文件路径检测文件类型
   */
  private detectFileType(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      ts: 'typescript',
      js: 'javascript',
      vue: 'vue',
      json: 'json',
      md: 'markdown',
      css: 'css',
      scss: 'scss',
      html: 'html',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
    };

    return typeMap[extension || ''] || 'text';
  }

  /**
   * 获取默认布局DTO
   * 工具方法：提供默认布局配置
   */
  private getDefaultLayoutDTO(): EditorContracts.EditorLayoutDTO {
    return {
      uuid: 'default',
      accountUuid: '',
      name: '默认布局',
      activityBarWidth: 48,
      sidebarWidth: 300,
      minSidebarWidth: 200,
      resizeHandleWidth: 4,
      minEditorWidth: 300,
      editorTabWidth: 120,
      windowWidth: 1200,
      windowHeight: 800,
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}
