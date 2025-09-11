/**
 * Repository Module Events
 * 仓储模块领域事件
 */

import type {
  RepositoryDTO,
  ResourceDTO,
  ResourceReferenceDTO,
  LinkedContentDTO,
  GitCommitDTO,
} from './dtos';

// ============ 事件基类 ============

/**
 * 仓库事件基类
 */
export interface BaseRepositoryEvent {
  type: string;
  timestamp: Date;
  repositoryUuid: string;
  accountUuid: string;
  eventId: string;
}

/**
 * 资源事件基类
 */
export interface BaseResourceEvent {
  type: string;
  timestamp: Date;
  resourceUuid: string;
  repositoryUuid: string;
  accountUuid: string;
  eventId: string;
}

// ============ 仓库事件 ============

/**
 * 仓库创建事件
 */
export interface RepositoryCreatedEvent extends BaseRepositoryEvent {
  type: 'repository.created';
  payload: {
    repository: RepositoryDTO;
    initializeGit: boolean;
    createDefaultLinkedDoc: boolean;
  };
}

/**
 * 仓库更新事件
 */
export interface RepositoryUpdatedEvent extends BaseRepositoryEvent {
  type: 'repository.updated';
  payload: {
    repository: RepositoryDTO;
    previousData: Partial<RepositoryDTO>;
    changes: string[];
  };
}

/**
 * 仓库删除事件
 */
export interface RepositoryDeletedEvent extends BaseRepositoryEvent {
  type: 'repository.deleted';
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
export interface RepositoryStatusChangedEvent extends BaseRepositoryEvent {
  type: 'repository.status.changed';
  payload: {
    repository: RepositoryDTO;
    previousStatus: string;
    newStatus: string;
    reason?: string;
  };
}

/**
 * 仓库同步开始事件
 */
export interface RepositorySyncStartedEvent extends BaseRepositoryEvent {
  type: 'repository.sync.started';
  payload: {
    syncType: 'pull' | 'push' | 'both';
    force: boolean;
    conflictResolution?: 'local' | 'remote' | 'manual';
  };
}

/**
 * 仓库同步完成事件
 */
export interface RepositorySyncCompletedEvent extends BaseRepositoryEvent {
  type: 'repository.sync.completed';
  payload: {
    syncType: 'pull' | 'push' | 'both';
    duration: number; // 同步耗时（毫秒）
    filesChanged: number;
    conflicts: string[];
  };
}

/**
 * 仓库同步失败事件
 */
export interface RepositorySyncFailedEvent extends BaseRepositoryEvent {
  type: 'repository.sync.failed';
  payload: {
    syncType: 'pull' | 'push' | 'both';
    error: string;
    errorCode?: string;
    retryCount: number;
  };
}

/**
 * 仓库统计更新事件
 */
export interface RepositoryStatsUpdatedEvent extends BaseRepositoryEvent {
  type: 'repository.stats.updated';
  payload: {
    repository: RepositoryDTO;
    previousStats: any;
    trigger: 'resource.created' | 'resource.deleted' | 'resource.updated' | 'scheduled';
  };
}

// ============ 资源事件 ============

/**
 * 资源创建事件
 */
export interface ResourceCreatedEvent extends BaseResourceEvent {
  type: 'resource.created';
  payload: {
    resource: ResourceDTO;
    uploadSource?: 'local' | 'url' | 'drag-drop';
    parentDirectory?: string;
  };
}

/**
 * 资源更新事件
 */
export interface ResourceUpdatedEvent extends BaseResourceEvent {
  type: 'resource.updated';
  payload: {
    resource: ResourceDTO;
    previousData: Partial<ResourceDTO>;
    changes: string[];
    contentChanged: boolean;
  };
}

/**
 * 资源删除事件
 */
export interface ResourceDeletedEvent extends BaseResourceEvent {
  type: 'resource.deleted';
  payload: {
    resourceUuid: string;
    resourceName: string;
    resourceType: string;
    deleteFile: boolean;
    referenceCount: number;
  };
}

/**
 * 资源状态变更事件
 */
export interface ResourceStatusChangedEvent extends BaseResourceEvent {
  type: 'resource.status.changed';
  payload: {
    resource: ResourceDTO;
    previousStatus: string;
    newStatus: string;
    reason?: string;
  };
}

/**
 * 资源移动事件
 */
export interface ResourceMovedEvent extends BaseResourceEvent {
  type: 'resource.moved';
  payload: {
    resource: ResourceDTO;
    previousPath: string;
    newPath: string;
    updateReferences: boolean;
  };
}

/**
 * 资源访问事件
 */
export interface ResourceAccessedEvent extends BaseResourceEvent {
  type: 'resource.accessed';
  payload: {
    resource: ResourceDTO;
    accessType: 'view' | 'download' | 'edit';
    userAgent?: string;
    duration?: number;
  };
}

/**
 * 资源标签更新事件
 */
export interface ResourceTagsUpdatedEvent extends BaseResourceEvent {
  type: 'resource.tags.updated';
  payload: {
    resource: ResourceDTO;
    previousTags: string[];
    newTags: string[];
    addedTags: string[];
    removedTags: string[];
  };
}

// ============ 资源引用事件 ============

/**
 * 资源引用创建事件
 */
export interface ResourceReferenceCreatedEvent extends BaseResourceEvent {
  type: 'resource.reference.created';
  payload: {
    reference: ResourceReferenceDTO;
    sourceResource: ResourceDTO;
    targetResource: ResourceDTO;
  };
}

/**
 * 资源引用删除事件
 */
export interface ResourceReferenceDeletedEvent extends BaseResourceEvent {
  type: 'resource.reference.deleted';
  payload: {
    referenceUuid: string;
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: string;
  };
}

// ============ 关联内容事件 ============

/**
 * 关联内容添加事件
 */
export interface LinkedContentAddedEvent extends BaseResourceEvent {
  type: 'resource.linked-content.added';
  payload: {
    linkedContent: LinkedContentDTO;
    resource: ResourceDTO;
    extractedMetadata?: any;
  };
}

/**
 * 关联内容删除事件
 */
export interface LinkedContentRemovedEvent extends BaseResourceEvent {
  type: 'resource.linked-content.removed';
  payload: {
    linkedContentUuid: string;
    resourceUuid: string;
    url: string;
    title: string;
  };
}

/**
 * 关联内容可访问性检查事件
 */
export interface LinkedContentAccessibilityCheckedEvent extends BaseResourceEvent {
  type: 'resource.linked-content.accessibility-checked';
  payload: {
    linkedContent: LinkedContentDTO;
    previousAccessible: boolean;
    currentAccessible: boolean;
    responseTime?: number;
    statusCode?: number;
  };
}

// ============ Git事件 ============

/**
 * Git提交事件
 */
export interface GitCommittedEvent extends BaseRepositoryEvent {
  type: 'repository.git.committed';
  payload: {
    commit: GitCommitDTO;
    filesChanged: string[];
    addedFiles: string[];
    modifiedFiles: string[];
    deletedFiles: string[];
  };
}

/**
 * Git分支创建事件
 */
export interface GitBranchCreatedEvent extends BaseRepositoryEvent {
  type: 'repository.git.branch.created';
  payload: {
    branchName: string;
    sourceBranch: string;
    checkout: boolean;
  };
}

/**
 * Git分支切换事件
 */
export interface GitBranchSwitchedEvent extends BaseRepositoryEvent {
  type: 'repository.git.branch.switched';
  payload: {
    previousBranch: string;
    newBranch: string;
    hasUncommittedChanges: boolean;
  };
}

/**
 * Git推送事件
 */
export interface GitPushedEvent extends BaseRepositoryEvent {
  type: 'repository.git.pushed';
  payload: {
    remote: string;
    branch: string;
    commits: GitCommitDTO[];
    force: boolean;
  };
}

/**
 * Git拉取事件
 */
export interface GitPulledEvent extends BaseRepositoryEvent {
  type: 'repository.git.pulled';
  payload: {
    remote: string;
    branch: string;
    commits: GitCommitDTO[];
    conflicts: string[];
    mergeType: 'fast-forward' | 'merge' | 'rebase';
  };
}

// ============ 批量操作事件 ============

/**
 * 批量操作开始事件
 */
export interface BatchOperationStartedEvent extends BaseRepositoryEvent {
  type: 'repository.batch-operation.started';
  payload: {
    operation: 'delete' | 'move' | 'copy' | 'tag' | 'categorize';
    resourceUuids: string[];
    params: any;
  };
}

/**
 * 批量操作完成事件
 */
export interface BatchOperationCompletedEvent extends BaseRepositoryEvent {
  type: 'repository.batch-operation.completed';
  payload: {
    operation: 'delete' | 'move' | 'copy' | 'tag' | 'categorize';
    successCount: number;
    failureCount: number;
    duration: number;
    results: {
      success: string[];
      failed: { uuid: string; error: string }[];
    };
  };
}

// ============ 联合类型 ============

/**
 * 所有仓库事件类型
 */
export type RepositoryEvent =
  | RepositoryCreatedEvent
  | RepositoryUpdatedEvent
  | RepositoryDeletedEvent
  | RepositoryStatusChangedEvent
  | RepositorySyncStartedEvent
  | RepositorySyncCompletedEvent
  | RepositorySyncFailedEvent
  | RepositoryStatsUpdatedEvent;

/**
 * 所有资源事件类型
 */
export type ResourceEvent =
  | ResourceCreatedEvent
  | ResourceUpdatedEvent
  | ResourceDeletedEvent
  | ResourceStatusChangedEvent
  | ResourceMovedEvent
  | ResourceAccessedEvent
  | ResourceTagsUpdatedEvent
  | ResourceReferenceCreatedEvent
  | ResourceReferenceDeletedEvent
  | LinkedContentAddedEvent
  | LinkedContentRemovedEvent
  | LinkedContentAccessibilityCheckedEvent;

/**
 * 所有Git事件类型
 */
export type GitEvent =
  | GitCommittedEvent
  | GitBranchCreatedEvent
  | GitBranchSwitchedEvent
  | GitPushedEvent
  | GitPulledEvent;

/**
 * 所有批量操作事件类型
 */
export type BatchOperationEvent = BatchOperationStartedEvent | BatchOperationCompletedEvent;

/**
 * 所有仓储模块事件类型
 */
export type AllRepositoryModuleEvents =
  | RepositoryEvent
  | ResourceEvent
  | GitEvent
  | BatchOperationEvent;
