/**
 * Repository Module - Domain Server Layer
 *
 * 导出领域层的所有公共接口和实现
 */

// ===== 聚合根 =====
export { Repository as RepositoryAggregate } from './aggregates/Repository';

// ===== 实体 =====
export { Resource as ResourceEntity } from './entities/Resource';
export { RepositoryExplorerEntity } from './entities/RepositoryExplorer';
export { ResourceReference as ResourceReferenceEntity } from './entities/ResourceReference';
export { LinkedContent as LinkedContentEntity } from './entities/LinkedContent';

// ===== 值对象 =====
export { RepositoryConfig } from './value-objects/RepositoryConfig';
export { RepositoryStats } from './value-objects/RepositoryStats';
export { SyncStatus } from './value-objects/SyncStatus';
export { GitInfo } from './value-objects/GitInfo';

// ===== 领域服务 =====
export { RepositoryDomainService } from './services/RepositoryDomainService';

// ===== 仓储接口 =====
export { type IRepositoryRepository } from './repositories/IRepositoryRepository';

// ===== 类型导出（从 contracts 重新导出，方便使用） =====
// 注意：类型需要从 RepositoryContracts 命名空间导出
import type { RepositoryContracts } from '@dailyuse/contracts';

export type RepositoryType = RepositoryContracts.RepositoryType;
export type RepositoryStatus = RepositoryContracts.RepositoryStatus;
export type ResourceType = RepositoryContracts.ResourceType;
export type ResourceStatus = RepositoryContracts.ResourceStatus;
export type ReferenceType = RepositoryContracts.ReferenceType;
export type ContentType = RepositoryContracts.ContentType;
