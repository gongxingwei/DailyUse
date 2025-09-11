/**
 * Repository Domain Server - 入口文件
 * 导出所有仓库模块的服务器端实现
 */

// 聚合根
export * from './aggregates/Repository';

// 实体
export * from './entities/Resource';

// 仓库接口
export * from './repositories/IRepositoryRepository';
export * from './repositories/IResourceRepository';

// 服务
export * from './services/RepositoryService';
