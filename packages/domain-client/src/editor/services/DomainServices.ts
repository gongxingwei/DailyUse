/**
 * Domain Services for Frontend
 * 前端领域服务
 */

// 暂时定义前端需要的类型（避免复杂的imports问题）
interface Position {
  line: number;
  column: number;
  offset: number;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface OpenDocument {
  documentUuid: string;
  tabTitle: string;
  isDirty: boolean;
  lastActiveAt: number;
  cursorPosition: Position;
  scrollPosition: ScrollPosition;
}

interface FrontendDocument {
  uuid: string;
  repositoryUuid: string;
  title: string;
  content: string;
  format: string;
  isDirty: boolean;
  lastSavedAt?: Date;
}

interface EditorSettings {
  theme: any;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: any;
  syntax: any;
}

interface WorkspaceLayout {
  sidebarWidth: number;
  editorWidth: number;
  previewWidth: number;
  isPreviewVisible: boolean;
  panelSizes: any;
  viewMode: string;
}

interface FrontendWorkspace {
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string;
  openDocuments: OpenDocument[];
  settings: EditorSettings;
  layout: WorkspaceLayout;
}

interface IContentChange {
  uuid: string;
  type: string;
  position: Position;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
}

/**
 * 前端文档管理服务
 */
export class DocumentManagementService {
  private documents = new Map<string, FrontendDocument>();
  private activeDocumentUuid: string | null = null;
  private dirtyDocuments = new Set<string>();
  private listeners = new Map<string, ((data?: any) => void)[]>();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 添加文档
   */
  addDocument(document: FrontendDocument): void {
    this.documents.set(document.uuid, document);

    if (!this.activeDocumentUuid) {
      this.setActiveDocument(document.uuid);
    }

    this.saveToStorage();
    this.emit('documentAdded', document);
  }

  /**
   * 移除文档
   */
  removeDocument(documentUuid: string): void {
    const document = this.documents.get(documentUuid);
    if (!document) return;

    this.documents.delete(documentUuid);
    this.dirtyDocuments.delete(documentUuid);

    if (this.activeDocumentUuid === documentUuid) {
      const remainingDocs = Array.from(this.documents.keys());
      this.activeDocumentUuid = remainingDocs.length > 0 ? remainingDocs[0] : null;
    }

    this.saveToStorage();
    this.emit('documentRemoved', { documentUuid, document });
  }

  /**
   * 设置活动文档
   */
  setActiveDocument(documentUuid: string): void {
    if (this.documents.has(documentUuid)) {
      const previousUuid = this.activeDocumentUuid;
      this.activeDocumentUuid = documentUuid;
      this.saveToStorage();
      this.emit('activeDocumentChanged', { previousUuid, currentUuid: documentUuid });
    }
  }

  /**
   * 获取活动文档
   */
  getActiveDocument(): FrontendDocument | null {
    if (!this.activeDocumentUuid) return null;
    return this.documents.get(this.activeDocumentUuid) || null;
  }

  /**
   * 更新文档内容
   */
  updateDocumentContent(documentUuid: string, content: string, changes: IContentChange[]): void {
    const document = this.documents.get(documentUuid);
    if (!document) return;

    const updatedDocument: FrontendDocument = {
      ...document,
      content,
      isDirty: true,
    };

    this.documents.set(documentUuid, updatedDocument);
    this.dirtyDocuments.add(documentUuid);
    this.saveToStorage();
    this.emit('documentContentChanged', { documentUuid, content, changes });
  }

  /**
   * 标记文档为已保存
   */
  markDocumentSaved(documentUuid: string): void {
    const document = this.documents.get(documentUuid);
    if (!document) return;

    const updatedDocument: FrontendDocument = {
      ...document,
      isDirty: false,
      lastSavedAt: new Date(),
    };

    this.documents.set(documentUuid, updatedDocument);
    this.dirtyDocuments.delete(documentUuid);
    this.saveToStorage();
    this.emit('documentSaved', { documentUuid, document: updatedDocument });
  }

  /**
   * 获取所有文档
   */
  getAllDocuments(): FrontendDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * 获取未保存的文档
   */
  getDirtyDocuments(): FrontendDocument[] {
    return Array.from(this.dirtyDocuments)
      .map((uuid) => this.documents.get(uuid))
      .filter(Boolean) as FrontendDocument[];
  }

  /**
   * 检查是否有未保存的文档
   */
  hasDirtyDocuments(): boolean {
    return this.dirtyDocuments.size > 0;
  }

  /**
   * 保存文档
   */
  async saveDocument(documentUuid: string): Promise<void> {
    const document = this.documents.get(documentUuid);
    if (!document || !document.isDirty) return;

    try {
      this.emit('documentSaveStarted', { documentUuid });

      // TODO: 调用实际的保存 API
      await this.performSave(document);

      this.markDocumentSaved(documentUuid);
      this.emit('documentSaveCompleted', { documentUuid });
    } catch (error) {
      this.emit('documentSaveError', { documentUuid, error });
      throw error;
    }
  }

  /**
   * 保存所有未保存的文档
   */
  async saveAllDocuments(): Promise<void> {
    const savePromises = Array.from(this.dirtyDocuments).map((uuid) => this.saveDocument(uuid));
    await Promise.all(savePromises);
  }

  /**
   * 订阅事件
   */
  on(event: string, callback: (data?: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  private async performSave(document: FrontendDocument): Promise<void> {
    // 模拟保存操作
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('Document saved:', document.title);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('editor-documents');
      if (stored) {
        const data = JSON.parse(stored);
        this.documents = new Map(data.documents || []);
        this.activeDocumentUuid = data.activeDocumentUuid || null;
        this.dirtyDocuments = new Set(data.dirtyDocuments || []);
      }
    } catch (error) {
      console.error('Failed to load documents from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        documents: Array.from(this.documents.entries()),
        activeDocumentUuid: this.activeDocumentUuid,
        dirtyDocuments: Array.from(this.dirtyDocuments),
      };
      localStorage.setItem('editor-documents', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save documents to storage:', error);
    }
  }
}

/**
 * 前端工作空间管理服务
 */
export class WorkspaceManagementService {
  private workspaces = new Map<string, FrontendWorkspace>();
  private activeWorkspaceUuid: string | null = null;
  private listeners = new Map<string, ((data?: any) => void)[]>();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 添加工作空间
   */
  addWorkspace(workspace: FrontendWorkspace): void {
    this.workspaces.set(workspace.uuid, workspace);

    if (!this.activeWorkspaceUuid) {
      this.setActiveWorkspace(workspace.uuid);
    }

    this.saveToStorage();
    this.emit('workspaceAdded', workspace);
  }

  /**
   * 移除工作空间
   */
  removeWorkspace(workspaceUuid: string): void {
    const workspace = this.workspaces.get(workspaceUuid);
    if (!workspace) return;

    this.workspaces.delete(workspaceUuid);

    if (this.activeWorkspaceUuid === workspaceUuid) {
      const remainingWorkspaces = Array.from(this.workspaces.keys());
      this.activeWorkspaceUuid = remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null;
    }

    this.saveToStorage();
    this.emit('workspaceRemoved', { workspaceUuid, workspace });
  }

  /**
   * 设置活动工作空间
   */
  setActiveWorkspace(workspaceUuid: string): void {
    if (this.workspaces.has(workspaceUuid)) {
      const previousUuid = this.activeWorkspaceUuid;
      this.activeWorkspaceUuid = workspaceUuid;
      this.saveToStorage();
      this.emit('activeWorkspaceChanged', { previousUuid, currentUuid: workspaceUuid });
    }
  }

  /**
   * 获取活动工作空间
   */
  getActiveWorkspace(): FrontendWorkspace | null {
    if (!this.activeWorkspaceUuid) return null;
    return this.workspaces.get(this.activeWorkspaceUuid) || null;
  }

  /**
   * 更新工作空间设置
   */
  updateWorkspaceSettings(workspaceUuid: string, settings: Partial<EditorSettings>): void {
    const workspace = this.workspaces.get(workspaceUuid);
    if (!workspace) return;

    const updatedWorkspace: FrontendWorkspace = {
      ...workspace,
      settings: { ...workspace.settings, ...settings },
    };

    this.workspaces.set(workspaceUuid, updatedWorkspace);
    this.saveToStorage();
    this.emit('workspaceSettingsChanged', { workspaceUuid, settings });
  }

  /**
   * 更新工作空间布局
   */
  updateWorkspaceLayout(workspaceUuid: string, layout: Partial<WorkspaceLayout>): void {
    const workspace = this.workspaces.get(workspaceUuid);
    if (!workspace) return;

    const updatedWorkspace: FrontendWorkspace = {
      ...workspace,
      layout: { ...workspace.layout, ...layout },
    };

    this.workspaces.set(workspaceUuid, updatedWorkspace);
    this.saveToStorage();
    this.emit('workspaceLayoutChanged', { workspaceUuid, layout });
  }

  /**
   * 获取所有工作空间
   */
  getAllWorkspaces(): FrontendWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * 订阅事件
   */
  on(event: string, callback: (data?: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('editor-workspaces');
      if (stored) {
        const data = JSON.parse(stored);
        this.workspaces = new Map(data.workspaces || []);
        this.activeWorkspaceUuid = data.activeWorkspaceUuid || null;
      }
    } catch (error) {
      console.error('Failed to load workspaces from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        workspaces: Array.from(this.workspaces.entries()),
        activeWorkspaceUuid: this.activeWorkspaceUuid,
      };
      localStorage.setItem('editor-workspaces', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workspaces to storage:', error);
    }
  }
}

/**
 * 前端搜索服务
 */
export class SearchService {
  private searchHistory: string[] = [];
  private savedSearches = new Map<string, any>();
  private listeners = new Map<string, ((data?: any) => void)[]>();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 执行搜索
   */
  async search(query: string, searchType: string = 'fulltext', scope?: any): Promise<any[]> {
    if (!query.trim()) return [];

    this.addToHistory(query);
    this.emit('searchStarted', { query, searchType, scope });

    try {
      // TODO: 调用实际的搜索 API
      const results = await this.performSearch(query, searchType, scope);

      this.emit('searchCompleted', { query, searchType, results });
      return results;
    } catch (error) {
      this.emit('searchError', { query, searchType, error });
      throw error;
    }
  }

  /**
   * 保存搜索
   */
  saveSearch(name: string, query: string, searchType: string, scope?: any): void {
    const savedSearch = {
      uuid: this.generateUuid(),
      name,
      query,
      searchType,
      scope,
      createdAt: new Date(),
    };

    this.savedSearches.set(savedSearch.uuid, savedSearch);
    this.saveToStorage();
    this.emit('searchSaved', savedSearch);
  }

  /**
   * 删除保存的搜索
   */
  deleteSavedSearch(searchUuid: string): void {
    const savedSearch = this.savedSearches.get(searchUuid);
    if (savedSearch) {
      this.savedSearches.delete(searchUuid);
      this.saveToStorage();
      this.emit('searchDeleted', savedSearch);
    }
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * 获取保存的搜索
   */
  getSavedSearches(): any[] {
    return Array.from(this.savedSearches.values());
  }

  /**
   * 清除搜索历史
   */
  clearHistory(): void {
    this.searchHistory = [];
    this.saveToStorage();
    this.emit('historyCleared');
  }

  /**
   * 订阅事件
   */
  on(event: string, callback: (data?: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  private addToHistory(query: string): void {
    const index = this.searchHistory.indexOf(query);
    if (index !== -1) {
      this.searchHistory.splice(index, 1);
    }

    this.searchHistory.unshift(query);

    // 只保留最近 50 条记录
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

    this.saveToStorage();
  }

  private async performSearch(query: string, searchType: string, scope?: any): Promise<any[]> {
    // 模拟搜索延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 模拟搜索结果
    const mockResults = [
      {
        uuid: '1',
        documentUuid: 'doc-1',
        title: 'Test Document 1',
        snippet: `This document contains "${query}" in its content...`,
        matches: [
          { line: 5, column: 10, length: query.length, context: `...example ${query} usage...` },
        ],
        score: 0.9,
      },
      {
        uuid: '2',
        documentUuid: 'doc-2',
        title: 'Test Document 2',
        snippet: `Another document with "${query}" reference...`,
        matches: [
          {
            line: 12,
            column: 5,
            length: query.length,
            context: `...related to ${query} functionality...`,
          },
        ],
        score: 0.7,
      },
    ];

    return mockResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.snippet.toLowerCase().includes(query.toLowerCase()),
    );
  }

  private generateUuid(): string {
    return `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('editor-search');
      if (stored) {
        const data = JSON.parse(stored);
        this.searchHistory = data.searchHistory || [];
        this.savedSearches = new Map(data.savedSearches || []);
      }
    } catch (error) {
      console.error('Failed to load search data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        searchHistory: this.searchHistory,
        savedSearches: Array.from(this.savedSearches.entries()),
      };
      localStorage.setItem('editor-search', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search data to storage:', error);
    }
  }
}
