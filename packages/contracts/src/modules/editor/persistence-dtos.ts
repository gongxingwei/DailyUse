/**
 * Editor 模块持久化 DTO 定义
 */

import {
  ChangeType,
  DocumentFormat,
  FileOperationType,
  RenderingMode,
  SearchType,
  SidebarTab,
  SupportedFileType,
  ViewMode,
} from './enums';

/**
 * 文档持久化 DTO
 */
export interface DocumentPersistenceDTO {
  uuid: string;
  repositoryUuid: string;
  relativePath: string;
  fileName: string;
  title: string;
  format: DocumentFormat;
  content: string;
  metadata: string; // JSON string
  tags: string[];
  resources: string; // JSON string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  deletedAt?: number; // timestamp
  version: number;
}

/**
 * 文档版本持久化 DTO
 */
export interface DocumentVersionPersistenceDTO {
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  content: string;
  changeSet: string; // JSON string of ContentChangePersistenceDTO[]
  author: string;
  createdAt: number; // timestamp
  description?: string;
}

/**
 * 文档内容变更持久化 DTO
 */
export interface ContentChangePersistenceDTO {
  uuid: string;
  versionUuid: string;
  type: ChangeType;
  position: {
    line: number;
    column: number;
    offset: number;
  };
  length: number;
  oldText: string;
  newText: string;
  timestamp: number; // timestamp
}

/**
 * 打开文档状态持久化 DTO
 */
export interface OpenDocumentPersistenceDTO {
  documentUuid: string;
  tabTitle: string;
  isDirty: number; // 0 or 1
  lastActiveAt: number; // timestamp
  cursorPosition: string; // JSON string
  scrollPosition: string; // JSON string
}

/**
 * 侧边栏状态持久化 DTO
 */
export interface SidebarStatePersistenceDTO {
  isVisible: number; // 0 or 1
  width: number;
  activeTab: SidebarTab;
  tabs: string; // JSON string
}

/**
 * 布局配置持久化 DTO
 */
export interface WorkspaceLayoutPersistenceDTO {
  sidebarWidth: number;
  editorWidth: number;
  previewWidth: number;
  isPreviewVisible: number; // 0 or 1
  panelSizes: string; // JSON string
  viewMode: ViewMode;
}

/**
 * 编辑器设置持久化 DTO
 */
export interface EditorSettingsPersistenceDTO {
  theme: string; // JSON string
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: number; // 0 or 1
  lineNumbers: number; // 0 or 1
  minimap: number; // 0 or 1
  autoSave: string; // JSON string
  syntax: string; // JSON string
}

/**
 * 工作区持久化 DTO
 */
export interface WorkspacePersistenceDTO {
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string;
  openDocuments: string; // JSON string of OpenDocumentPersistenceDTO[]
  sidebarState: string; // JSON string of SidebarStatePersistenceDTO
  layout: string; // JSON string of WorkspaceLayoutPersistenceDTO
  settings: string; // JSON string of EditorSettingsPersistenceDTO
  searchState: string; // JSON string
  lifecycle: string; // JSON string representing EntityLifecycle
}

/**
 * 搜索查询持久化 DTO
 */
export interface SearchQueryPersistenceDTO {
  uuid: string;
  workspaceUuid: string;
  query: string;
  type: SearchType;
  scope: string; // JSON string
  filters: string; // JSON string
  results: string; // JSON string of SearchResultPersistenceDTO[]
  executedAt: number; // timestamp
}

/**
 * 搜索结果持久化 DTO
 */
export interface SearchResultPersistenceDTO {
  uuid: string;
  queryUuid: string;
  fileUuid: string;
  fileName: string;
  filePath: string;
  matches: string; // JSON string
  score: number;
}

/**
 * 文档渲染状态持久化 DTO
 */
export interface RenderingStatePersistenceDTO {
  documentUuid: string;
  mode: RenderingMode;
  isLivePreview: number; // 0 or 1
  cursorInRenderedView: number; // 0 or 1
  renderedContent: string; // JSON string
  sourceMap: string; // JSON string
}

/**
 * 资源引用持久化 DTO
 */
export interface LinkedResourcePersistenceDTO {
  uuid: string;
  documentUuid: string;
  type: string; // 使用 ResourceType 序列化为字符串
  relativePath: string;
  size: number;
  mimeType?: string;
  thumbnailPath?: string;
}

/**
 * 仓库资源树持久化 DTO
 */
export interface RepositoryExplorerPersistenceDTO {
  uuid: string;
  repositoryUuid: string;
  rootPath: string;
  fileTree: string; // JSON string
  filteredTree: string; // JSON string
  expandedNodes: string[];
  selectedNodes: string[];
  lastScanAt: number; // timestamp
}

/**
 * 文件操作审计日志持久化 DTO
 */
export interface FileOperationLogPersistenceDTO {
  uuid: string;
  repositoryUuid: string;
  operatorUuid: string;
  operationType: FileOperationType;
  targetPath: string;
  payload?: string; // JSON string
  result: string; // JSON string
  occurredAt: number; // timestamp
}

/**
 * 文档索引状态持久化 DTO
 */
export interface SearchIndexStatePersistenceDTO {
  repositoryUuid: string;
  isBuilding: number; // 0 or 1
  lastBuiltAt: number; // timestamp
  indexedFileCount: number;
  totalFileCount: number;
}

/**
 * 打开文件快照持久化 DTO
 */
export interface OpenFileSnapshotPersistenceDTO {
  workspaceUuid: string;
  filePath: string;
  fileType: SupportedFileType;
  cursorPosition: string; // JSON string
  selection: string; // JSON string representing SelectionDirection + ranges
  scrollPosition: string; // JSON string
  lastOpenedAt: number; // timestamp
}
