/**
 * Editor Application Services
 * 编辑器应用服务层
 */

import { DocumentRepository } from '../repositories/DocumentRepository';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';

// 临时类型定义
interface Document {
  uuid: string;
  repositoryUuid: string;
  title: string;
  content: string;
  format: string;
  version: number;
  createdAt: Date;
  lastModifiedAt: Date;
  lastSavedAt?: Date;
  metadata: any;
  tags: string[];
  isDirty: boolean;
}

interface EditorWorkspace {
  uuid: string;
  name: string;
  repositoryUuid: string;
  description?: string;
  currentDocumentUuid?: string;
  openDocuments: any[];
  settings: any;
  layout: any;
  createdAt: Date;
  lastActiveAt: Date;
  isArchived: boolean;
  metadata: any;
}

interface ContentChange {
  uuid: string;
  documentUuid: string;
  type: string;
  position: any;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
  userId: string;
}

interface CreateDocumentCommand {
  repositoryUuid: string;
  title: string;
  content?: string;
  format?: string;
  tags?: string[];
  metadata?: any;
}

interface UpdateDocumentCommand {
  uuid: string;
  title?: string;
  content?: string;
  tags?: string[];
  metadata?: any;
}

interface SearchDocumentsQuery {
  query: string;
  searchType?: string;
  repositoryUuid?: string;
  documentFormat?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  options?: any;
  pagination?: {
    page: number;
    limit: number;
  };
}

interface CreateWorkspaceCommand {
  name: string;
  repositoryUuid: string;
  description?: string;
  settings?: any;
  layout?: any;
  userId: string;
}

interface UpdateWorkspaceCommand {
  uuid: string;
  name?: string;
  description?: string;
  settings?: any;
  layout?: any;
}

/**
 * 文档应用服务
 */
export class DocumentApplicationService {
  constructor(private documentRepository: DocumentRepository) {}

  /**
   * 创建文档
   */
  async createDocument(command: CreateDocumentCommand): Promise<Document> {
    const document: Document = {
      uuid: '',
      repositoryUuid: command.repositoryUuid,
      title: command.title,
      content: command.content || '',
      format: command.format || 'markdown',
      version: 1,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      metadata: command.metadata || {},
      tags: command.tags || [],
      isDirty: false,
    };

    return await this.documentRepository.create(document);
  }

  /**
   * 获取文档
   */
  async getDocument(uuid: string): Promise<Document | null> {
    return await this.documentRepository.findByUuid(uuid);
  }

  /**
   * 更新文档
   */
  async updateDocument(command: UpdateDocumentCommand): Promise<Document | null> {
    const existingDocument = await this.documentRepository.findByUuid(command.uuid);
    if (!existingDocument) {
      throw new Error(`Document with UUID ${command.uuid} not found`);
    }

    const updates: Partial<Document> = {};

    if (command.title !== undefined) updates.title = command.title;
    if (command.content !== undefined) updates.content = command.content;
    if (command.tags !== undefined) updates.tags = command.tags;
    if (command.metadata !== undefined)
      updates.metadata = { ...existingDocument.metadata, ...command.metadata };

    return await this.documentRepository.update(command.uuid, updates);
  }

  /**
   * 更新文档内容
   */
  async updateDocumentContent(
    documentUuid: string,
    content: string,
    changes: ContentChange[],
  ): Promise<Document | null> {
    return await this.documentRepository.updateContent(documentUuid, content, changes);
  }

  /**
   * 保存文档
   */
  async saveDocument(uuid: string): Promise<Document | null> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`Document with UUID ${uuid} not found`);
    }

    if (!document.isDirty) {
      return document; // 文档没有变更，无需保存
    }

    return await this.documentRepository.markSaved(uuid);
  }

  /**
   * 保存所有未保存的文档
   */
  async saveAllDocuments(repositoryUuid?: string): Promise<Document[]> {
    let dirtyDocuments = await this.documentRepository.findDirtyDocuments();

    if (repositoryUuid) {
      dirtyDocuments = dirtyDocuments.filter((doc) => doc.repositoryUuid === repositoryUuid);
    }

    const savedDocuments: Document[] = [];

    for (const document of dirtyDocuments) {
      const saved = await this.documentRepository.markSaved(document.uuid);
      if (saved) {
        savedDocuments.push(saved);
      }
    }

    return savedDocuments;
  }

  /**
   * 删除文档
   */
  async deleteDocument(uuid: string): Promise<void> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`Document with UUID ${uuid} not found`);
    }

    const deleted = await this.documentRepository.delete(uuid);
    if (!deleted) {
      throw new Error(`Failed to delete document with UUID ${uuid}`);
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(query: SearchDocumentsQuery): Promise<any> {
    const searchQuery = {
      query: query.query,
      searchType: query.searchType || 'fulltext',
      repositoryUuid: query.repositoryUuid,
      documentFormat: query.documentFormat,
      tags: query.tags,
      dateRange: query.dateRange,
      options: query.options || {},
    };

    const results = await this.documentRepository.search(searchQuery);

    // 应用分页
    if (query.pagination) {
      const { page, limit } = query.pagination;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        results: results.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: results.length,
          totalPages: Math.ceil(results.length / limit),
        },
      };
    }

    return {
      results,
      pagination: {
        page: 1,
        limit: results.length,
        total: results.length,
        totalPages: 1,
      },
    };
  }

  /**
   * 获取仓储中的所有文档
   */
  async getDocumentsByRepository(repositoryUuid: string): Promise<Document[]> {
    return await this.documentRepository.findByRepositoryUuid(repositoryUuid);
  }

  /**
   * 获取文档变更历史
   */
  async getDocumentHistory(documentUuid: string): Promise<ContentChange[]> {
    return await this.documentRepository.getChangeHistory(documentUuid);
  }

  /**
   * 搜索文档标题
   */
  async searchDocumentsByTitle(title: string): Promise<Document[]> {
    return await this.documentRepository.findByTitle(title);
  }

  /**
   * 获取未保存的文档
   */
  async getDirtyDocuments(): Promise<Document[]> {
    return await this.documentRepository.findDirtyDocuments();
  }

  /**
   * 批量操作文档
   */
  async batchUpdateDocuments(commands: UpdateDocumentCommand[]): Promise<Document[]> {
    const updatedDocuments: Document[] = [];

    for (const command of commands) {
      try {
        const updated = await this.updateDocument(command);
        if (updated) {
          updatedDocuments.push(updated);
        }
      } catch (error) {
        console.error(`Failed to update document ${command.uuid}:`, error);
        // 继续处理其他文档
      }
    }

    return updatedDocuments;
  }

  /**
   * 导出文档
   */
  async exportDocument(uuid: string, format: string): Promise<string> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`Document with UUID ${uuid} not found`);
    }

    switch (format.toLowerCase()) {
      case 'markdown':
        return document.content;

      case 'html':
        // 这里应该使用实际的 Markdown 转 HTML 转换器
        return this.convertMarkdownToHtml(document.content);

      case 'text':
        // 移除 Markdown 标记
        return this.stripMarkdown(document.content);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertMarkdownToHtml(markdown: string): string {
    // 简单的 Markdown 到 HTML 转换（生产环境应使用专业的库）
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private stripMarkdown(markdown: string): string {
    // 移除 Markdown 标记
    return markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }
}

/**
 * 工作空间应用服务
 */
export class WorkspaceApplicationService {
  constructor(
    private workspaceRepository: WorkspaceRepository,
    private documentRepository: DocumentRepository,
  ) {}

  /**
   * 创建工作空间
   */
  async createWorkspace(command: CreateWorkspaceCommand): Promise<EditorWorkspace> {
    const workspace: EditorWorkspace = {
      uuid: '',
      name: command.name,
      repositoryUuid: command.repositoryUuid,
      description: command.description,
      openDocuments: [],
      settings: command.settings || this.getDefaultSettings(),
      layout: command.layout || this.getDefaultLayout(),
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isArchived: false,
      metadata: {
        documentCount: 0,
        totalSize: 0,
        tags: [],
        customProperties: {},
      },
    };

    const createdWorkspace = await this.workspaceRepository.create(workspace);

    // 关联到用户
    await this.workspaceRepository.associateWithUser(createdWorkspace.uuid, command.userId);

    return createdWorkspace;
  }

  /**
   * 获取工作空间
   */
  async getWorkspace(uuid: string): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.findByUuid(uuid);
  }

  /**
   * 更新工作空间
   */
  async updateWorkspace(command: UpdateWorkspaceCommand): Promise<EditorWorkspace | null> {
    const existingWorkspace = await this.workspaceRepository.findByUuid(command.uuid);
    if (!existingWorkspace) {
      throw new Error(`Workspace with UUID ${command.uuid} not found`);
    }

    const updates: Partial<EditorWorkspace> = {};

    if (command.name !== undefined) updates.name = command.name;
    if (command.description !== undefined) updates.description = command.description;
    if (command.settings !== undefined)
      updates.settings = { ...existingWorkspace.settings, ...command.settings };
    if (command.layout !== undefined)
      updates.layout = { ...existingWorkspace.layout, ...command.layout };

    return await this.workspaceRepository.update(command.uuid, updates);
  }

  /**
   * 获取用户的工作空间
   */
  async getUserWorkspaces(userId: string): Promise<EditorWorkspace[]> {
    return await this.workspaceRepository.findByUserId(userId);
  }

  /**
   * 打开文档
   */
  async openDocument(workspaceUuid: string, documentUuid: string): Promise<EditorWorkspace | null> {
    const document = await this.documentRepository.findByUuid(documentUuid);
    if (!document) {
      throw new Error(`Document with UUID ${documentUuid} not found`);
    }

    const openDocument = {
      documentUuid,
      tabTitle: document.title,
      isDirty: document.isDirty,
      lastActiveAt: Date.now(),
      cursorPosition: { line: 1, column: 1, offset: 0 },
      scrollPosition: { x: 0, y: 0 },
    };

    return await this.workspaceRepository.addOpenDocument(workspaceUuid, openDocument);
  }

  /**
   * 关闭文档
   */
  async closeDocument(
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.removeOpenDocument(workspaceUuid, documentUuid);
  }

  /**
   * 设置活动文档
   */
  async setActiveDocument(
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.setCurrentDocument(workspaceUuid, documentUuid);
  }

  /**
   * 更新工作空间设置
   */
  async updateWorkspaceSettings(
    workspaceUuid: string,
    settings: any,
  ): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.updateSettings(workspaceUuid, settings);
  }

  /**
   * 更新工作空间布局
   */
  async updateWorkspaceLayout(workspaceUuid: string, layout: any): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.updateLayout(workspaceUuid, layout);
  }

  /**
   * 搜索工作空间
   */
  async searchWorkspaces(query: string): Promise<EditorWorkspace[]> {
    return await this.workspaceRepository.search(query);
  }

  /**
   * 归档工作空间
   */
  async archiveWorkspace(uuid: string): Promise<void> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`Workspace with UUID ${uuid} not found`);
    }

    const archived = await this.workspaceRepository.archive(uuid);
    if (!archived) {
      throw new Error(`Failed to archive workspace with UUID ${uuid}`);
    }
  }

  /**
   * 恢复工作空间
   */
  async unarchiveWorkspace(uuid: string): Promise<void> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`Workspace with UUID ${uuid} not found`);
    }

    const unarchived = await this.workspaceRepository.unarchive(uuid);
    if (!unarchived) {
      throw new Error(`Failed to unarchive workspace with UUID ${uuid}`);
    }
  }

  /**
   * 删除工作空间
   */
  async deleteWorkspace(uuid: string): Promise<void> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`Workspace with UUID ${uuid} not found`);
    }

    const deleted = await this.workspaceRepository.delete(uuid);
    if (!deleted) {
      throw new Error(`Failed to delete workspace with UUID ${uuid}`);
    }
  }

  /**
   * 复制工作空间
   */
  async cloneWorkspace(uuid: string, newName: string): Promise<EditorWorkspace | null> {
    return await this.workspaceRepository.clone(uuid, newName);
  }

  /**
   * 获取工作空间统计信息
   */
  async getWorkspaceStatistics(uuid: string): Promise<any> {
    return await this.workspaceRepository.getStatistics(uuid);
  }

  private getDefaultSettings(): any {
    return {
      theme: {
        name: 'vs-dark',
        mode: 'dark',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: {
        enabled: true,
        delay: 1000,
        onFocusChange: true,
        onWindowChange: true,
      },
      syntax: {
        highlighting: true,
        validation: true,
        autocompletion: true,
        formatOnSave: false,
      },
    };
  }

  private getDefaultLayout(): any {
    return {
      sidebarWidth: 250,
      editorWidth: 800,
      previewWidth: 400,
      isPreviewVisible: false,
      panelSizes: {
        explorer: 200,
        search: 200,
        extensions: 200,
        terminal: 200,
      },
      viewMode: {
        mode: 'edit',
        previewSync: true,
        previewPosition: 'right',
      },
      splitDirection: 'horizontal',
    };
  }
}
