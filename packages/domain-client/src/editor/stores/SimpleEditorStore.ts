/**
 * Simplified Editor Store (without Pinia)
 * 简化的编辑器Store实现 - 不依赖Pinia
 */

// 简化的响应式状态管理
export interface ReactiveRef<T> {
  value: T;
}

export function ref<T>(initialValue: T): ReactiveRef<T> {
  return { value: initialValue };
}

export function computed<T>(getter: () => T): ReactiveRef<T> {
  return { value: getter() };
}

// 前端文档类型（简化版）
interface FrontendDocument {
  uuid: string;
  repositoryUuid: string;
  title: string;
  content: string;
  format: string;
  isDirty: boolean;
  lastSavedAt?: Date;
}

// 前端工作区类型（简化版）
interface FrontendWorkspace {
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string;
  openDocuments: any[];
  settings: any;
  layout: any;
}

/**
 * 文档Store
 */
export class DocumentStore {
  private _documents = ref<FrontendDocument[]>([]);
  private _activeDocumentUuid = ref<string | null>(null);
  private _dirtyDocuments = ref<Set<string>>(new Set());

  get documents() {
    return this._documents;
  }

  get activeDocumentUuid() {
    return this._activeDocumentUuid;
  }

  get activeDocument() {
    return computed(() => {
      if (!this._activeDocumentUuid.value) return null;
      return (
        this._documents.value.find((doc) => doc.uuid === this._activeDocumentUuid.value) || null
      );
    });
  }

  get dirtyDocuments() {
    return computed(() => {
      return this._documents.value.filter((doc) => this._dirtyDocuments.value.has(doc.uuid));
    });
  }

  addDocument(document: FrontendDocument) {
    this._documents.value.push(document);
    if (!this._activeDocumentUuid.value) {
      this._activeDocumentUuid.value = document.uuid;
    }
  }

  removeDocument(documentUuid: string) {
    const index = this._documents.value.findIndex((doc) => doc.uuid === documentUuid);
    if (index !== -1) {
      this._documents.value.splice(index, 1);
      this._dirtyDocuments.value.delete(documentUuid);

      if (this._activeDocumentUuid.value === documentUuid) {
        this._activeDocumentUuid.value =
          this._documents.value.length > 0 ? this._documents.value[0].uuid : null;
      }
    }
  }

  setActiveDocument(documentUuid: string) {
    if (this._documents.value.some((doc) => doc.uuid === documentUuid)) {
      this._activeDocumentUuid.value = documentUuid;
    }
  }

  updateDocument(documentUuid: string, updates: Partial<FrontendDocument>) {
    const index = this._documents.value.findIndex((doc) => doc.uuid === documentUuid);
    if (index !== -1) {
      this._documents.value[index] = { ...this._documents.value[index], ...updates };

      if (updates.isDirty) {
        this._dirtyDocuments.value.add(documentUuid);
      } else {
        this._dirtyDocuments.value.delete(documentUuid);
      }
    }
  }

  markDocumentSaved(documentUuid: string) {
    this.updateDocument(documentUuid, {
      isDirty: false,
      lastSavedAt: new Date(),
    });
  }

  async saveDocument(documentUuid: string) {
    const document = this._documents.value.find((doc) => doc.uuid === documentUuid);
    if (!document || !document.isDirty) return;

    // 模拟保存操作
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.markDocumentSaved(documentUuid);
  }

  async saveAllDocuments() {
    const dirtyDocs = this.dirtyDocuments.value;
    await Promise.all(dirtyDocs.map((doc) => this.saveDocument(doc.uuid)));
  }
}

/**
 * 工作区Store
 */
export class WorkspaceStore {
  private _workspaces = ref<FrontendWorkspace[]>([]);
  private _activeWorkspaceUuid = ref<string | null>(null);

  get workspaces() {
    return this._workspaces;
  }

  get activeWorkspaceUuid() {
    return this._activeWorkspaceUuid;
  }

  get activeWorkspace() {
    return computed(() => {
      if (!this._activeWorkspaceUuid.value) return null;
      return (
        this._workspaces.value.find((ws) => ws.uuid === this._activeWorkspaceUuid.value) || null
      );
    });
  }

  addWorkspace(workspace: FrontendWorkspace) {
    this._workspaces.value.push(workspace);
    if (!this._activeWorkspaceUuid.value) {
      this._activeWorkspaceUuid.value = workspace.uuid;
    }
  }

  removeWorkspace(workspaceUuid: string) {
    const index = this._workspaces.value.findIndex((ws) => ws.uuid === workspaceUuid);
    if (index !== -1) {
      this._workspaces.value.splice(index, 1);

      if (this._activeWorkspaceUuid.value === workspaceUuid) {
        this._activeWorkspaceUuid.value =
          this._workspaces.value.length > 0 ? this._workspaces.value[0].uuid : null;
      }
    }
  }

  setActiveWorkspace(workspaceUuid: string) {
    if (this._workspaces.value.some((ws) => ws.uuid === workspaceUuid)) {
      this._activeWorkspaceUuid.value = workspaceUuid;
    }
  }

  updateWorkspace(workspaceUuid: string, updates: Partial<FrontendWorkspace>) {
    const index = this._workspaces.value.findIndex((ws) => ws.uuid === workspaceUuid);
    if (index !== -1) {
      this._workspaces.value[index] = { ...this._workspaces.value[index], ...updates };
    }
  }
}

/**
 * UI Store
 */
export class UIStore {
  private _sidebarState = ref({
    isVisible: true,
    width: 300,
    activeTab: 'files',
  });

  private _searchState = ref({
    isSearching: false,
    query: '',
    results: [] as any[],
  });

  get sidebarState() {
    return this._sidebarState;
  }

  get searchState() {
    return this._searchState;
  }

  toggleSidebar() {
    this._sidebarState.value.isVisible = !this._sidebarState.value.isVisible;
  }

  setSidebarWidth(width: number) {
    this._sidebarState.value.width = width;
  }

  setActiveTab(tabId: string) {
    this._sidebarState.value.activeTab = tabId;
  }

  setSearchQuery(query: string) {
    this._searchState.value.query = query;
  }

  setSearchResults(results: any[]) {
    this._searchState.value.results = results;
  }

  setSearching(isSearching: boolean) {
    this._searchState.value.isSearching = isSearching;
  }
}

// 创建全局Store实例
export const documentStore = new DocumentStore();
export const workspaceStore = new WorkspaceStore();
export const uiStore = new UIStore();

// 兼容性导出（模拟Pinia的API）
export function useDocumentStore() {
  return documentStore;
}

export function useWorkspaceStore() {
  return workspaceStore;
}

export function useUIStore() {
  return uiStore;
}
