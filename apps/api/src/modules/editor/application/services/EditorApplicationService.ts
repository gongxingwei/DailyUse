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
