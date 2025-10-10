/**
 * Repository Domain Client
 * 仓储模块客户端实现
 */

// 聚合根
export { Repository as RepositoryClient } from './aggregates/Repository';

// 实体
export { Resource as ResourceClient } from './entities/Resource';
export { LinkedContent as LinkedContentClient } from './entities/LinkedContent';
export { ResourceReference as ResourceReferenceClient } from './entities/ResourceReference';
export { RepositoryExplorer as RepositoryExplorerClient } from './entities/RepositoryExplorer';

// 值对象
export { RepositoryConfig as RepositoryConfigClient } from './value-objects/RepositoryConfig';
export { GitInfo as GitInfoClient } from './value-objects/GitInfo';
export { SyncStatus as SyncStatusClient } from './value-objects/SyncStatus';
export { RepositoryStats as RepositoryStatsClient } from './value-objects/RepositoryStats';
