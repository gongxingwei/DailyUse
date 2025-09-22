/**
 * Editor Application Service
 * 编辑器应用层服务 - 协调业务流程和基础设施
 *
 * 职责：
 * 1. 协调领域服务和基础设施服务
 * 2. 管理事务和数据持久化
 * 3. 处理跨聚合的业务流程
 * 4. 暴露给接口层使用
 *
 * 架构说明：
 * - 基于Document/Workspace聚合根的DDD架构
 * - Document聚合根：管理单个文档的内容、版本、元数据
 * - Workspace聚合根：管理工作区状态、打开的文档、布局配置
 */

import { EditorContracts } from '@dailyuse/contracts';
import { EditorDomainService } from '@dailyuse/domain-server';
import type { IDocumentRepository } from '../../infrastructure/repositories/interfaces/IDocumentRepository';
import type { IWorkspaceRepository } from '../../infrastructure/repositories/interfaces/IWorkspaceRepository';

// 使用现有contracts中的类型别名
type IDocument = EditorContracts.IDocument;
type IEditorWorkspace = EditorContracts.IEditorWorkspace;
type CreateDocumentDTO = EditorContracts.CreateDocumentDTO;
type UpdateDocumentDTO = EditorContracts.UpdateDocumentDTO;
type CreateWorkspaceDTO = EditorContracts.CreateWorkspaceDTO;
type UpdateWorkspaceDTO = EditorContracts.UpdateWorkspaceDTO;

export class EditorApplicationService {
  constructor(
    private readonly editorDomainService: EditorDomainService,
    private readonly documentRepository: IDocumentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}

  // ============ 文档管理 ============

  /**
   * 创建新文档
   */
  async createDocument(
    accountUuid: string,
    createDocumentDTO: CreateDocumentDTO,
  ): Promise<IDocument> {
    this.editorDomainService.validateFilePath(createDocumentDTO.relativePath);

    if (!createDocumentDTO.title?.trim()) {
      throw new Error('文档标题不能为空');
    }

    const detectedFormat = this.editorDomainService.determineFileType(
      createDocumentDTO.relativePath,
    );

    const documentData: Omit<IDocument, 'uuid' | 'lifecycle'> = {
      repositoryUuid: createDocumentDTO.repositoryUuid,
      relativePath: createDocumentDTO.relativePath,
      fileName: this.extractFileName(createDocumentDTO.relativePath),
      title: createDocumentDTO.title.trim(),
      content: createDocumentDTO.content || '',
      format: createDocumentDTO.format || (detectedFormat as EditorContracts.DocumentFormat),
      metadata: {
        tags: createDocumentDTO.tags || [],
        category: '',
        wordCount: this.calculateWordCount(createDocumentDTO.content || ''),
        characterCount: (createDocumentDTO.content || '').length,
        readingTime: Math.ceil(this.calculateWordCount(createDocumentDTO.content || '') / 200),
        isReadOnly: false,
        encoding: 'utf-8',
        language: detectedFormat,
      },
      tags: createDocumentDTO.tags || [],
      resources: [],
      versions: [],
      renderingState: {
        mode: EditorContracts.RenderingMode.SOURCE_ONLY,
        isLivePreview: false,
        cursorInRenderedView: false,
        renderedContent: {
          html: '',
          toc: { items: [] },
          codeBlocks: [],
          mathBlocks: [],
          imageReferences: [],
        },
        sourceMap: { mappings: [] },
      },
    };

    // 使用仓储创建文档
    const document = await this.documentRepository.create(accountUuid, documentData);
    return document;
  }

  /**
   * 创建工作区
   */
  async createWorkspace(
    accountUuid: string,
    createWorkspaceDTO: CreateWorkspaceDTO,
  ): Promise<IEditorWorkspace> {
    this.editorDomainService.validateSessionCreation(createWorkspaceDTO.name);

    const workspaceData: Omit<IEditorWorkspace, 'uuid' | 'lifecycle'> = {
      name: createWorkspaceDTO.name.trim(),
      repositoryUuid: createWorkspaceDTO.repositoryUuid,
      currentDocumentUuid: undefined,
      openDocuments: [],
      sidebarState: {
        isVisible: true,
        activeTab: EditorContracts.SidebarTab.FILE_EXPLORER,
        width: 300,
        tabs: [
          {
            id: EditorContracts.SidebarTab.FILE_EXPLORER,
            title: 'Files',
            icon: 'folder',
            isEnabled: true,
            order: 1,
          },
        ],
      },
      layout: {
        sidebarWidth: 300,
        editorWidth: 800,
        previewWidth: 800,
        isPreviewVisible: false,
        panelSizes: {
          sidebar: 300,
          editor: 800,
          preview: 800,
        },
        viewMode: EditorContracts.ViewMode.EDITOR_ONLY,
      },
      settings: {
        theme: {
          name: 'dark',
          isDark: true,
          colors: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            accent: '#007acc',
            border: '#3c3c3c',
            selection: '#264f78',
            lineNumber: '#858585',
          },
        },
        autoSave: createWorkspaceDTO.settings?.autoSave || {
          enabled: true,
          interval: 30,
          onFocusLoss: false,
        },
        syntax: {
          highlightEnabled: true,
          language: 'markdown',
          markdownPreview: true,
          livePreview: false,
        },
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, monospace',
        lineHeight: 1.5,
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
      },
      searchState: {
        currentQuery: '',
        searchType: EditorContracts.SearchType.FULL_TEXT,
        isSearching: false,
        results: [],
        selectedResultIndex: -1,
      },
    };

    // 使用仓储创建工作区
    const workspace = await this.workspaceRepository.create(accountUuid, workspaceData);
    return workspace;
  }

  // ============ 文档操作 ============

  /**
   * 获取文档
   */
  async getDocument(accountUuid: string, uuid: string): Promise<IDocument | null> {
    return await this.documentRepository.findByUuid(accountUuid, uuid);
  }

  /**
   * 更新文档内容
   */
  async updateDocumentContent(
    accountUuid: string,
    documentUuid: string,
    content: string,
  ): Promise<IDocument> {
    const document = await this.documentRepository.findByUuid(accountUuid, documentUuid);
    if (!document) {
      throw new Error(`Document with UUID ${documentUuid} not found`);
    }

    const updates: Partial<IDocument> = {
      content,
      metadata: {
        ...document.metadata,
        wordCount: this.calculateWordCount(content),
        characterCount: content.length,
        readingTime: Math.ceil(this.calculateWordCount(content) / 200),
      },
    };

    return await this.documentRepository.update(accountUuid, documentUuid, updates);
  }

  /**
   * 更新文档元数据
   */
  async updateDocument(
    accountUuid: string,
    documentUuid: string,
    updateDocumentDTO: UpdateDocumentDTO,
  ): Promise<IDocument> {
    const document = await this.documentRepository.findByUuid(accountUuid, documentUuid);
    if (!document) {
      throw new Error(`Document with UUID ${documentUuid} not found`);
    }

    const updates: Partial<IDocument> = {};

    if (updateDocumentDTO.title !== undefined) {
      updates.title = updateDocumentDTO.title.trim();
    }
    if (updateDocumentDTO.content !== undefined) {
      updates.content = updateDocumentDTO.content;
      updates.metadata = {
        ...document.metadata,
        wordCount: this.calculateWordCount(updateDocumentDTO.content),
        characterCount: updateDocumentDTO.content.length,
        readingTime: Math.ceil(this.calculateWordCount(updateDocumentDTO.content) / 200),
      };
    }
    if (updateDocumentDTO.tags !== undefined) {
      updates.tags = updateDocumentDTO.tags;
    }

    return await this.documentRepository.update(accountUuid, documentUuid, updates);
  }

  /**
   * 删除文档
   */
  async deleteDocument(accountUuid: string, documentUuid: string): Promise<void> {
    const document = await this.documentRepository.findByUuid(accountUuid, documentUuid);
    if (!document) {
      throw new Error(`Document with UUID ${documentUuid} not found`);
    }

    await this.documentRepository.delete(accountUuid, documentUuid);
  }

  /**
   * 搜索文档
   */
  async searchDocuments(
    accountUuid: string,
    query: string,
    repositoryUuid?: string,
  ): Promise<IDocument[]> {
    const searchOptions = {
      repositoryUuid,
      limit: 50,
    };
    return await this.documentRepository.searchContent(accountUuid, query, searchOptions);
  }

  /**
   * 获取仓储中的所有文档
   */
  async getDocumentsByRepository(
    accountUuid: string,
    repositoryUuid: string,
  ): Promise<IDocument[]> {
    return await this.documentRepository.findByRepository(accountUuid, repositoryUuid);
  }

  // ============ 工作区操作 ============

  /**
   * 获取工作区
   */
  async getWorkspace(accountUuid: string, uuid: string): Promise<IEditorWorkspace | null> {
    return await this.workspaceRepository.findByUuid(accountUuid, uuid);
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(
    accountUuid: string,
    workspaceUuid: string,
    updateWorkspaceDTO: UpdateWorkspaceDTO,
  ): Promise<IEditorWorkspace> {
    const workspace = await this.workspaceRepository.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error(`Workspace with UUID ${workspaceUuid} not found`);
    }

    const updates: Partial<IEditorWorkspace> = {};

    if (updateWorkspaceDTO.name !== undefined) {
      this.editorDomainService.validateSessionCreation(updateWorkspaceDTO.name);
      updates.name = updateWorkspaceDTO.name.trim();
    }
    if (updateWorkspaceDTO.settings !== undefined) {
      updates.settings = { ...workspace.settings, ...updateWorkspaceDTO.settings };
    }
    if (updateWorkspaceDTO.layout !== undefined) {
      updates.layout = { ...workspace.layout, ...updateWorkspaceDTO.layout };
    }

    return await this.workspaceRepository.update(accountUuid, workspaceUuid, updates);
  }

  /**
   * 在工作区中打开文档
   */
  async openDocumentInWorkspace(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<IEditorWorkspace> {
    const document = await this.documentRepository.findByUuid(accountUuid, documentUuid);
    if (!document) {
      throw new Error(`Document with UUID ${documentUuid} not found`);
    }

    const openDocument = {
      documentUuid,
      tabTitle: document.title,
      isDirty: false,
      lastActiveAt: Date.now(),
      cursorPosition: { line: 1, column: 1, offset: 0 },
      scrollPosition: { x: 0, y: 0 },
    };

    return await this.workspaceRepository.addOpenDocument(accountUuid, workspaceUuid, openDocument);
  }

  /**
   * 从工作区关闭文档
   */
  async closeDocumentInWorkspace(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<IEditorWorkspace> {
    return await this.workspaceRepository.removeOpenDocument(
      accountUuid,
      workspaceUuid,
      documentUuid,
    );
  }

  /**
   * 设置工作区的当前活动文档
   */
  async setCurrentDocumentInWorkspace(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<IEditorWorkspace> {
    return await this.workspaceRepository.setCurrentDocument(
      accountUuid,
      workspaceUuid,
      documentUuid,
    );
  }

  /**
   * 获取用户的所有工作区
   */
  async getUserWorkspaces(accountUuid: string): Promise<IEditorWorkspace[]> {
    return await this.workspaceRepository.findByAccount(accountUuid);
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(accountUuid: string, workspaceUuid: string): Promise<void> {
    const workspace = await this.workspaceRepository.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error(`Workspace with UUID ${workspaceUuid} not found`);
    }

    await this.workspaceRepository.delete(accountUuid, workspaceUuid);
  }

  // ============ 兼容性方法 ============
  // 为了与现有的EditorController兼容

  async getEditorState(): Promise<any> {
    return {
      groups: [],
      activeGroupId: null,
      totalTabs: 0,
      unsavedFiles: 0,
    };
  }

  async getEditorGroups(): Promise<any[]> {
    return [];
  }

  async getActiveEditorGroup(): Promise<any> {
    return null;
  }

  async setActiveEditorGroup(groupId: string): Promise<void> {
    // TODO: 实现
  }

  async openFile(command: any): Promise<any> {
    throw new Error('Method needs implementation for new architecture');
  }

  async closeTab(command: any): Promise<void> {
    throw new Error('Method needs implementation for new architecture');
  }

  async closeAllTabs(groupId?: string): Promise<void> {
    throw new Error('Method needs implementation for new architecture');
  }

  async saveFile(groupId: string, tabId: string): Promise<void> {
    throw new Error('Method needs implementation for new architecture');
  }

  async saveAllFiles(groupId?: string): Promise<void> {
    throw new Error('Method needs implementation for new architecture');
  }

  async splitEditor(command: any): Promise<any> {
    throw new Error('Method needs implementation for new architecture');
  }

  async resizeEditor(command: any): Promise<void> {
    throw new Error('Method needs implementation for new architecture');
  }

  async getEditorGroup(groupId: string): Promise<any> {
    return null;
  }

  async getFileContent(path: string): Promise<any> {
    this.editorDomainService.validateFilePath(path);
    const fileType = this.editorDomainService.determineFileType(path);

    return {
      path,
      content: '',
      fileType,
      size: 0,
      lastModified: new Date(),
      readonly: false,
    };
  }

  // ============ 私有辅助方法 ============

  private extractFileName(path: string): string {
    return path.split('/').pop() || path.split('\\').pop() || path;
  }

  private calculateWordCount(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private calculateLineCount(content: string): number {
    return content.split('\n').length;
  }
}
