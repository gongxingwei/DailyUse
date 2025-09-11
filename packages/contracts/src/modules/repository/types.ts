/**
 * Repository Module Core Types
 * 仓储模块核心类型定义
 */

// ============ 枚举定义 ============

/**
 * 资源类型枚举
 */
export enum ResourceType {
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  LINK = 'link',
  CODE = 'code',
  OTHER = 'other',
}

/**
 * 资源状态枚举
 */
export enum ResourceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  DRAFT = 'draft',
}

/**
 * 仓库状态枚举
 */
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  SYNCING = 'syncing',
}

/**
 * 仓库类型枚举
 */
export enum RepositoryType {
  LOCAL = 'local',
  REMOTE = 'remote',
  SYNCHRONIZED = 'synchronized',
}

/**
 * 引用类型枚举
 */
export enum ReferenceType {
  LINK = 'link',
  EMBED = 'embed',
  RELATED = 'related',
  DEPENDENCY = 'dependency',
}

/**
 * 内容类型枚举
 */
export enum ContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

// ============ 基础接口定义 ============

/**
 * 资源元数据接口
 */
export interface IResourceMetadata {
  [key: string]: any;
  mimeType?: string;
  encoding?: string;
  thumbnailPath?: string;
  isFavorite?: boolean;
  accessCount?: number;
  lastAccessedAt?: Date;
}

/**
 * 仓库配置接口
 */
export interface IRepositoryConfig {
  enableGit: boolean;
  autoSync: boolean;
  syncInterval?: number;
  defaultLinkedDocName: string;
  supportedFileTypes: ResourceType[];
  maxFileSize: number;
  enableVersionControl: boolean;
}

/**
 * 仓库统计信息接口
 */
export interface IRepositoryStats {
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByStatus: Record<ResourceStatus, number>;
  totalSize: number;
  recentActiveResources: number;
  favoriteResources: number;
  lastUpdated: Date;
}

/**
 * 仓库同步状态接口
 */
export interface IRepositorySyncStatus {
  isSyncing: boolean;
  lastSyncAt?: Date;
  syncError?: string;
  pendingSyncCount: number;
  conflictCount: number;
}

/**
 * Git信息接口
 */
export interface IGitInfo {
  isGitRepo: boolean;
  currentBranch?: string;
  hasChanges?: boolean;
  remoteUrl?: string;
}

// ============ 核心实体接口 ============

/**
 * 资源接口
 */
export interface IResource {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string;
  author?: string;
  version?: string;
  tags: string[];
  category?: string;
  status: ResourceStatus;
  metadata: IResourceMetadata;
  createdAt: Date;
  updatedAt: Date;
  modifiedAt?: Date;
}

/**
 * 资源引用接口
 */
export interface IResourceReference {
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string;
  createdAt: Date;
}

/**
 * 关联内容接口
 */
export interface ILinkedContent {
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: ContentType;
  description?: string;
  thumbnail?: string;
  isAccessible: boolean;
  lastCheckedAt?: Date;
  createdAt: Date;
}

/**
 * 仓库接口
 */
export interface IRepository {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config: IRepositoryConfig;
  relatedGoals?: string[];
  status: RepositoryStatus;
  git?: IGitInfo;
  syncStatus?: IRepositorySyncStatus;
  stats: IRepositoryStats;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Git相关接口 ============

/**
 * Git状态信息
 */
export interface IGitStatus {
  current: string;
  tracking?: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  not_added: string[];
  created: string[];
  modified: string[];
  deleted: string[];
  conflicted: string[];
  isClean: boolean;
  detached: boolean;
}

/**
 * Git提交信息
 */
export interface IGitCommit {
  hash: string;
  date: string;
  message: string;
  refs?: string;
  body?: string;
  author_name: string;
  author_email: string;
}

/**
 * Git日志响应
 */
export interface IGitLogResponse {
  commits: IGitCommit[];
  total?: number;
}

// ============ Git命令接口 ============

/**
 * Git命令基类
 */
export interface IGitCommand {
  repositoryPath: string;
}

/**
 * Git初始化命令
 */
export interface IGitInitCommand extends IGitCommand {
  bare?: boolean;
}

/**
 * Git添加文件命令
 */
export interface IGitAddCommand extends IGitCommand {
  files: string[];
}

/**
 * Git提交命令
 */
export interface IGitCommitCommand extends IGitCommand {
  message: string;
  addAll?: boolean;
}

/**
 * Git分支命令
 */
export interface IGitBranchCommand extends IGitCommand {
  branchName: string;
  checkout?: boolean;
}
