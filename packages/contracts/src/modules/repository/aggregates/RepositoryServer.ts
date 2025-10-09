/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合根 - 服务端接口
 */

import type { RepositoryType, RepositoryStatus, ResourceType, ResourceStatus } from '../enums';

// ============ 值对象接口 ============

/**
 * 仓库配置
 */
export interface RepositoryConfig {
  enableGit: boolean;
  autoSync: boolean;
  syncInterval?: number | null;
  defaultLinkedDocName: string;
  supportedFileTypes: ResourceType[];
  maxFileSize: number;
  enableVersionControl: boolean;
}

/**
 * 仓库统计信息
 */
export interface RepositoryStats {
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByStatus: Record<ResourceStatus, number>;
  totalSize: number;
  recentActiveResources: number;
  favoriteResources: number;
  lastUpdated: number; // epoch ms
}

/**
 * 同步状态
 */
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: number | null; // epoch ms
  syncError?: string | null;
  pendingSyncCount: number;
  conflictCount: number;
}

/**
 * Git信息
 */
export interface GitInfo {
  isGitRepo: boolean;
  currentBranch?: string | null;
  hasChanges?: boolean | null;
  remoteUrl?: string | null;
}

/**
 * Git状态信息
 */
export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  conflicted: string[];
  isClean: boolean;
}

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfig;
  relatedGoals?: string[] | null;
  status: RepositoryStatus;
  git?: GitInfo | null;
  syncStatus?: SyncStatus | null;
  stats: RepositoryStats;
  lastAccessedAt?: number | null; // epoch ms
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * Repository Persistence DTO (数据库映射)
 */
export interface RepositoryPersistenceDTO {
  uuid: string;
  account_uuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: string; // JSON string
  related_goals?: string | null; // JSON string
  status: RepositoryStatus;
  git?: string | null; // JSON string
  sync_status?: string | null; // JSON string
  stats: string; // JSON string
  last_accessed_at?: number | null;
  created_at: number;
  updated_at: number;
}

// ============ 领域事件 ============

/**
 * 仓库创建事件
 */
export interface RepositoryCreatedEvent {
  type: 'repository.created';
  aggregateId: string; // repositoryUuid
  timestamp: number; // epoch ms
  payload: {
    repository: RepositoryServerDTO;
    initializeGit: boolean;
    createDefaultLinkedDoc: boolean;
  };
}

/**
 * 仓库更新事件
 */
export interface RepositoryUpdatedEvent {
  type: 'repository.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    repository: RepositoryServerDTO;
    previousData: Partial<RepositoryServerDTO>;
    changes: string[];
  };
}

/**
 * 仓库删除事件
 */
export interface RepositoryDeletedEvent {
  type: 'repository.deleted';
  aggregateId: string;
  timestamp: number;
  payload: {
    repositoryUuid: string;
    repositoryName: string;
    deleteFiles: boolean;
    resourceCount: number;
  };
}

/**
 * 仓库状态变更事件
 */
export interface RepositoryStatusChangedEvent {
  type: 'repository.status.changed';
  aggregateId: string;
  timestamp: number;
  payload: {
    previousStatus: RepositoryStatus;
    newStatus: RepositoryStatus;
    reason?: string;
  };
}

/**
 * 仓库同步开始事件
 */
export interface RepositorySyncStartedEvent {
  type: 'repository.sync.started';
  aggregateId: string;
  timestamp: number;
  payload: {
    syncType: 'pull' | 'push' | 'both';
    force: boolean;
  };
}

/**
 * 仓库同步完成事件
 */
export interface RepositorySyncCompletedEvent {
  type: 'repository.sync.completed';
  aggregateId: string;
  timestamp: number;
  payload: {
    syncType: 'pull' | 'push' | 'both';
    duration: number;
    filesChanged: number;
    conflicts: string[];
  };
}

/**
 * 仓库统计更新事件
 */
export interface RepositoryStatsUpdatedEvent {
  type: 'repository.stats.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    stats: RepositoryStats;
    previousStats: RepositoryStats;
  };
}

/**
 * Repository 领域事件联合类型
 */
export type RepositoryDomainEvent =
  | RepositoryCreatedEvent
  | RepositoryUpdatedEvent
  | RepositoryDeletedEvent
  | RepositoryStatusChangedEvent
  | RepositorySyncStartedEvent
  | RepositorySyncCompletedEvent
  | RepositoryStatsUpdatedEvent;

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Server 接口
 */
export interface RepositoryServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;

  // 配置
  config: RepositoryConfig;
  relatedGoals?: string[] | null;

  // 状态
  status: RepositoryStatus;
  git?: GitInfo | null;
  syncStatus?: SyncStatus | null;
  stats: RepositoryStats;

  // 时间戳 (统一使用 number epoch ms)
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 配置管理
  updateConfig(config: Partial<RepositoryConfig>): void;
  enableGit(remoteUrl?: string): Promise<void>;
  disableGit(): void;

  // 同步管理
  startSync(type: 'pull' | 'push' | 'both', force?: boolean): Promise<void>;
  stopSync(): void;
  resolveSyncConflict(conflictPath: string, resolution: 'local' | 'remote'): Promise<void>;

  // 统计更新
  updateStats(): Promise<void>;
  incrementResourceCount(type: ResourceType): void;
  decrementResourceCount(type: ResourceType): void;

  // 状态管理
  archive(): void;
  activate(): void;
  markAsAccessed(): void;

  // 关联管理
  addRelatedGoal(goalUuid: string): void;
  removeRelatedGoal(goalUuid: string): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): RepositoryPersistenceDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
}
