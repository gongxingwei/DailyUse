/**
 * Repository Stats Value Object
 * 仓库统计信息值对象
 */

import type { ResourceType, ResourceStatus } from '../enums';

// ============ 接口定义 ============

/**
 * 仓库统计信息 - Server 接口
 */
export interface IRepositoryStatsServer {
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByStatus: Record<ResourceStatus, number>;
  totalSize: number;
  recentActiveResources: number;
  favoriteResources: number;
  lastUpdated: number; // epoch ms

  // 值对象方法
  equals(other: IRepositoryStatsServer): boolean;
  with(
    updates: Partial<
      Omit<
        IRepositoryStatsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IRepositoryStatsServer;

  // DTO 转换方法
  toServerDTO(): RepositoryStatsServerDTO;
  toClientDTO(): RepositoryStatsClientDTO;
  toPersistenceDTO(): RepositoryStatsPersistenceDTO;
}

/**
 * 仓库统计信息 - Client 接口
 */
export interface IRepositoryStatsClient {
  totalResources: number;
  totalSize: number;
  totalSizeFormatted: string; // "1.5 GB"
  favoriteCount: number;
  recentCount: number;
  resourcesByType: Record<ResourceType, number>;

  // UI 辅助方法
  getTypePercentage(type: ResourceType): number;
  getMostUsedType(): ResourceType | null;

  // 值对象方法
  equals(other: IRepositoryStatsClient): boolean;

  // DTO 转换方法
  toServerDTO(): RepositoryStatsServerDTO;
}

// ============ DTO 定义 ============

/**
 * Repository Stats Server DTO
 */
export interface RepositoryStatsServerDTO {
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByStatus: Record<ResourceStatus, number>;
  totalSize: number;
  recentActiveResources: number;
  favoriteResources: number;
  lastUpdated: number;
}

/**
 * Repository Stats Client DTO
 */
export interface RepositoryStatsClientDTO {
  totalResources: number;
  totalSize: number;
  totalSizeFormatted: string;
  favoriteCount: number;
  recentCount: number;
  resourcesByType: Record<ResourceType, number>;
}

/**
 * Repository Stats Persistence DTO
 */
export interface RepositoryStatsPersistenceDTO {
  total_resources: number;
  resources_by_type: string; // JSON.stringify(Record<ResourceType, number>)
  resources_by_status: string; // JSON.stringify(Record<ResourceStatus, number>)
  total_size: number;
  recent_active_resources: number;
  favorite_resources: number;
  last_updated: number;
}

// ============ 类型导出 ============

export type RepositoryStatsServer = IRepositoryStatsServer;
export type RepositoryStatsClient = IRepositoryStatsClient;
