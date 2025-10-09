# Repository 与 Editor 模块设计文档

日期：2025-10-08
作者：自动生成（根据讨论）

## 目标与愿景

实现一个 Obsidian 风格的轻量资源仓库 + 编辑器（低配版），适配 Web 和未来的 Electron 桌面端。仓库支持任意嵌套的文件夹与资源（暂支持：Markdown, Image, Audio, Video）。编辑器页面包含资源浏览区（左）和编辑/预览区（右），支持 Markdown 编辑与渲染、媒体预览与资源卡片视图。


## 高层约定

- Repository.type: LOCAL | REMOTE | SYNCHRONIZED
- Resource.type: MARKDOWN | IMAGE | AUDIO | VIDEO
- `Repository.path`：仓库根路径。
  - LOCAL: 主机绝对文件路径（仅在桌面端/后端 FS 操作时有效）。
  - REMOTE: base URL（若适用）。
  - 使用时应明确语义，由 contracts 文档说明。
- `Resource.relativePath`：必须以 `/` 分隔的仓库内相对路径（例如 `notes/2025/meeting.md`）。
- `Resource.uri?`：可选字段，表示一个可直接用于前端显示/下载的 URL（http(s)/blob/预签名或 file://），Web 客户端优先使用 `uri`。

 
## Contracts（DTO 与 API 约定）

在实现中我们要明确区分三类可序列化的数据结构：

- Persistence DTO（持久化层）: 与数据库/持久化紧耦合的结构，字段名可能使用 snake_case 或包含 DB 特定字段。示例命名：`RepositoryPersistenceDTO`。
- Server DTO（服务端对内/对其他服务使用的结构）: server 内部或微服务间传递使用，类型更接近 domain 类型，例如 `RepositoryServerDTO`（包含 Date 类型或 domain-friendly 字段）。
- Client DTO（对外 API / 前端使用的结构）: 序列化友好、适用于前端消费，通常使用 ISO 字符串时间、扁平化字段，命名示例：`RepositoryClientDTO`（或 `IRepositoryClientDTO`，项目约定）。

将这三层区分清楚可以避免 domain 模型泄露到前端、方便演进与迁移（例如修改 DB schema 不影响 client DTO），并且和项目中其他模块（例如 Goal）保持一致。

下面是推荐的 DTO 与 client API 接口示例（TypeScript）：

```typescript
// Repository - Persistence layer (DB row)
export interface RepositoryPersistenceDTO {
  uuid: string;
  account_uuid: string;
  name: string;
  type: string;
  path: string;
  description?: string | null;
  config_json?: string | null; // serialized json
  status: string;
  created_at: string; // ISO or DB timestamp
  updated_at: string;
}

// Repository - Server internal DTO (domain-friendly)
export interface RepositoryServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config: IRepositoryConfig;
  status: RepositoryStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Repository - Client DTO (what API returns to frontend)
export interface RepositoryClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config: IRepositoryConfig;
  status: RepositoryStatus;
  // stats is computed server-side and returned as part of client DTO
  stats?: RepositoryStatsDTO;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

// Client interface for repository operations (use this in front-end modules)
export interface IRepositoryClient {
  list(params?: any): Promise<RepositoryClientDTO[]>;
  getById(uuid: string): Promise<RepositoryClientDTO | null>;
  create(payload: Partial<RepositoryClientDTO>): Promise<RepositoryClientDTO>;
  update(uuid: string, patch: Partial<RepositoryClientDTO>): Promise<RepositoryClientDTO>;
  delete(uuid: string): Promise<void>;
  // optionally: get stats separately
  getStats(uuid: string, mode?: 'cached' | 'live'): Promise<RepositoryStatsDTO>;
}

// 同样为 Resource 建议区分三层 DTO（示例）
export interface ResourcePersistenceDTO {
  uuid: string;
  repository_uuid: string;
  name: string;
  type: string;
  relative_path: string;
  size?: number;
  metadata_json?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceServerDTO {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  relativePath: string;
  size?: number;
  metadata?: IResourceMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResourceClientDTO {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  relativePath: string;
  uri?: string | null;
  size?: number;
  metadata?: IResourceMetadata;
  createdAt?: string;
  updatedAt?: string;
}

// ===== Editor Contracts (DTOs & Client API) =====

// Editor - Persistence DTO (DB row / internal storage)
export interface EditorPersistenceDTO {
  uuid: string;
  account_uuid: string;
  repository_uuid?: string | null; // optional link to repo
  title: string;
  path: string; // repository-relative path or absolute depending on repo.type
  content_text?: string | null; // serialized text content (for markdown)
  content_blob_ref?: string | null; // optional reference to blob storage
  language?: string | null; // markdown, mdx, html, etc
  metadata_json?: string | null; // serialized metadata (frontmatter, preview)
  created_at?: string;
  updated_at?: string;
}

// Editor - Server DTO (domain-friendly)
export interface EditorServerDTO {
  uuid: string;
  accountUuid: string;
  repositoryUuid?: string | null;
  title: string;
  path: string; // repo-relative
  content?: string; // full text content for editable resources
  language?: string;
  metadata?: { [key: string]: any };
  createdAt?: Date;
  updatedAt?: Date;
}

// Editor - Client DTO (API -> frontend)
export interface EditorClientDTO {
  uuid: string;
  accountUuid: string;
  repositoryUuid?: string | null;
  title: string;
  path: string; // repo-relative
  content?: string | null; // may be omitted in list endpoints
  previewUri?: string | null; // URL to render preview (if computed)
  language?: string | null;
  metadata?: { [key: string]: any } | null;
  // transport-friendly timestamps (client-facing): epoch ms (number)
  createdAt?: number | null;
  updatedAt?: number | null;
}

// Client interface for Editor operations (use this in front-end modules)
export interface IEditorClient {
  listEditors(params?: { repositoryUuid?: string; folder?: string; q?: string }): Promise<EditorClientDTO[]>;
  getById(uuid: string): Promise<EditorClientDTO | null>;
  create(payload: Partial<EditorClientDTO>): Promise<EditorClientDTO>;
  update(uuid: string, patch: Partial<EditorClientDTO>): Promise<EditorClientDTO>;
  delete(uuid: string): Promise<void>;

  // editor-specific helpers
  openForEdit(repositoryUuid: string | undefined, path: string): Promise<{ content: string; editor: EditorClientDTO }>;
  saveEditedContent(repositoryUuid: string | undefined, path: string, content: string): Promise<EditorClientDTO>;
  getPreviewUri(repositoryUuid: string | undefined, path: string): Promise<string>;
}

```

说明与实践要点：

- 在 `apps/api`（application layer）实现 mapping： PersistenceDTO <-> Domain <-> ServerDTO <-> ClientDTO。最好把这些 mapper 放在单独文件（`mappers.ts`）。
- 在 `packages/contracts` 保持 `ClientDTO`（即对外 contract），这用于前端与后端之间的契约；不要把 domain 方法或 Date 对象直接放到 contracts。contracts 里应使用可序列化类型（string/number/boolean/object）。
- 更多 Editor 聚合根/实体/值对象的精确定义与示例映射参见：`docs/EDITOR_AGGREGATES_AND_DTOS.md`（包含 server/client/persistence DTO 示例与 mapper 指南）。
- 前端使用 `IRepositoryClient`（或项目统一的 `IxxxClient` 方式）调用后端 API 并把 `RepositoryClientDTO` 转为前端 view model（如 `RepositoryView`），前端 store/组件只依赖 `RepositoryView`。

## Contracts 与 Domain 的分离

把 contracts（DTO / API 约定）和 domain（聚合根 / 业务逻辑）显式分开：“contracts” 只关心数据怎样在网络上序列化与传递；“domain” 关心业务规则与实体不变性。文档后半部分的 "接口定义" 与 "API 设计" 属于 contracts，而 "Domain 模型"、"仓储接口" 属于 domain/服务端实现层。

## Domain 模型（详述）

### 聚合根：Repository

属性：
- uuid, accountUuid, name, type, path, description?, config (IRepositoryConfig), status, stats, createdAt, updatedAt, lastAccessedAt

行为（示例）：
- activate()/deactivate()/archive()
- containsPath(relativePath): boolean
- getResourceFullPath(relativePath): string
- createFolder(relativePath)/deleteFolder/renameFolder
- addResource(resource)/removeResource(uuid)/moveResource(uuid, newRelPath)
- calculateStats()/updateStatsAfterChange(delta)


### 实体：Folder

属性：uuid, name, relativePath, parentPath?, createdAt, updatedAt

行为：addChild/removeChild/moveTo

说明：Folder 可由文件路径推导，DB 中可选存储以加速 UI 操作。


### 实体：Resource

属性：
- uuid, repositoryUuid, name, type, relativePath, uri?, size, metadata (IResourceMetadata), tags[], description?, status, createdAt, updatedAt, modifiedAt

行为：
- getFileName()/getExtension()/getParentFolder()
- isEditable() // true for MARKDOWN
- getPreviewUri(pathResolver)


### 值对象

- IResourceMetadata: image (width,height,exif), audio/video (duration,codec), markdown (previewText,wordCount)
- IRepositoryConfig: enableGit, autoSync, syncInterval, defaultLinkedDocName, supportedFileTypes, maxFileSize


## 仓储接口（Domain 层接口定义）

### IFileStorage（核心抽象）
- readFile(repositoryUuid, relativePath): Promise<Uint8Array | string>
- writeFile(repositoryUuid, relativePath, content): Promise<void>
- deleteFile(repositoryUuid, relativePath): Promise<void>
- statFile(repositoryUuid, relativePath): Promise<FileStat>
- listFiles(repositoryUuid, relativeFolderPath): Promise<FileEntry[]>
- resolveToAbsolutePath(repositoryUuid, relativePath): Promise<string>
- getPublicUri(repositoryUuid, relativePath): Promise<string | null>

### IRepositoryRepository
- getById(uuid), list(query), create(repository), update(repository), delete(uuid), existsPath(path)

### IResourceRepository
- getById(uuid), listByRepository(repoUuid, params), create(resource), update(resource), delete(uuid), findByRelativePath(repoUuid, relPath)

### IFolderRepository (可选)
- listFolders, createFolder, deleteFolder, moveFolder


## Application 层服务（Use Cases）

### RepositoryApplicationService (API)
- createRepository, updateRepository, deleteRepository, getRepository, listRepositories, activateRepository, archiveRepository

### ResourceApplicationService
- listResources, getResource, createResource (upload), updateResource (rename/replace), deleteResource, moveResource
- readResourceContent(repositoryUuid, relativePath)
- streamResource (支持 range streaming)
- generateThumbnail/getThumbnail

### Folder 服务
- createFolder, deleteFolder(recursive), renameFolder

### EditorApplicationService
- openResourceForEdit(repositoryUuid, relativePath) -> content + metadata
- saveEditedResource(repositoryUuid, relativePath, content)
- previewResource(repositoryUuid, relativePath) -> fetchable uri/thumbnail
- searchInRepository (全文/文件名)


## Editor 模块（Domain）职责

- Tab/Group/布局管理（已有 `EditorDomainService`）
- 文件类型推断、文件名抽取、tab id 生成、分栏计算
- 对于文件内容读写：调用 `EditorApplicationService`/`IFileStorage`，保持 domain 无 I/O 副作用
- Markdown 渲染交给渲染管线（markdown-it / remark + shiki）


## API 设计（示例 endpoints）

- Repositories
  - GET /api/repositories
  - POST /api/repositories
  - GET /api/repositories/:uuid
  - PUT /api/repositories/:uuid
  - DELETE /api/repositories/:uuid

- Resources / Files
  - GET /api/repositories/:repoUuid/resources?folder=... (list)
  - POST /api/repositories/:repoUuid/resources (multipart upload or content)
  - GET /api/repositories/:repoUuid/resources/:resourceUuid
  - DELETE /api/repositories/:repoUuid/resources/:resourceUuid
  - GET /api/repositories/:repoUuid/files?path=... -> 返回文件内容（正确 Content-Type）或 stream
  - GET /api/repositories/:repoUuid/files/uri?path=... -> 返回可供前端使用的 URL（若需）

- Editor
  - GET /api/repositories/:repoUuid/editor/open?path=... -> 返回 content + meta
  - POST /api/repositories/:repoUuid/editor/save -> 保存 content


## 前端实现建议（Editor UI）

- 左侧：仓库选择 + 文件夹树
- 中：资源卡片网格（图片缩略、media preview、md preview snippet）
- 右：编辑/预览区（编辑器 + live preview）
- 打开资源优先使用 `resource.uri`（如果为 http(s) 则直接使用），否则调用 API / IPC 获取
- 编辑器实现推荐：
  - Markdown 编辑：CodeMirror 6 或 TipTap（推荐 TipTap 用于更复杂的富文本与扩展）
  - 渲染：markdown-it 或 remark + shiki
  - 若需要 IDE 风格（大量 code blocks），则考虑 monaco，但 monaco 并非最佳 markdown 编辑体验


## 推荐依赖（按功能）

- Markdown 渲染：markdown-it 或 remark/unified
- 编辑器：TipTap v2（ProseMirror） 或 CodeMirror 6
- 代码高亮：shiki 或 highlight.js
- 图片处理：sharp (后端)
- 音视频 metadata：ffprobe / fluent-ffmpeg
- Search: lunr.js / flexsearch（client-side）或后端全文索引
- DB：Prisma + SQLite（desktop / local）或 Postgres（server）


## 平台差异与安全考虑

- Web：不能直接访问 file://，必须通过后端代理或预签名 URL。后端应验证路径在 repo 根下并做权限检查。
- Electron：通过主进程 IPC 访问文件系统，渲染进程不要直接使用 Node fs（保持安全）。
- 在合约中明确 `relativePath` 与 `uri` 的语义，避免前后端对 `path` 的不同解释。


## 分阶段实施计划

- 阶段 0（契约与抽象）
  - 在 `packages/contracts` 明确 ResourceDTO 的 `relativePath` 与 `uri?` 字段和注释
  - 设计 `IFileStorage` 抽象

- 阶段 1（Web-first 最小可行）
  - 实现后端文件代理 API `/api/repositories/:repoUuid/files?path=` 用于前端获取内容
  - 前端实现资源网格与基础 md 编辑（textarea + preview）
  - 实现 `WebPathResolver`（前端）优先使用 `resource.uri`

- 阶段 2（Electron 支持）
  - 实现主进程 IPC：repo:readFile, repo:listFiles, repo:resolvePath
  - 实现 `ElectronPathResolver`（renderer 调用 IPC）

- 阶段 3（增强特性）
  - wikilinks/backlinks/graph, 本地/后端全文搜索, Git 集成, thumbnails & streaming 优化


## 迁移与兼容策略

- 向后兼容：先新增 `uri` 为可选字段，再逐步在后端填充，前端优先消费新字段，不破坏现有字段
- 在后端对 `Repository.path` 的使用做明确文档，避免前端直接依赖该字段去打开文件


## 下一步（我可以帮你做）

1. 将本设计写入仓库文档（我已创建此文档）并提交本地修改。
2. 如果你同意，我可立即实现阶段 0/1 的最小改动：
   - contracts + `ResourceDTO.uri?`
   - 在 `apps/api` 增加文件代理 endpoint
   - 在 `apps/web` 增加 `WebPathResolver` 并让 UI 使用 `uri`

请告诉我如何继续：直接让我实现第一阶段的某些部分，还是先在文档里再补充/优化某些章节？

## 接口定义（TypeScript）

下面给出明确的 TypeScript 接口定义示例，分为：聚合根/实体/值对象、仓储接口、文件存储抽象、以及区分服务端（Server）和客户端（Client）的接口（IResourceServer / IResourceClient）。这些接口是建议性的，便于在实现层（server/client/infrastructure）进行具体实现。

```typescript
// ===== 值对象 & 简单类型 =====
export type RepositoryType = 'LOCAL' | 'REMOTE' | 'SYNCHRONIZED';
export type RepositoryStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SYNCING';
export type ResourceType = 'MARKDOWN' | 'IMAGE' | 'AUDIO' | 'VIDEO';
export type ResourceStatus = 'NORMAL' | 'DELETED' | 'ARCHIVED' | 'ERROR';

export interface IResourceMetadata {
  // 图片
  width?: number;
  height?: number;
  // 音视频
  duration?: number; // seconds
  codec?: string;
  // markdown preview
  previewText?: string;
  wordCount?: number;
  // common
  [key: string]: any;
}

export interface IRepositoryConfig {
  enableGit: boolean;
  autoSync: boolean;
  syncInterval?: number; // minutes
  defaultLinkedDocName?: string;
  supportedFileTypes: ResourceType[];
  maxFileSize?: number; // bytes
}

export interface FileStat {
  path: string;
  size: number;
  isDirectory: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileEntry {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size?: number;
}

// ===== 聚合根 / 实体 =====
export interface RepositoryProps {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string; // repository root (semantic differs by type)
  description?: string;
  config: IRepositoryConfig;
  status: RepositoryStatus;
  stats?: any; // 简化：可替换为具体结构
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
}

export interface FolderProps {
  uuid: string;
  repositoryUuid: string;
  name: string;
  relativePath: string; // always use '/' separators
  parentPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResourceProps {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  relativePath: string; // repository-relative, '/' separators
  uri?: string | null; // optional fetchable uri (http(s)/blob/file:// or proxy url)
  size?: number;
  metadata?: IResourceMetadata;
  tags?: string[];
  description?: string;
  status?: ResourceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedAt?: Date;
}

// ===== 仓储接口（Domain 层接口） =====
export interface IRepositoryRepository {
  getById(uuid: string): Promise<RepositoryProps | null>;
  list(query?: any): Promise<RepositoryProps[]>;
  create(repository: RepositoryProps): Promise<RepositoryProps>;
  update(repository: RepositoryProps): Promise<RepositoryProps>;
  delete(uuid: string): Promise<void>;
  existsPath(path: string): Promise<boolean>;
}

export interface IResourceRepository {
  getById(uuid: string): Promise<ResourceProps | null>;
  listByRepository(repositoryUuid: string, params?: any): Promise<ResourceProps[]>;
  create(resource: ResourceProps): Promise<ResourceProps>;
  update(resource: ResourceProps): Promise<ResourceProps>;
  delete(uuid: string): Promise<void>;
  findByRelativePath(repositoryUuid: string, relativePath: string): Promise<ResourceProps | null>;
}

export interface IFolderRepository {
  listFolders(repositoryUuid: string, parentPath?: string): Promise<FolderProps[]>;
  createFolder(repositoryUuid: string, relativePath: string): Promise<FolderProps>;
  deleteFolder(repositoryUuid: string, relativePath: string, recursive?: boolean): Promise<void>;
  moveFolder(repositoryUuid: string, fromPath: string, toPath: string): Promise<void>;
}

// ===== 文件/内容访问抽象（基础设施层依赖） =====
export interface IFileStorage {
  // read raw bytes or text
  readFile(repositoryUuid: string, relativePath: string): Promise<Uint8Array | string>;
  writeFile(repositoryUuid: string, relativePath: string, content: Uint8Array | string): Promise<void>;
  deleteFile(repositoryUuid: string, relativePath: string): Promise<void>;
  statFile(repositoryUuid: string, relativePath: string): Promise<FileStat>;
  listFiles(repositoryUuid: string, relativeFolderPath?: string): Promise<FileEntry[]>;
  resolveToAbsolutePath(repositoryUuid: string, relativePath: string): Promise<string>;
  // return a URL usable by browser or null if not available (server may provide proxy URLs)
  getPublicUri(repositoryUuid: string, relativePath: string): Promise<string | null>;
}

// ===== 区分 Server / Client 的 API 接口 =====
// Server-side interface: 在后端实现，暴露给 API 层或 Electron 主进程使用
export interface IResourceServer {
  // Basic resource management
  listResources(repositoryUuid: string, folder?: string, options?: any): Promise<ResourceProps[]>;
  getResource(repositoryUuid: string, resourceUuid: string): Promise<ResourceProps | null>;
  createResource(repositoryUuid: string, resource: ResourceProps, content?: Uint8Array | string): Promise<ResourceProps>;
  updateResource(repositoryUuid: string, resourceUuid: string, patch: Partial<ResourceProps>): Promise<ResourceProps>;
  deleteResource(repositoryUuid: string, resourceUuid: string): Promise<void>;

  // File/content helpers
  readResourceContent(repositoryUuid: string, relativePath: string): Promise<Uint8Array | string>;
  streamResourceContent(repositoryUuid: string, relativePath: string, range?: { start?: number; end?: number }): Promise<any>; // stream/response
  getResourcePublicUri(repositoryUuid: string, relativePath: string): Promise<string | null>;
  generateThumbnail(repositoryUuid: string, relativePath: string): Promise<string | null>;
}

// Client-side interface: 在前端使用，通常由 client-side SDK 或 REST client 实现
export interface IResourceClient {
  listResources(repositoryUuid: string, folder?: string, options?: any): Promise<ResourceProps[]>;
  getResource(repositoryUuid: string, resourceUuid: string): Promise<ResourceProps | null>;
  uploadResource(repositoryUuid: string, relativePath: string, file: File | Blob | Uint8Array): Promise<ResourceProps>;
  updateResourceMeta(repositoryUuid: string, resourceUuid: string, patch: Partial<ResourceProps>): Promise<ResourceProps>;
  deleteResource(repositoryUuid: string, resourceUuid: string): Promise<void>;

  // editor helpers
  openForEdit(repositoryUuid: string, relativePath: string): Promise<{ content: string; resource: ResourceProps }>;
  saveEditedContent(repositoryUuid: string, relativePath: string, content: string): Promise<ResourceProps>;
  getPreviewUri(repositoryUuid: string, relativePath: string): Promise<string>;
}

// ===== Editor 相关接口（domain / client） =====
export interface IEditorTab {
  uuid: string;
  title: string;
  path: string; // repository-relative path or uri
  repositoryUuid?: string;
  active: boolean;
  isPreview?: boolean;
  fileType?: string;
  isDirty?: boolean;
  lastModified?: Date;
}

export interface IEditorGroup {
  uuid: string;
  width: number;
  tabs: IEditorTab[];
  activeTabId?: string | null;
}

export interface IEditorLayout {
  windowWidth: number;
  windowHeight: number;
  sidebarWidth: number;
  activityBarWidth: number;
  minEditorWidth: number;
}

export interface IEditorDomainService {
  determineFileType(path: string): string;
  createEditorTab(command: { repositoryUuid?: string; path: string; isPreview?: boolean }): IEditorTab;
  validateEditorTab(tab: Partial<IEditorTab>): void;
  validateFilePath(path: string): void;
  generateTabId(path: string, isPreview?: boolean): string;
}

```

以上接口为建议性的“契约”草案，便于实现层（server/infrastructure/client）按需实现与测试。接下来我们可以基于这些接口：

- 在 `packages/contracts` 中把 DTO 与上述契约对齐（逐步迁移）；
- 在 `apps/api` 中实现 `IResourceServer` 的具体实现并提供 REST endpoints；
- 在 `apps/web` 中实现 `IResourceClient`（API 客户端实现）与 `WebPathResolver`；
- 在 `apps/desktop`（Electron）中实现 `IFileStorage` 的 local FS 版本与 `IResourceServer` 的 IPC 包装。

```
请告诉我你想如何继续：直接让我实现第一阶段的某些部分，还是先在文档里再补充/优化某些章节？
