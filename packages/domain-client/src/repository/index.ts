/**
 * Repository Domain Client
 * 仓储模块客户端实现
 */

// 聚合根
export { Repository } from './aggregates/Repository';

// 实体
export { Resource } from './entities/Resource';
export { LinkedContent } from './entities/LinkedContent';
export { ResourceReference } from './entities/ResourceReference';
export { RepositoryExplorer } from './entities/RepositoryExplorer';

// 值对象
export { RepositoryConfig } from './value-objects/RepositoryConfig';
export { GitInfo } from './value-objects/GitInfo';
export { SyncStatus } from './value-objects/SyncStatus';
export { RepositoryStats } from './value-objects/RepositoryStats';
