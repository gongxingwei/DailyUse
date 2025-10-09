# Editor 模块实体设计

## 模块概述

Editor 模块负责文档编辑、工作区管理、会话恢复、版本控制等功能。

## 领域模型层次

```
EditorWorkspace (聚合根)
├── Document (实体)
│   ├── DocumentVersion (实体)
│   └── LinkedResource (实体)
├── EditorSession (聚合根)
│   ├── EditorGroup (实体)
│   └── EditorTab (实体)
└── SearchEngine (实体)
```

---

## 1. EditorWorkspace (聚合根)

### 业务描述
工作区是编辑器的顶层容器，管理当前打开的文档、布局、设置等。

### Server 接口

```typescript
export interface EditorWorkspaceServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string | null;
  
  // ===== 打开的文档 =====
  openDocuments: {
    documentUuid: string;
    tabTitle: string;
    isDirty: boolean;
    lastActiveAt?: Date | null;
    cursorPosition?: {
      line: number;
      column: number;
      offset: number;
    };
    scrollPosition?: {
      x: number;
      y: number;
    };
  }[];
  
  // ===== 侧边栏状态 =====
  sidebarState: {
    isVisible: boolean;
    width: number;
    activeTab: 'files' | 'tags' | 'search' | 'outline' | 'resources';
    tabs: string[];
  };
  
  // ===== 布局配置 =====
  layout: {
    sidebarWidth: number;
    editorWidth: number;
    previewWidth: number;
    isPreviewVisible: boolean;
    panelSizes?: { sidebar?: number; editor?: number; preview?: number };
    viewMode: 'editor' | 'preview' | 'split-h' | 'split-v';
  };
  
  // ===== 编辑器设置 =====
  settings: {
    theme?: string;
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    tabSize?: number;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    minimap?: boolean;
    autoSave?: { enabled: boolean; interval: number };
  };
  
  // ===== 搜索状态 =====
  searchState?: {
    query: string;
    type: 'fulltext' | 'regex' | 'tag' | 'filename';
    scope?: any;
    filters?: any;
    results?: any[];
  } | null;
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 文档操作
  openDocument(documentUuid: string): void;
  closeDocument(documentUuid: string): void;
  closeAllDocuments(): void;
  closeOtherDocuments(documentUuid: string): void;
  switchDocument(documentUuid: string): void;
  
  // 文档状态
  markDocumentDirty(documentUuid: string): void;
  markDocumentClean(documentUuid: string): void;
  hasUnsavedChanges(): boolean;
  getDirtyDocuments(): string[];
  
  // 布局管理
  updateLayout(layout: Partial<EditorWorkspaceServer['layout']>): void;
  togglePreview(): void;
  toggleSidebar(): void;
  resizePanel(panel: 'sidebar' | 'editor' | 'preview', size: number): void;
  
  // 设置管理
  updateSettings(settings: Partial<EditorWorkspaceServer['settings']>): void;
  resetSettings(): void;
  exportSettings(): string;
  importSettings(json: string): void;
  
  // 搜索操作
  search(query: string, type: 'fulltext' | 'regex' | 'tag' | 'filename'): Promise<any[]>;
  clearSearch(): void;
  
  // 会话管理
  saveSession(): Promise<void>;
  restoreSession(sessionData: any): void;
  
  // 快照与恢复
  createSnapshot(): WorkspaceSnapshot;
  restoreFromSnapshot(snapshot: WorkspaceSnapshot): void;
  
  // DTO 转换
  toServerDTO(): EditorWorkspaceServerDTO;
  toClientDTO(): EditorWorkspaceClientDTO;
  toPersistenceDTO(): EditorWorkspacePersistenceDTO;
}

interface WorkspaceSnapshot {
  uuid: string;
  timestamp: Date;
  openDocuments: string[];
  currentDocument?: string;
  layout: any;
  settings: any;
}
```

### Client 接口

```typescript
export interface EditorWorkspaceClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string | null;
  
  // ===== 打开的文档 (UI 优化) =====
  openDocuments: {
    documentUuid: string;
    tabTitle: string;
    isDirty: boolean;
    icon: string;
    tooltip: string;
    isActive: boolean;
  }[];
  
  // ===== 侧边栏状态 (UI 友好) =====
  sidebar: {
    isVisible: boolean;
    width: number;
    activeTab: string;
    availableTabs: { id: string; label: string; icon: string }[];
  };
  
  // ===== 布局配置 (UI 友好) =====
  layout: {
    mode: 'editor' | 'preview' | 'split-h' | 'split-v';
    sidebarWidth: number;
    editorWidth: number;
    previewWidth: number;
    isPreviewVisible: boolean;
  };
  
  // ===== 编辑器设置 (UI 简化) =====
  settings: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  
  // ===== UI 状态 =====
  hasUnsavedChanges: boolean;
  dirtyCount: number; // 未保存文档数
  isSearching: boolean;
  searchResultCount: number;
  
  // ===== 统计信息 =====
  stats: {
    totalDocuments: number;
    openDocumentCount: number;
    recentDocuments: number;
  };
  
  // ===== 时间戳 (epoch ms) =====
  lastAccessedAt?: number | null;
  createdAt: number;
  
  // ===== UI 业务方法 =====
  
  // 文档操作
  getActiveDocument(): string | null;
  getDocumentTitle(uuid: string): string;
  getDocumentIcon(uuid: string): string;
  canCloseDocument(uuid: string): boolean;
  
  // 布局操作
  toggleViewMode(): void; // 切换编辑/预览/分屏
  resetLayout(): void;
  maximizeEditor(): void;
  
  // 快捷键
  saveAll(): void;
  closeAll(): void;
  navigateNext(): void;
  navigatePrevious(): void;
  
  // UI 辅助
  getStatusBarText(): string;
  getWindowTitle(): string;
  
  // DTO 转换
  toServerDTO(): EditorWorkspaceServerDTO;
}
```

---

## 2. Document (实体)

### 业务描述
文档是编辑器中的核心内容单元，支持多种格式、版本控制、元数据管理。

### Server 接口

```typescript
export interface DocumentServer {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  relativePath: string;
  fileName: string;
  title: string;
  format: 'markdown' | 'plaintext' | 'html' | 'json' | 'typescript' | 'javascript';
  
  // ===== 内容 =====
  content: string;
  originalContent?: string; // 用于 diff
  
  // ===== 元数据 =====
  metadata: {
    tags: string[];
    category?: string;
    wordCount?: number;
    characterCount?: number;
    readingTime?: number; // seconds
    lastSavedAt?: Date | null;
    isReadOnly?: boolean;
    encoding?: string;
    language?: string;
    [key: string]: any;
  };
  
  // ===== 关联资源 =====
  resources: {
    uuid: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'archive';
    relativePath: string;
    size: number;
    mimeType?: string;
    thumbnailPath?: string;
  }[];
  
  // ===== 版本信息 =====
  version: number;
  versions?: string[]; // DocumentVersion uuids
  
  // ===== 状态 =====
  isDirty: boolean;
  isLocked: boolean;
  lockOwner?: string | null;
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  lastSavedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 内容操作
  updateContent(content: string): void;
  insertAt(position: number, text: string): void;
  deleteRange(start: number, end: number): void;
  replaceRange(start: number, end: number, text: string): void;
  
  // 保存操作
  save(): Promise<void>;
  saveAs(newPath: string): Promise<DocumentServer>;
  autoSave(): Promise<void>;
  
  // 元数据管理
  updateMetadata(metadata: Partial<DocumentServer['metadata']>): void;
  addTags(tags: string[]): void;
  removeTags(tags: string[]): void;
  calculateStats(): void; // 计算字数、阅读时间等
  
  // 资源管理
  addResource(resource: DocumentServer['resources'][0]): void;
  removeResource(resourceUuid: string): void;
  getResources(): DocumentServer['resources'];
  
  // 版本控制
  createVersion(description?: string): Promise<DocumentVersionServer>;
  getVersions(): Promise<DocumentVersionServer[]>;
  revertToVersion(versionNumber: number): Promise<void>;
  compareVersions(v1: number, v2: number): Promise<VersionDiff>;
  
  // 锁定机制
  lock(owner: string): void;
  unlock(): void;
  isLockedBy(owner: string): boolean;
  
  // 内容转换
  convertTo(format: DocumentServer['format']): Promise<string>;
  exportAs(format: 'pdf' | 'docx' | 'html'): Promise<Uint8Array>;
  
  // 搜索
  search(query: string | RegExp): SearchMatch[];
  replace(query: string | RegExp, replacement: string): number;
  
  // DTO 转换
  toServerDTO(): DocumentServerDTO;
  toClientDTO(): DocumentClientDTO;
  toPersistenceDTO(): DocumentPersistenceDTO;
}

interface SearchMatch {
  start: number;
  end: number;
  line: number;
  column: number;
  text: string;
  context: string;
}

interface VersionDiff {
  additions: number;
  deletions: number;
  changes: {
    type: 'add' | 'delete' | 'modify';
    line: number;
    oldText?: string;
    newText?: string;
  }[];
}
```

### Client 接口

```typescript
export interface DocumentClient {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  relativePath: string;
  fileName: string;
  title: string;
  format: string;
  
  // ===== 内容 (可能不包含完整内容) =====
  content?: string | null;
  previewText?: string | null; // 前 200 字
  
  // ===== 元数据 (UI 友好) =====
  tags: string[];
  category?: string | null;
  wordCount?: number;
  wordCountFormatted?: string; // "1,234 words"
  readingTime?: number; // minutes
  readingTimeFormatted?: string; // "5 min read"
  
  // ===== UI 辅助 =====
  icon: string;
  language: string; // 语法高亮语言
  isReadOnly: boolean;
  
  // ===== 状态 =====
  isDirty: boolean;
  isLocked: boolean;
  lockOwner?: string | null;
  canEdit: boolean;
  canSave: boolean;
  
  // ===== 统计信息 =====
  version: number;
  versionCount: number;
  resourceCount: number;
  size: number;
  sizeFormatted: string; // "15 KB"
  
  // ===== 时间戳 (epoch ms) =====
  createdAt: number;
  updatedAt: number;
  lastSavedAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getFormatIcon(): string;
  getBreadcrumbs(): { label: string; path: string }[];
  
  // 操作判断
  hasUnsavedChanges(): boolean;
  canRevert(): boolean;
  canExport(): boolean;
  isExpired(): boolean;
  
  // 快捷操作
  copyPath(): void;
  copyTitle(): void;
  openInFolder(): void;
  showHistory(): void;
  
  // 内容预览
  getPreview(length?: number): string;
  getOutline(): OutlineItem[];
  
  // DTO 转换
  toServerDTO(): DocumentServerDTO;
}

interface OutlineItem {
  level: number;
  title: string;
  line: number;
  children?: OutlineItem[];
}
```

---

## 3. DocumentVersion (实体)

### 业务描述
文档版本记录文档的历史变更，支持 diff 和回滚。

### Server 接口

```typescript
export interface DocumentVersionServer {
  // ===== 基础属性 =====
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  
  // ===== 内容 =====
  content: string;
  changeSet?: {
    type: 'insert' | 'delete' | 'replace';
    position: { line: number; column: number; offset: number };
    length: number;
    oldText: string;
    newText: string;
    timestamp: Date;
  }[];
  
  // ===== 元数据 =====
  author: string;
  description?: string | null;
  tags?: string[];
  
  // ===== 统计 =====
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
    totalChanges: number;
  };
  
  // ===== 时间戳 =====
  createdAt: Date;
  
  // ===== 业务方法 =====
  
  // 版本操作
  diff(other: DocumentVersionServer): VersionDiff;
  restore(): Promise<DocumentServer>;
  
  // 变更分析
  getChangesByType(type: 'insert' | 'delete' | 'replace'): any[];
  getChangesByLine(line: number): any[];
  
  // 查询
  getDocument(): Promise<DocumentServer>;
  getPreviousVersion(): Promise<DocumentVersionServer | null>;
  getNextVersion(): Promise<DocumentVersionServer | null>;
  
  // DTO 转换
  toServerDTO(): DocumentVersionServerDTO;
  toClientDTO(): DocumentVersionClientDTO;
  toPersistenceDTO(): DocumentVersionPersistenceDTO;
}
```

### Client 接口

```typescript
export interface DocumentVersionClient {
  // ===== 基础属性 =====
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  
  // ===== 元数据 =====
  author: string;
  authorAvatar?: string;
  description?: string | null;
  
  // ===== 统计 (UI 友好) =====
  changeCount: number;
  changeSummary: string; // "+120 / -45 / ~30"
  additions: number;
  deletions: number;
  
  // ===== UI 辅助 =====
  isCurrent: boolean; // 是否为当前版本
  canRestore: boolean;
  
  // ===== 时间戳 (epoch ms) =====
  createdAt: number;
  timeAgo: string; // "2 hours ago"
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getVersionLabel(): string; // "v1.0.3"
  getAuthorDisplay(): string;
  getChangeBadge(): { text: string; color: string };
  
  // 操作
  view(): void; // 查看该版本内容
  compare(other: DocumentVersionClient): void;
  restore(): void;
  
  // DTO 转换
  toServerDTO(): DocumentVersionServerDTO;
}
```

---

## 4. EditorSession (聚合根)

### 业务描述
编辑器会话管理用户的编辑状态，支持多窗口、分组、标签页。

### Server 接口

```typescript
export interface EditorSessionServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  
  // ===== 分组与标签 =====
  groups: string[]; // EditorGroup uuids
  activeGroupId?: string | null;
  
  // ===== 布局 =====
  layoutId?: string | null;
  layout?: {
    orientation: 'horizontal' | 'vertical';
    sizes: number[];
  };
  
  // ===== 自动保存 =====
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  lastSavedAt?: Date | null;
  
  // ===== 状态 =====
  isActive: boolean;
  isPinned: boolean;
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 分组管理
  addGroup(group: EditorGroupServer): void;
  removeGroup(groupUuid: string): void;
  getGroup(groupUuid: string): EditorGroupServer | null;
  getGroups(): EditorGroupServer[];
  setActiveGroup(groupUuid: string): void;
  
  // 布局管理
  updateLayout(layout: Partial<EditorSessionServer['layout']>): void;
  splitHorizontal(): void;
  splitVertical(): void;
  mergeSplits(): void;
  
  // 自动保存
  enableAutoSave(interval: number): void;
  disableAutoSave(): void;
  triggerAutoSave(): Promise<void>;
  
  // 会话管理
  activate(): void;
  deactivate(): void;
  pin(): void;
  unpin(): void;
  
  // 保存与恢复
  save(): Promise<void>;
  restore(): Promise<void>;
  
  // 统计
  getTotalTabCount(): number;
  getDirtyTabCount(): number;
  
  // DTO 转换
  toServerDTO(): EditorSessionServerDTO;
  toClientDTO(): EditorSessionClientDTO;
  toPersistenceDTO(): EditorSessionPersistenceDTO;
}
```

### Client 接口

```typescript
export interface EditorSessionClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  
  // ===== 分组 (UI 优化) =====
  groups: {
    uuid: string;
    title: string;
    tabCount: number;
    isActive: boolean;
  }[];
  activeGroupId?: string | null;
  
  // ===== 布局 (UI 友好) =====
  layout: {
    mode: 'single' | 'split-h' | 'split-v' | 'grid';
    sizes: number[];
  };
  
  // ===== 状态 =====
  isActive: boolean;
  isPinned: boolean;
  hasUnsavedChanges: boolean;
  
  // ===== 统计 =====
  stats: {
    totalGroups: number;
    totalTabs: number;
    dirtyTabs: number;
  };
  
  // ===== 自动保存 =====
  autoSave: boolean;
  autoSaveInterval: number;
  autoSaveStatus: 'idle' | 'saving' | 'error';
  
  // ===== 时间戳 (epoch ms) =====
  lastSavedAt?: number | null;
  lastAccessedAt?: number | null;
  createdAt: number;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getStatusBadge(): { text: string; color: string };
  getGroupLabel(groupUuid: string): string;
  
  // 操作判断
  canSplit(): boolean;
  canMerge(): boolean;
  canClose(): boolean;
  
  // 快捷操作
  saveAll(): void;
  closeAll(): void;
  toggleAutoSave(): void;
  
  // DTO 转换
  toServerDTO(): EditorSessionServerDTO;
}
```

---

## 5. EditorGroup (实体)

### 业务描述
编辑器分组包含多个标签页，支持独立的布局和状态。

### Server 接口

```typescript
export interface EditorGroupServer {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string;
  title?: string | null;
  order: number;
  
  // ===== 标签页 =====
  tabs: string[]; // EditorTab uuids
  activeTabId?: string | null;
  
  // ===== 尺寸与位置 =====
  width: number;
  height?: number | null;
  x?: number;
  y?: number;
  
  // ===== 状态 =====
  isMaximized: boolean;
  isMinimized: boolean;
  
  // ===== 时间戳 =====
  lastAccessedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // ===== 业务方法 =====
  
  // 标签页管理
  addTab(tab: EditorTabServer): void;
  removeTab(tabUuid: string): void;
  getTab(tabUuid: string): EditorTabServer | null;
  getTabs(): EditorTabServer[];
  setActiveTab(tabUuid: string): void;
  moveTab(tabUuid: string, newIndex: number): void;
  
  // 标签页导航
  nextTab(): void;
  previousTab(): void;
  firstTab(): void;
  lastTab(): void;
  
  // 布局操作
  resize(width: number, height?: number): void;
  maximize(): void;
  minimize(): void;
  restore(): void;
  
  // 批量操作
  closeAllTabs(): void;
  closeOtherTabs(tabUuid: string): void;
  closeTabsToRight(tabUuid: string): void;
  
  // 统计
  getTabCount(): number;
  getDirtyTabCount(): number;
  
  // DTO 转换
  toServerDTO(): EditorGroupServerDTO;
  toClientDTO(): EditorGroupClientDTO;
  toPersistenceDTO(): EditorGroupPersistenceDTO;
}
```

### Client 接口

```typescript
export interface EditorGroupClient {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string;
  title?: string | null;
  order: number;
  
  // ===== 标签页 (UI 优化) =====
  tabs: {
    uuid: string;
    title: string;
    icon: string;
    isDirty: boolean;
    isActive: boolean;
    isPreview: boolean;
  }[];
  activeTabId?: string | null;
  
  // ===== 尺寸 =====
  width: number;
  height?: number | null;
  
  // ===== 状态 =====
  isMaximized: boolean;
  isActive: boolean; // 是否为激活的分组
  hasUnsavedChanges: boolean;
  
  // ===== 统计 =====
  tabCount: number;
  dirtyTabCount: number;
  
  // ===== 时间戳 (epoch ms) =====
  lastAccessedAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayTitle(): string;
  getTabTitle(tabUuid: string): string;
  getTabIcon(tabUuid: string): string;
  
  // 操作判断
  canClose(): boolean;
  canMaximize(): boolean;
  canAddTab(): boolean;
  
  // 快捷操作
  closeAllTabs(): void;
  saveAllTabs(): void;
  
  // DTO 转换
  toServerDTO(): EditorGroupServerDTO;
}
```

---

## 6. EditorTab (实体)

### 业务描述
编辑器标签页表示一个打开的文档或视图。

### Server 接口

```typescript
export interface EditorTabServer {
  // ===== 基础属性 =====
  uuid: string;
  groupUuid: string;
  title: string;
  path: string; // 文档路径或标识
  
  // ===== 类型与状态 =====
  type: 'document' | 'preview' | 'diff' | 'settings';
  isPreview?: boolean; // 预览标签（单击打开）
  isPinned?: boolean;
  
  // ===== 文件信息 =====
  fileType?: string | null;
  encoding?: string;
  language?: string;
  
  // ===== 编辑状态 =====
  isDirty?: boolean;
  content?: string | null;
  originalContent?: string | null;
  
  // ===== 光标与滚动 =====
  cursorPosition?: {
    line: number;
    column: number;
    offset: number;
  };
  scrollPosition?: {
    x: number;
    y: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  
  // ===== 时间戳 =====
  lastModified?: Date | null;
  lastAccessedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // ===== 业务方法 =====
  
  // 状态管理
  markDirty(): void;
  markClean(): void;
  pin(): void;
  unpin(): void;
  promoteFromPreview(): void; // 预览标签转正式标签
  
  // 内容操作
  updateContent(content: string): void;
  save(): Promise<void>;
  reload(): Promise<void>;
  
  // 光标与选择
  setCursorPosition(line: number, column: number): void;
  setScrollPosition(x: number, y: number): void;
  updateSelection(start: any, end: any): void;
  
  // 查询
  getDocument(): Promise<DocumentServer | null>;
  hasUnsavedChanges(): boolean;
  
  // DTO 转换
  toServerDTO(): EditorTabServerDTO;
  toClientDTO(): EditorTabClientDTO;
  toPersistenceDTO(): EditorTabPersistenceDTO;
}
```

### Client 接口

```typescript
export interface EditorTabClient {
  // ===== 基础属性 =====
  uuid: string;
  groupUuid: string;
  title: string;
  path: string;
  
  // ===== UI 属性 =====
  icon: string;
  tooltip: string;
  
  // ===== 类型与状态 =====
  type: string;
  isPreview: boolean;
  isPinned: boolean;
  isDirty: boolean;
  isActive: boolean;
  
  // ===== 文件信息 =====
  fileType?: string | null;
  language?: string | null;
  
  // ===== 统计 =====
  lineCount?: number;
  wordCount?: number;
  
  // ===== 时间戳 (epoch ms) =====
  lastModified?: number | null;
  lastAccessedAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayTitle(): string;
  getIcon(): string;
  getTooltip(): string;
  getStatusBadge(): { text: string; color: string } | null;
  
  // 操作判断
  canClose(): boolean;
  canSave(): boolean;
  canPin(): boolean;
  
  // 快捷操作
  close(): void;
  save(): void;
  pin(): void;
  duplicate(): void;
  
  // DTO 转换
  toServerDTO(): EditorTabServerDTO;
}
```

---

## 7. SearchEngine (实体)

### 业务描述
搜索引擎负责全文搜索、索引管理、结果排序等。

### Server 接口

```typescript
export interface SearchEngineServer {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  
  // ===== 索引状态 =====
  indexStatus: {
    isBuilding: boolean;
    lastBuiltAt?: Date | null;
    indexedFileCount: number;
    totalFileCount: number;
    progress?: number; // 0-100
  };
  
  // ===== 搜索历史 =====
  recentQueries: {
    query: string;
    type: 'fulltext' | 'regex' | 'tag' | 'filename';
    timestamp: Date;
    resultCount: number;
  }[];
  
  // ===== 配置 =====
  config: {
    maxResults: number;
    fuzzySearch: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
    excludePatterns: string[];
  };
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  
  // ===== 业务方法 =====
  
  // 索引管理
  buildIndex(): Promise<void>;
  rebuildIndex(): Promise<void>;
  updateIndex(files: string[]): Promise<void>;
  clearIndex(): void;
  
  // 搜索操作
  search(query: string, type: 'fulltext' | 'regex' | 'tag' | 'filename', options?: SearchOptions): Promise<SearchResult[]>;
  searchInFile(fileUuid: string, query: string): Promise<SearchMatch[]>;
  
  // 搜索优化
  suggestCorrection(query: string): string[];
  getRelatedQueries(query: string): string[];
  
  // 历史管理
  addToHistory(query: string, type: string, resultCount: number): void;
  clearHistory(): void;
  getPopularQueries(limit: number): string[];
  
  // 配置管理
  updateConfig(config: Partial<SearchEngineServer['config']>): void;
  
  // 统计
  getIndexStats(): {
    totalDocuments: number;
    totalWords: number;
    indexSize: number;
    lastUpdated: Date;
  };
  
  // DTO 转换
  toServerDTO(): SearchEngineServerDTO;
  toClientDTO(): SearchEngineClientDTO;
  toPersistenceDTO(): SearchEnginePersistenceDTO;
}

interface SearchOptions {
  maxResults?: number;
  fuzzy?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  scope?: {
    paths?: string[];
    fileTypes?: string[];
    tags?: string[];
  };
  sortBy?: 'relevance' | 'date' | 'name';
}

interface SearchResult {
  documentUuid: string;
  title: string;
  path: string;
  score: number;
  matches: SearchMatch[];
  preview: string;
}
```

### Client 接口

```typescript
export interface SearchEngineClient {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  
  // ===== 搜索状态 =====
  isSearching: boolean;
  currentQuery?: string | null;
  resultCount: number;
  
  // ===== 索引状态 (UI 友好) =====
  indexStatus: {
    isBuilding: boolean;
    progress: number; // 0-100
    statusText: string; // "Indexing 45/100 files..."
    lastBuiltAt?: number | null; // epoch ms
  };
  
  // ===== 搜索历史 (UI 优化) =====
  recentQueries: {
    query: string;
    type: string;
    resultCount: number;
    timeAgo: string; // "2 hours ago"
  }[];
  
  // ===== 配置 (UI 简化) =====
  config: {
    maxResults: number;
    fuzzySearch: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
  };
  
  // ===== 统计 =====
  stats: {
    indexedDocuments: number;
    totalDocuments: number;
    indexProgress: number; // 0-100
  };
  
  // ===== UI 业务方法 =====
  
  // 搜索操作
  quickSearch(query: string): void;
  advancedSearch(options: any): void;
  clearResults(): void;
  
  // UI 辅助
  getSuggestions(query: string): string[];
  getQueryHighlight(query: string): any;
  
  // 历史操作
  selectRecentQuery(query: string): void;
  removeFromHistory(query: string): void;
  
  // 格式化展示
  getProgressText(): string;
  getResultSummary(): string; // "Found 123 results in 45ms"
  
  // DTO 转换
  toServerDTO(): SearchEngineServerDTO;
}
```

---

## 8. LinkedResource (实体)

### 业务描述
文档中引用的外部资源（图片、视频等）。

### Server 接口

```typescript
export interface LinkedResourceServer {
  // ===== 基础属性 =====
  uuid: string;
  documentUuid: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive';
  relativePath: string;
  
  // ===== 文件信息 =====
  size: number;
  mimeType?: string | null;
  encoding?: string;
  
  // ===== 元数据 =====
  thumbnailPath?: string | null;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // 音视频时长（秒）
    bitrate?: number;
    [key: string]: any;
  };
  
  // ===== 状态 =====
  isEmbedded: boolean; // 是否嵌入文档
  isExternal: boolean; // 是否为外部链接
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 资源操作
  load(): Promise<Uint8Array>;
  generateThumbnail(): Promise<string>;
  getUrl(): string;
  
  // 元数据管理
  updateMetadata(metadata: any): void;
  extractMetadata(): Promise<void>;
  
  // 查询
  getDocument(): Promise<DocumentServer>;
  isValid(): Promise<boolean>;
  
  // DTO 转换
  toServerDTO(): LinkedResourceServerDTO;
  toClientDTO(): LinkedResourceClientDTO;
  toPersistenceDTO(): LinkedResourcePersistenceDTO;
}
```

### Client 接口

```typescript
export interface LinkedResourceClient {
  // ===== 基础属性 =====
  uuid: string;
  documentUuid: string;
  type: string;
  relativePath: string;
  
  // ===== 文件信息 =====
  size: number;
  sizeFormatted: string;
  mimeType?: string | null;
  
  // ===== UI 属性 =====
  url: string;
  thumbnailUrl?: string | null;
  icon: string;
  
  // ===== 元数据 (UI 友好) =====
  dimensions?: string | null; // "1920x1080"
  duration?: string | null; // "3:45"
  
  // ===== 状态 =====
  isLoaded: boolean;
  isEmbedded: boolean;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getTypeIcon(): string;
  getPreviewUrl(): string;
  
  // 操作
  view(): void;
  download(): void;
  copyUrl(): void;
  
  // DTO 转换
  toServerDTO(): LinkedResourceServerDTO;
}
```

---

## 值对象 (Value Objects)

### Position
```typescript
export interface Position {
  line: number;
  column: number;
  offset: number;
}
```

### CursorPosition
```typescript
export interface CursorPosition {
  position: Position;
  isActive: boolean;
}
```

### ScrollPosition
```typescript
export interface ScrollPosition {
  x: number;
  y: number;
}
```

### TextSelection
```typescript
export interface TextSelection {
  start: Position;
  end: Position;
  direction?: 'forward' | 'backward' | 'none';
}
```

### DocumentMetadata
```typescript
export interface DocumentMetadata {
  tags: string[];
  category?: string;
  wordCount?: number;
  characterCount?: number;
  readingTime?: number;
  lastSavedAt?: Date | null;
  isReadOnly?: boolean;
  encoding?: string;
  language?: string;
  [key: string]: any;
}
```

### WorkspaceLayout
```typescript
export interface WorkspaceLayout {
  sidebarWidth: number;
  editorWidth: number;
  previewWidth: number;
  isPreviewVisible: boolean;
  panelSizes?: { sidebar?: number; editor?: number; preview?: number };
  viewMode: 'editor' | 'preview' | 'split-h' | 'split-v';
}
```

### EditorSettings
```typescript
export interface EditorSettings {
  theme?: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  tabSize?: number;
  wordWrap?: boolean;
  lineNumbers?: boolean;
  minimap?: boolean;
  autoSave?: { enabled: boolean; interval: number };
}
```

---

## 总结

### 聚合根
- **EditorWorkspace**: 编辑器工作区
- **EditorSession**: 编辑器会话

### 实体
- **Document**: 文档
- **DocumentVersion**: 文档版本
- **EditorGroup**: 编辑器分组
- **EditorTab**: 编辑器标签页
- **SearchEngine**: 搜索引擎
- **LinkedResource**: 关联资源

### 值对象
- Position
- CursorPosition
- ScrollPosition
- TextSelection
- DocumentMetadata
- WorkspaceLayout
- EditorSettings

### 关键设计原则
1. **Server 侧重业务逻辑**: 完整的内容操作、版本控制、搜索功能
2. **Client 侧重 UI 展示**: 格式化文本、快捷操作、状态展示
3. **时间戳统一**: Server 用 Date，Client 用 epoch ms
4. **统计信息**: Client 包含更多 UI 友好的统计和格式化数据
5. **状态管理**: Client 包含 UI 相关的状态（激活、展开、锁定等）
