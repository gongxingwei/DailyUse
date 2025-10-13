/**
 * Repository Module - Contracts
 * 仓储模块契约定义
 *
 * 统一导出所有 Repository 模块的契约定义
 */

// ============ 枚举 ============
export * from './enums';

// ============ 聚合根 ============
export * from './aggregates/RepositoryServer';
export * from './aggregates/RepositoryClient';
export * from './aggregates/RepositoryStatisticsServer';
export * from './aggregates/RepositoryStatisticsClient';

// ============ 实体 ============
export * from './entities/ResourceServer';
export * from './entities/ResourceClient';
export * from './entities/ResourceReferenceServer';
export * from './entities/ResourceReferenceClient';
export * from './entities/LinkedContentServer';
export * from './entities/LinkedContentClient';
export * from './entities/RepositoryExplorerServer';
export * from './entities/RepositoryExplorerClient';

// ============ 值对象 ============
export * from './value-objects';

// ============ API 请求/响应类型 ============
export * from './api-requests';

// 注意：领域事件已在聚合根文件中定义并导出
