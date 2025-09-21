/**
 * UI Component Adapters for Editor Module
 * 编辑器模块UI组件适配器
 */

// 临时类型定义
interface Document {
  uuid: string;
  title: string;
  content: string;
  format: string;
  isDirty: boolean;
  lastSavedAt?: Date;
  metadata?: DocumentMetadata;
}

interface DocumentMetadata {
  tags: string[];
  createdAt: Date;
  lastModifiedAt: Date;
  wordCount: number;
  characterCount: number;
  lineCount: number;
}

interface SearchResult {
  uuid: string;
  documentUuid: string;
  title: string;
  snippet: string;
  matches: SearchMatch[];
  score: number;
}

interface SearchMatch {
  line: number;
  column: number;
  length: number;
  context: string;
}

interface EditorTab {
  uuid: string;
  documentUuid: string;
  title: string;
  isDirty: boolean;
  isActive: boolean;
  position: TabPosition;
}

interface TabPosition {
  index: number;
  group: string;
}

/**
 * 文档列表适配器
 */
export class DocumentListAdapter {
  private documents: Document[] = [];
  private searchResults: SearchResult[] = [];
  private filterQuery: string = '';
  private sortBy: string = 'lastModified';
  private sortOrder: 'asc' | 'desc' = 'desc';
  private listeners = new Map<string, ((data?: any) => void)[]>();

  /**
   * 设置文档列表
   */
  setDocuments(documents: Document[]): void {
    this.documents = documents;
    this.emit('documentsChanged', this.getFilteredDocuments());
  }

  /**
   * 设置搜索结果
   */
  setSearchResults(results: SearchResult[]): void {
    this.searchResults = results;
    this.emit('searchResultsChanged', results);
  }

  /**
   * 设置过滤查询
   */
  setFilterQuery(query: string): void {
    this.filterQuery = query;
    this.emit('filterChanged', { query, documents: this.getFilteredDocuments() });
  }

  /**
   * 设置排序
   */
  setSorting(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.emit('sortingChanged', { sortBy, sortOrder, documents: this.getFilteredDocuments() });
  }

  /**
   * 获取过滤后的文档
   */
  getFilteredDocuments(): Document[] {
    let filtered = [...this.documents];

    // 应用过滤器
    if (this.filterQuery) {
      const query = this.filterQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query) ||
          doc.metadata?.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // 应用排序
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'lastModified':
          const aTime = a.metadata?.lastModifiedAt?.getTime() || 0;
          const bTime = b.metadata?.lastModifiedAt?.getTime() || 0;
          comparison = aTime - bTime;
          break;
        case 'created':
          const aCreated = a.metadata?.createdAt?.getTime() || 0;
          const bCreated = b.metadata?.createdAt?.getTime() || 0;
          comparison = aCreated - bCreated;
          break;
        case 'size':
          comparison = (a.metadata?.characterCount || 0) - (b.metadata?.characterCount || 0);
          break;
        default:
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  /**
   * 获取搜索结果
   */
  getSearchResults(): SearchResult[] {
    return this.searchResults;
  }

  /**
   * 格式化文档显示信息
   */
  formatDocumentForDisplay(document: Document): any {
    return {
      uuid: document.uuid,
      title: document.title,
      subtitle: this.formatSubtitle(document),
      isDirty: document.isDirty,
      icon: this.getDocumentIcon(document),
      tags: document.metadata?.tags || [],
      lastModified: this.formatDate(document.metadata?.lastModifiedAt),
      size: this.formatSize(document.metadata?.characterCount || 0),
      preview: this.getContentPreview(document.content),
    };
  }

  /**
   * 格式化搜索结果显示信息
   */
  formatSearchResultForDisplay(result: SearchResult): any {
    return {
      uuid: result.uuid,
      documentUuid: result.documentUuid,
      title: result.title,
      snippet: result.snippet,
      matches: result.matches.length,
      score: Math.round(result.score * 100),
      firstMatch: result.matches[0],
      icon: 'mdi-file-document-outline',
    };
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

  private formatSubtitle(document: Document): string {
    const parts: string[] = [];

    if (document.metadata) {
      const { wordCount, characterCount, lineCount } = document.metadata;
      if (wordCount) parts.push(`${wordCount} words`);
      if (characterCount) parts.push(`${characterCount} chars`);
      if (lineCount) parts.push(`${lineCount} lines`);
    }

    return parts.join(' • ');
  }

  private getDocumentIcon(document: Document): string {
    switch (document.format) {
      case 'markdown':
        return 'mdi-language-markdown';
      case 'plaintext':
        return 'mdi-file-document-outline';
      case 'html':
        return 'mdi-language-html5';
      default:
        return 'mdi-file-document';
    }
  }

  private formatDate(date?: Date): string {
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private formatSize(characters: number): string {
    if (characters < 1000) {
      return `${characters} chars`;
    } else if (characters < 1000000) {
      return `${Math.round(characters / 1000)}K chars`;
    } else {
      return `${Math.round(characters / 1000000)}M chars`;
    }
  }

  private getContentPreview(content: string, maxLength: number = 100): string {
    const stripped = content
      .replace(/[#*_`\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  }
}

/**
 * 标签页适配器
 */
export class TabAdapter {
  private tabs: EditorTab[] = [];
  private activeTabUuid: string | null = null;
  private maxTabs: number = 20;
  private listeners = new Map<string, ((data?: any) => void)[]>();

  /**
   * 设置标签页列表
   */
  setTabs(tabs: EditorTab[]): void {
    this.tabs = tabs;
    this.emit('tabsChanged', this.getFormattedTabs());
  }

  /**
   * 设置活动标签页
   */
  setActiveTab(tabUuid: string): void {
    const previousUuid = this.activeTabUuid;
    this.activeTabUuid = tabUuid;

    // 更新标签页状态
    this.tabs = this.tabs.map((tab) => ({
      ...tab,
      isActive: tab.uuid === tabUuid,
    }));

    this.emit('activeTabChanged', {
      previousUuid,
      currentUuid: tabUuid,
      tabs: this.getFormattedTabs(),
    });
  }

  /**
   * 添加标签页
   */
  addTab(tab: EditorTab): void {
    // 检查是否已存在
    const existingIndex = this.tabs.findIndex((t) => t.documentUuid === tab.documentUuid);
    if (existingIndex !== -1) {
      // 激活已存在的标签页
      this.setActiveTab(this.tabs[existingIndex].uuid);
      return;
    }

    // 检查标签页数量限制
    if (this.tabs.length >= this.maxTabs) {
      // 移除最老的非活动标签页
      const oldestTab = this.tabs
        .filter((t) => !t.isActive)
        .sort((a, b) => a.position.index - b.position.index)[0];

      if (oldestTab) {
        this.removeTab(oldestTab.uuid);
      }
    }

    // 添加新标签页
    this.tabs.push(tab);
    this.setActiveTab(tab.uuid);
    this.emit('tabAdded', { tab, tabs: this.getFormattedTabs() });
  }

  /**
   * 移除标签页
   */
  removeTab(tabUuid: string): void {
    const tabIndex = this.tabs.findIndex((t) => t.uuid === tabUuid);
    if (tabIndex === -1) return;

    const tab = this.tabs[tabIndex];
    this.tabs.splice(tabIndex, 1);

    // 如果移除的是活动标签页，激活相邻的标签页
    if (this.activeTabUuid === tabUuid) {
      if (this.tabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
        this.setActiveTab(this.tabs[newActiveIndex].uuid);
      } else {
        this.activeTabUuid = null;
      }
    }

    this.emit('tabRemoved', { tab, tabs: this.getFormattedTabs() });
  }

  /**
   * 移动标签页
   */
  moveTab(tabUuid: string, newIndex: number): void {
    const currentIndex = this.tabs.findIndex((t) => t.uuid === tabUuid);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= this.tabs.length) return;

    const tab = this.tabs.splice(currentIndex, 1)[0];
    this.tabs.splice(newIndex, 0, tab);

    // 更新位置信息
    this.tabs.forEach((t, index) => {
      t.position.index = index;
    });

    this.emit('tabMoved', {
      tabUuid,
      oldIndex: currentIndex,
      newIndex,
      tabs: this.getFormattedTabs(),
    });
  }

  /**
   * 关闭其他标签页
   */
  closeOtherTabs(keepTabUuid: string): void {
    const keepTab = this.tabs.find((t) => t.uuid === keepTabUuid);
    if (!keepTab) return;

    const closedTabs = this.tabs.filter((t) => t.uuid !== keepTabUuid);
    this.tabs = [keepTab];
    this.setActiveTab(keepTabUuid);

    this.emit('otherTabsClosed', { keepTabUuid, closedTabs, tabs: this.getFormattedTabs() });
  }

  /**
   * 关闭所有标签页
   */
  closeAllTabs(): void {
    const closedTabs = [...this.tabs];
    this.tabs = [];
    this.activeTabUuid = null;

    this.emit('allTabsClosed', { closedTabs });
  }

  /**
   * 获取格式化的标签页数据
   */
  getFormattedTabs(): any[] {
    return this.tabs.map((tab) => ({
      uuid: tab.uuid,
      documentUuid: tab.documentUuid,
      title: this.formatTabTitle(tab.title),
      isDirty: tab.isDirty,
      isActive: tab.isActive,
      icon: tab.isDirty ? 'mdi-circle-small' : null,
      tooltip: this.formatTabTooltip(tab),
      canClose: true,
    }));
  }

  /**
   * 获取活动标签页
   */
  getActiveTab(): EditorTab | null {
    return this.tabs.find((t) => t.isActive) || null;
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

  private formatTabTitle(title: string, maxLength: number = 20): string {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  }

  private formatTabTooltip(tab: EditorTab): string {
    const parts = [tab.title];
    if (tab.isDirty) parts.push('(unsaved)');
    return parts.join(' ');
  }
}

/**
 * 工具栏适配器
 */
export class ToolbarAdapter {
  private actions: any[] = [];
  private currentDocument: Document | null = null;
  private editorState: any = {};
  private listeners = new Map<string, ((data?: any) => void)[]>();

  /**
   * 设置当前文档
   */
  setCurrentDocument(document: Document | null): void {
    this.currentDocument = document;
    this.updateActions();
    this.emit('documentChanged', { document, actions: this.getActions() });
  }

  /**
   * 设置编辑器状态
   */
  setEditorState(state: any): void {
    this.editorState = { ...this.editorState, ...state };
    this.updateActions();
    this.emit('editorStateChanged', { state, actions: this.getActions() });
  }

  /**
   * 获取工具栏操作
   */
  getActions(): any[] {
    return this.actions;
  }

  /**
   * 执行操作
   */
  executeAction(actionId: string, payload?: any): void {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action || !action.enabled) return;

    this.emit('actionExecuted', { actionId, action, payload });
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

  private updateActions(): void {
    const hasDocument = !!this.currentDocument;
    const isDirty = this.currentDocument?.isDirty || false;

    this.actions = [
      // 文件操作
      {
        id: 'new-document',
        label: 'New Document',
        icon: 'mdi-file-plus',
        enabled: true,
        group: 'file',
      },
      {
        id: 'open-document',
        label: 'Open Document',
        icon: 'mdi-folder-open',
        enabled: true,
        group: 'file',
      },
      {
        id: 'save-document',
        label: 'Save Document',
        icon: 'mdi-content-save',
        enabled: hasDocument && isDirty,
        group: 'file',
      },
      {
        id: 'save-all',
        label: 'Save All',
        icon: 'mdi-content-save-all',
        enabled: hasDocument,
        group: 'file',
      },

      // 编辑操作
      {
        id: 'undo',
        label: 'Undo',
        icon: 'mdi-undo',
        enabled: hasDocument && this.editorState.canUndo,
        group: 'edit',
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: 'mdi-redo',
        enabled: hasDocument && this.editorState.canRedo,
        group: 'edit',
      },
      {
        id: 'find',
        label: 'Find',
        icon: 'mdi-magnify',
        enabled: hasDocument,
        group: 'edit',
      },
      {
        id: 'replace',
        label: 'Replace',
        icon: 'mdi-find-replace',
        enabled: hasDocument,
        group: 'edit',
      },

      // 格式操作
      {
        id: 'bold',
        label: 'Bold',
        icon: 'mdi-format-bold',
        enabled: hasDocument,
        active: this.editorState.isBold,
        group: 'format',
      },
      {
        id: 'italic',
        label: 'Italic',
        icon: 'mdi-format-italic',
        enabled: hasDocument,
        active: this.editorState.isItalic,
        group: 'format',
      },
      {
        id: 'code',
        label: 'Code',
        icon: 'mdi-code-tags',
        enabled: hasDocument,
        active: this.editorState.isCode,
        group: 'format',
      },

      // 视图操作
      {
        id: 'toggle-preview',
        label: 'Toggle Preview',
        icon: 'mdi-eye',
        enabled: hasDocument,
        active: this.editorState.showPreview,
        group: 'view',
      },
      {
        id: 'toggle-minimap',
        label: 'Toggle Minimap',
        icon: 'mdi-map',
        enabled: hasDocument,
        active: this.editorState.showMinimap,
        group: 'view',
      },
      {
        id: 'toggle-word-wrap',
        label: 'Toggle Word Wrap',
        icon: 'mdi-wrap',
        enabled: hasDocument,
        active: this.editorState.wordWrap,
        group: 'view',
      },
    ];
  }
}
