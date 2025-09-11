/**
 * Repository Module DTOs
 * 仓储模块数据传输对象
 */

import type {
  ResourceType,
  ResourceStatus,
  RepositoryType,
  RepositoryStatus,
  ReferenceType,
  ContentType,
  IResourceMetadata,
  IRepositoryConfig,
  IRepositoryStats,
  IRepositorySyncStatus,
  IGitInfo,
} from './types';

// ============ 基础DTO ============

/**
 * 资源DTO
 */
export interface ResourceDTO {
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
 * 资源引用DTO
 */
export interface ResourceReferenceDTO {
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string;
  createdAt: Date;
}

/**
 * 关联内容DTO
 */
export interface LinkedContentDTO {
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
 * 仓库DTO
 */
export interface RepositoryDTO {
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

// ============ 创建请求DTO ============

/**
 * 创建仓库请求DTO
 */
export interface CreateRepositoryRequestDTO {
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<IRepositoryConfig>;
  relatedGoals?: string[];
  initializeGit?: boolean;
  createDefaultLinkedDoc?: boolean;
}

/**
 * 创建资源请求DTO
 */
export interface CreateResourceRequestDTO {
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  content?: string | Uint8Array;
  description?: string;
  author?: string;
  tags?: string[];
  category?: string;
  metadata?: Partial<IResourceMetadata>;
}

/**
 * 添加关联内容请求DTO
 */
export interface AddLinkedContentRequestDTO {
  resourceUuid: string;
  title: string;
  url: string;
  contentType: ContentType;
  description?: string;
}

/**
 * 创建资源引用请求DTO
 */
export interface CreateResourceReferenceRequestDTO {
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string;
}

// ============ 更新请求DTO ============

/**
 * 更新仓库请求DTO
 */
export interface UpdateRepositoryRequestDTO {
  uuid: string;
  name?: string;
  path?: string;
  description?: string;
  config?: Partial<IRepositoryConfig>;
  relatedGoals?: string[];
  status?: RepositoryStatus;
}

/**
 * 更新资源请求DTO
 */
export interface UpdateResourceRequestDTO {
  uuid: string;
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  category?: string;
  status?: ResourceStatus;
  metadata?: Partial<IResourceMetadata>;
}

// ============ 查询参数DTO ============

/**
 * 仓库查询参数DTO
 */
export interface RepositoryQueryParamsDTO {
  type?: RepositoryType | RepositoryType[];
  status?: RepositoryStatus | RepositoryStatus[];
  relatedGoals?: string[];
  keyword?: string;
  enableGit?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * 资源查询参数DTO
 */
export interface ResourceQueryParamsDTO {
  repositoryUuid?: string;
  type?: ResourceType | ResourceType[];
  status?: ResourceStatus | ResourceStatus[];
  tags?: string[];
  category?: string;
  author?: string;
  keyword?: string;
  sizeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
    field?: 'createdAt' | 'updatedAt' | 'modifiedAt';
  };
  isFavorite?: boolean;
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'accessCount';
  sortOrder?: 'asc' | 'desc';
  pagination?: {
    page: number;
    limit: number;
  };
}

// ============ 批量操作DTO ============

/**
 * 批量操作请求DTO
 */
export interface BatchOperationRequestDTO {
  operation: 'delete' | 'move' | 'copy' | 'tag' | 'categorize';
  resourceUuids: string[];
  params?: {
    targetPath?: string;
    tags?: string[];
    category?: string;
    force?: boolean;
  };
}

/**
 * 仓库同步请求DTO
 */
export interface SyncRepositoryRequestDTO {
  repositoryUuid: string;
  syncType: 'pull' | 'push' | 'both';
  force?: boolean;
  conflictResolution?: 'local' | 'remote' | 'manual';
}

// ============ 响应DTO ============

/**
 * 仓库列表响应DTO
 */
export interface RepositoryListResponseDTO {
  repositories: RepositoryDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 资源列表响应DTO
 */
export interface ResourceListResponseDTO {
  resources: ResourceDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 关联内容列表响应DTO
 */
export interface LinkedContentListResponseDTO {
  linkedContents: LinkedContentDTO[];
  total: number;
}

/**
 * 资源引用列表响应DTO
 */
export interface ResourceReferenceListResponseDTO {
  references: ResourceReferenceDTO[];
  total: number;
}

/**
 * 批量操作响应DTO
 */
export interface BatchOperationResponseDTO {
  success: string[];
  failed: { uuid: string; error: string }[];
}

/**
 * 导入资源响应DTO
 */
export interface ImportResourcesResponseDTO {
  imported: ResourceDTO[];
  failed: { fileName: string; error: string }[];
}

/**
 * 标签云响应DTO
 */
export interface TagCloudResponseDTO {
  tags: { tag: string; count: number }[];
}

/**
 * 搜索结果响应DTO
 */
export interface SearchResultResponseDTO {
  resources: ResourceDTO[];
  repositories: RepositoryDTO[];
  total: number;
  took: number; // 搜索耗时（毫秒）
}

// ============ Git相关DTO ============

/**
 * Git状态响应DTO
 */
export interface GitStatusResponseDTO {
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
 * Git提交DTO
 */
export interface GitCommitDTO {
  hash: string;
  date: string;
  message: string;
  refs?: string;
  body?: string;
  author_name: string;
  author_email: string;
}

/**
 * Git日志响应DTO
 */
export interface GitLogResponseDTO {
  commits: GitCommitDTO[];
  total?: number;
}

/**
 * Git提交请求DTO
 */
export interface GitCommitRequestDTO {
  repositoryPath: string;
  message: string;
  addAll?: boolean;
}

/**
 * Git分支请求DTO
 */
export interface GitBranchRequestDTO {
  repositoryPath: string;
  branchName: string;
  checkout?: boolean;
}
