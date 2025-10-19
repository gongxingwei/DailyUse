/**
 * Repository Module - Domain Server Layer
 *
 * 导出领域层的所有公共接口和实现
 */

// ===== 聚合根 =====
export { Repository } from './aggregates/Repository';
export { RepositoryStatistics } from './aggregates/RepositoryStatistics';

// ===== 实体 =====
export { Resource } from './entities/Resource';
export { RepositoryExplorerEntity } from './entities/RepositoryExplorer';
export { ResourceReference } from './entities/ResourceReference';
export { LinkedContent } from './entities/LinkedContent';

// ===== 值对象 =====
export { RepositoryConfig } from './value-objects/RepositoryConfig';
export { RepositoryStats } from './value-objects/RepositoryStats';
export { SyncStatus } from './value-objects/SyncStatus';
export { GitInfo } from './value-objects/GitInfo';

// ===== 领域服务 =====
export { RepositoryDomainService } from './services/RepositoryDomainService';
export { RepositoryStatisticsDomainService } from './services/RepositoryStatisticsDomainService';

// ===== 仓储接口 =====
export { type IRepositoryRepository } from './repositories/IRepositoryRepository';
export { type IRepositoryStatisticsRepository } from './repositories/IRepositoryStatisticsRepository';

// ===== 基础设施层 =====
export {
  PrismaRepositoryRepository,
  RepositoryMapper,
  GitService,
  FileSystemService,
} from './infrastructure';

export type {
  PrismaRepository,
  PrismaRepositoryWithRelations,
  GitStatusInfo,
  GitInitOptions,
  FileStats,
  ScanOptions,
} from './infrastructure';

// ===== 类型导出（从 contracts 重新导出，方便使用） =====
// 注意：类型需要从 RepositoryContracts 命名空间导出
import type { RepositoryContracts } from '@dailyuse/contracts';

export type RepositoryType = RepositoryContracts.RepositoryType;
export type RepositoryStatus = RepositoryContracts.RepositoryStatus;
export type ResourceType = RepositoryContracts.ResourceType;
export type ResourceStatus = RepositoryContracts.ResourceStatus;
export type ReferenceType = RepositoryContracts.ReferenceType;
export type ContentType = RepositoryContracts.ContentType;
