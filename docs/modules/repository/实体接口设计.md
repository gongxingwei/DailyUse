# Repository 模块实体设计

## 模块概述

Repository 模块负责管理用户的知识仓库，包括仓库本身、资源文件、资源引用关系、关联内容等。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)
- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`
- 📖 详见: `docs/TIMESTAMP_DESIGN_DECISION.md`

### 完整的双向转换方法
- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`
- 📖 详见: `docs/ENTITY_DTO_CONVERSION_SPEC.md`

## 领域模型层次

```
Repository (聚合根)
├── Resource (实体)
│   ├── ResourceReference (实体)
│   └── LinkedContent (实体)
└── RepositoryExplorer (实体 - 文件树浏览)
```

---

## 1. Repository (聚合根)

### 业务描述
仓库是用户组织和管理知识资源的顶层容器，支持本地、远程和同步模式。

### Server 接口

```typescript
export interface RepositoryServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  type: 'LOCAL' | 'REMOTE' | 'SYNCHRONIZED';
  path: string; // 绝对路径
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SYNCING';
  
  // ===== 配置 =====
  config: {
    enableGit: boolean;
    autoSync: boolean;
    syncInterval?: number;
    defaultLinkedDocName: string;
    supportedFileTypes: string[];
    maxFileSize: number; // bytes
    enableVersionControl: boolean;
  };
  
  // ===== 关联数据 =====
  relatedGoals?: string[]; // goal uuids
  git?: {
    isGitRepo: boolean;
    currentBranch?: string;
    hasChanges?: boolean;
    remoteUrl?: string;
  } | null;
  
  // ===== 统计信息 =====
  stats: {
    totalResources: number;
    totalSize: number; // bytes
    resourcesByType: Record<string, number>;
    favoriteResources: number;
    lastUpdated: number; // epoch ms
  };
  
  // ===== 同步状态 =====
  syncStatus?: {
    isSyncing: boolean;
    lastSyncAt?: number; // epoch ms
    syncError?: string;
    pendingSyncCount: number;
    conflictCount: number;
  } | null;
  
  // ===== 时间戳 (统一使用 number epoch ms) =====
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ===== 业务方法 =====
  
  // 仓库操作
  activate(): void;
  deactivate(): void;
  archive(): void;
  updateConfig(config: Partial<RepositoryServer['config']>): void;
  
  // 资源管理
  addResource(resource: ResourceServer): void;
  removeResource(resourceUuid: string): void;
  getResource(resourceUuid: string): ResourceServer | null;
  listResources(filters?: ResourceFilters): ResourceServer[];
  
  // 同步操作
  startSync(): Promise<void>;
  stopSync(): void;
  resolveConflict(resourceUuid: string, resolution: 'local' | 'remote'): Promise<void>;
  
  // Git 操作 (if enabled)
  initGit?(): Promise<void>;
  gitStatus?(): Promise<GitStatusInfo>;
  gitCommit?(message: string, files?: string[]): Promise<void>;
  gitPull?(): Promise<void>;
  gitPush?(): Promise<void>;
  
  // 统计查询
  calculateStats(): void;
  getResourcesByType(type: string): ResourceServer[];
  getFavorites(): ResourceServer[];
  
  // 导出操作
  exportToArchive(targetPath: string): Promise<void>;
  exportResources(resourceUuids: string[], format: 'zip' | 'tar'): Promise<Uint8Array>;
  
  // ===== DTO 转换方法 (To) =====
  toServerDTO(): RepositoryServerDTO;
  toClientDTO(): RepositoryClientDTO;
  toPersistenceDTO(): RepositoryPersistenceDTO;
  
  // ===== DTO 转换方法 (From - 静态工厂方法) =====
  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;
  fromClientDTO(dto: RepositoryClientDTO): RepositoryServer;
  fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
}

interface ResourceFilters {
  type?: string[];
  tags?: string[];
  status?: string;
  keyword?: string;
  dateRange?: { start: number; end: number }; // epoch ms
}

interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  conflicted: string[];
}
```

### Client 接口

```typescript
export interface RepositoryClient {
  // ===== 基础属性 (同 Server) =====
  uuid: string;
  accountUuid: string;
  name: string;
  type: 'LOCAL' | 'REMOTE' | 'SYNCHRONIZED';
  path: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SYNCING';
  
  // ===== 配置 (简化) =====
  config?: {
    enableGit: boolean;
    autoSync: boolean;
    supportedFileTypes: string[];
  } | null;
  
  // ===== 统计信息 (UI 友好) =====
  stats: {
    totalResources: number;
    totalSize: number;
    totalSizeFormatted: string; // "1.5 GB"
    favoriteCount: number;
    recentCount: number; // 最近修改的数量
  };
  
  // ===== 同步状态 (简化) =====
  isSyncing: boolean;
  syncError?: string | null;
  lastSyncAt?: number | null; // epoch ms
  
  // ===== 时间戳 (epoch ms) =====
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ===== UI 辅助属性 =====
  isActive: boolean; // 当前是否激活
  hasUnreadChanges: boolean; // 是否有未读变更
  recentResources?: ResourceClientSummary[]; // 最近的资源列表
  icon?: string; // 图标 URL
  color?: string; // 主题色
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getStatusText(): string;
  getStatusColor(): string;
  getSizeFormatted(): string;
  
  // 操作判断
  canSync(): boolean;
  canExport(): boolean;
  canDelete(): boolean;
  
  // 快捷操作
  openInExplorer(): void;
  copyPathToClipboard(): void;
  
  // DTO 转换
  toServerDTO(): RepositoryServerDTO;
}

interface ResourceClientSummary {
  uuid: string;
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  lastModified: number; // epoch ms
}
```

---

## 2. Resource (实体)

### 业务描述
资源是仓库中的文件或内容单元，包含元数据、标签、版本等信息。

### Server 接口

```typescript
export interface ResourceServer {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: 'markdown' | 'image' | 'video' | 'audio' | 'pdf' | 'link' | 'code' | 'other';
  relativePath: string; // 相对于仓库根目录
  absolutePath: string; // 计算得出的绝对路径
  size: number; // bytes
  status: 'active' | 'archived' | 'deleted' | 'draft';
  
  // ===== 内容元数据 =====
  description?: string | null;
  author?: string | null;
  version?: string | null;
  tags: string[];
  category?: string | null;
  
  // ===== 扩展元数据 =====
  metadata: {
    mimeType?: string;
    encoding?: string;
    thumbnailPath?: string;
    isFavorite: boolean;
    accessCount: number;
    lastAccessedAt?: Date;
    checksum?: string; // 文件校验和
    [key: string]: any;
  };
  
  // ===== 关联数据 =====
  references: string[]; // ResourceReference uuids
  linkedContents: string[]; // LinkedContent uuids
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  modifiedAt?: Date | null; // 文件系统修改时间
  
  // ===== 业务方法 =====
  
  // 状态管理
  activate(): void;
  archive(): void;
  delete(): void;
  restore(): void;
  
  // 内容操作
  updateContent(content: string | Uint8Array): Promise<void>;
  readContent(): Promise<string | Uint8Array>;
  move(newPath: string): Promise<void>;
  rename(newName: string): Promise<void>;
  copy(targetPath: string): Promise<ResourceServer>;
  
  // 元数据管理
  addTags(tags: string[]): void;
  removeTags(tags: string[]): void;
  updateMetadata(metadata: Partial<ResourceServer['metadata']>): void;
  toggleFavorite(): void;
  
  // 引用管理
  addReference(targetResourceUuid: string, type: 'link' | 'embed' | 'related'): void;
  removeReference(referenceUuid: string): void;
  getReferences(): ResourceReferenceServer[];
  
  // 关联内容管理
  addLinkedContent(content: LinkedContentServer): void;
  removeLinkedContent(contentUuid: string): void;
  getLinkedContents(): LinkedContentServer[];
  
  // 统计与查询
  incrementAccessCount(): void;
  calculateChecksum(): Promise<string>;
  isStale(threshold: number): boolean; // 检查是否过期（多少天未访问）
  
  // 导出与分享
  exportAs(format: string): Promise<Uint8Array>;
  generateShareLink(expiresIn?: number): Promise<string>;
  
  // DTO 转换
  toServerDTO(): ResourceServerDTO;
  toClientDTO(): ResourceClientDTO;
  toPersistenceDTO(): ResourcePersistenceDTO;
}
```

### Client 接口

```typescript
export interface ResourceClient {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: string;
  relativePath: string;
  size: number;
  sizeFormatted: string; // "1.5 MB"
  status: string;
  
  // ===== 内容元数据 =====
  description?: string | null;
  author?: string | null;
  tags: string[];
  category?: string | null;
  
  // ===== UI 辅助属性 =====
  icon: string; // 图标名或 URL
  preview?: string | null; // 预览文本或缩略图 URL
  isFavorite: boolean;
  isRecent: boolean; // 最近访问过
  
  // ===== 统计信息 =====
  accessCount: number;
  referenceCount: number; // 被引用次数
  linkedContentCount: number; // 关联内容数量
  
  // ===== 时间戳 (epoch ms) =====
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayName(): string;
  getTypeIcon(): string;
  getTypeColor(): string;
  getStatusBadge(): { text: string; color: string };
  getPreviewUrl(): string | null;
  
  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;
  canShare(): boolean;
  isExpired(): boolean;
  
  // 快捷操作
  openInEditor(): void;
  openInSystem(): void;
  copyLink(): void;
  download(): void;
  
  // DTO 转换
  toServerDTO(): ResourceServerDTO;
}
```

---

## 3. ResourceReference (实体)

### 业务描述
资源引用表示资源之间的关联关系（引用、嵌入、相关等）。

### Server 接口

```typescript
export interface ResourceReferenceServer {
  // ===== 基础属性 =====
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: 'link' | 'embed' | 'related' | 'dependency';
  description?: string | null;
  
  // ===== 引用元数据 =====
  metadata?: {
    anchorText?: string; // 引用时的锚文本
    position?: { line: number; column: number }; // 在源文件中的位置
    context?: string; // 引用上下文
  } | null;
  
  // ===== 状态 =====
  isValid: boolean; // 目标资源是否存在
  isBroken: boolean; // 是否为断链
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt?: Date | null;
  lastVerifiedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 引用验证
  verify(): Promise<boolean>;
  repair(): Promise<void>; // 尝试修复断链
  
  // 引用更新
  updateTarget(newTargetUuid: string): void;
  updateMetadata(metadata: Partial<ResourceReferenceServer['metadata']>): void;
  
  // 查询
  getSourceResource(): Promise<ResourceServer>;
  getTargetResource(): Promise<ResourceServer>;
  
  // DTO 转换
  toServerDTO(): ResourceReferenceServerDTO;
  toClientDTO(): ResourceReferenceClientDTO;
  toPersistenceDTO(): ResourceReferencePersistenceDTO;
}
```

### Client 接口

```typescript
export interface ResourceReferenceClient {
  // ===== 基础属性 =====
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: string;
  description?: string | null;
  
  // ===== 引用信息 =====
  sourceName: string; // 源资源名称
  targetName: string; // 目标资源名称
  anchorText?: string | null;
  
  // ===== 状态 =====
  isValid: boolean;
  isBroken: boolean;
  statusText: string; // "有效" / "断链"
  statusColor: string;
  
  // ===== 时间戳 (epoch ms) =====
  createdAt: number;
  lastVerifiedAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  getTypeIcon(): string;
  getTypeText(): string;
  
  // 操作
  navigate(): void; // 跳转到目标资源
  remove(): void;
  
  // DTO 转换
  toServerDTO(): ResourceReferenceServerDTO;
}
```

---

## 4. LinkedContent (实体)

### 业务描述
关联内容表示外部链接或嵌入内容（如网页、视频等）。

### Server 接口

```typescript
export interface LinkedContentServer {
  // ===== 基础属性 =====
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: 'article' | 'video' | 'image' | 'document' | 'other';
  
  // ===== 内容元数据 =====
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  publishedAt?: Date | null;
  
  // ===== 状态 =====
  isAccessible: boolean; // URL 是否可访问
  httpStatus?: number | null; // 最后一次检查的 HTTP 状态码
  lastCheckedAt?: Date | null;
  checkError?: string | null;
  
  // ===== 缓存数据 =====
  cachedContent?: string | null; // 缓存的内容（可选）
  cachedAt?: Date | null;
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt?: Date | null;
  
  // ===== 业务方法 =====
  
  // 可访问性检查
  checkAccessibility(): Promise<boolean>;
  updateAccessStatus(status: boolean, httpStatus?: number, error?: string): void;
  
  // 内容操作
  fetchContent(): Promise<string>;
  cacheContent(content: string): void;
  clearCache(): void;
  
  // 元数据更新
  updateMetadata(metadata: {
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
  }): void;
  
  // 查询
  getResource(): Promise<ResourceServer>;
  isCached(): boolean;
  isStale(threshold: number): boolean; // 缓存是否过期
  
  // DTO 转换
  toServerDTO(): LinkedContentServerDTO;
  toClientDTO(): LinkedContentClientDTO;
  toPersistenceDTO(): LinkedContentPersistenceDTO;
}
```

### Client 接口

```typescript
export interface LinkedContentClient {
  // ===== 基础属性 =====
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: string;
  
  // ===== 内容元数据 =====
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  publishedAt?: number | null; // epoch ms
  
  // ===== 状态 =====
  isAccessible: boolean;
  statusText: string; // "可访问" / "不可达"
  statusColor: string;
  
  // ===== UI 辅助 =====
  icon: string;
  previewImage?: string | null;
  
  // ===== 时间戳 (epoch ms) =====
  lastCheckedAt?: number | null;
  createdAt: number;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getDisplayTitle(): string;
  getDomain(): string; // 从 URL 提取域名
  getTypeIcon(): string;
  
  // 操作
  open(): void; // 在浏览器中打开
  copyUrl(): void;
  refresh(): void; // 重新检查可访问性
  
  // DTO 转换
  toServerDTO(): LinkedContentServerDTO;
}
```

---

## 5. RepositoryExplorer (实体)

### 业务描述
仓库浏览器维护文件树结构，支持过滤、搜索和快速导航。

### Server 接口

```typescript
export interface RepositoryExplorerServer {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  rootPath: string;
  
  // ===== 文件树 =====
  fileTree: FileTreeNode;
  filteredTree?: FileTreeNode | null;
  
  // ===== 展开状态 =====
  expandedNodes: string[]; // 展开的节点路径
  selectedNodes: string[]; // 选中的节点路径
  
  // ===== 扫描状态 =====
  lastScanAt?: Date | null;
  isScanning: boolean;
  scanProgress?: {
    current: number;
    total: number;
    currentPath: string;
  } | null;
  
  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;
  
  // ===== 业务方法 =====
  
  // 扫描操作
  scan(force?: boolean): Promise<void>;
  stopScan(): void;
  rescan(): Promise<void>;
  
  // 树操作
  expandNode(path: string): void;
  collapseNode(path: string): void;
  expandAll(): void;
  collapseAll(): void;
  selectNode(path: string, multi?: boolean): void;
  
  // 过滤与搜索
  filter(pattern: string | RegExp): void;
  clearFilter(): void;
  search(keyword: string): FileTreeNode[];
  
  // 树查询
  findNode(path: string): FileTreeNode | null;
  getNodeChildren(path: string): FileTreeNode[];
  getNodeDepth(path: string): number;
  
  // 统计
  getTotalFileCount(): number;
  getTotalDirectoryCount(): number;
  getTreeDepth(): number;
  
  // DTO 转换
  toServerDTO(): RepositoryExplorerServerDTO;
  toClientDTO(): RepositoryExplorerClientDTO;
  toPersistenceDTO(): RepositoryExplorerPersistenceDTO;
}

interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
  metadata?: any;
}
```

### Client 接口

```typescript
export interface RepositoryExplorerClient {
  // ===== 基础属性 =====
  uuid: string;
  repositoryUuid: string;
  rootPath: string;
  
  // ===== 文件树 (UI 优化) =====
  fileTree: FileTreeNodeClient[];
  filteredTree?: FileTreeNodeClient[] | null;
  
  // ===== UI 状态 =====
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  activeNode?: string | null; // 当前激活节点
  
  // ===== 扫描状态 =====
  isScanning: boolean;
  scanProgress?: {
    percentage: number; // 0-100
    currentPath: string;
    statusText: string;
  } | null;
  
  // ===== 统计 =====
  stats: {
    totalFiles: number;
    totalDirectories: number;
    maxDepth: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  
  // ===== 时间戳 (epoch ms) =====
  lastScanAt?: number | null;
  
  // ===== UI 业务方法 =====
  
  // 树操作
  toggleNode(path: string): void;
  expandPath(path: string): void; // 展开到指定路径
  scrollToNode(path: string): void;
  
  // 选择操作
  selectSingle(path: string): void;
  selectMultiple(paths: string[]): void;
  selectRange(startPath: string, endPath: string): void;
  clearSelection(): void;
  
  // 搜索与过滤
  applyFilter(pattern: string): void;
  clearFilter(): void;
  highlightMatches(keyword: string): void;
  
  // 获取节点信息
  getNodeIcon(node: FileTreeNodeClient): string;
  getNodeActions(node: FileTreeNodeClient): Action[];
  
  // 导航
  navigateToParent(path: string): void;
  navigateToPath(path: string): void;
  getNodeBreadcrumbs(path: string): Breadcrumb[];
  
  // DTO 转换
  toServerDTO(): RepositoryExplorerServerDTO;
}

interface FileTreeNodeClient {
  path: string;
  name: string;
  type: 'file' | 'directory';
  icon: string;
  size?: number;
  sizeFormatted?: string;
  children?: FileTreeNodeClient[];
  isExpanded: boolean;
  isSelected: boolean;
  isHidden: boolean;
  depth: number;
}

interface Action {
  id: string;
  label: string;
  icon: string;
  handler: () => void;
}

interface Breadcrumb {
  path: string;
  label: string;
  isLast: boolean;
}
```

---

## 值对象 (Value Objects)

### GitStatusInfo
```typescript
export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  conflicted: string[];
  isClean: boolean;
}
```

### ResourceFilters
```typescript
export interface ResourceFilters {
  type?: string[];
  tags?: string[];
  status?: string;
  keyword?: string;
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
  isFavorite?: boolean;
}
```

### SyncStatus
```typescript
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: Date;
  syncError?: string;
  pendingSyncCount: number;
  conflictCount: number;
}
```

---

## 总结

### 聚合根
- **Repository**: 1 个聚合根

### 实体
- **Resource**: 资源文件
- **ResourceReference**: 资源引用关系
- **LinkedContent**: 外部关联内容
- **RepositoryExplorer**: 文件树浏览器

### 值对象
- GitStatusInfo
- ResourceFilters
- SyncStatus
- FileTreeNode

### 关键设计原则
1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: Server 用 Date，Client 用 epoch ms
4. **统计信息**: Client 包含更多预计算的统计数据和格式化字符串
5. **状态管理**: Client 包含 UI 相关的状态（展开、选中等）
