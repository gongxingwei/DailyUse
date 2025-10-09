/**
 * RepositoryExplorer Entity - Client Interface
 * 仓库浏览器实体 - 客户端接口
 */

import type {
  ResourceFilters,
  ExplorerViewConfig,
  RepositoryExplorerServerDTO,
} from './RepositoryExplorerServer';

// ============ DTO 定义 ============

/**
 * RepositoryExplorer Client DTO
 */
export interface RepositoryExplorerClientDTO {
  uuid: string;
  repositoryUuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  currentPath: string;
  filters: ResourceFilters;
  viewConfig: ExplorerViewConfig;
  pinnedPaths: string[];
  recentPaths: string[];
  lastScanAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化属性
  displayPath: string;
  pathBreadcrumbs: string[];
  formattedLastScan?: string;
  activeFiltersCount: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

// ============ 实体接口 ============

/**
 * RepositoryExplorer 实体 - Client 接口
 */
export interface RepositoryExplorerClient {
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  currentPath: string;

  // 配置
  filters: ResourceFilters;
  viewConfig: ExplorerViewConfig;
  pinnedPaths: string[];
  recentPaths: string[];

  // 时间戳
  lastScanAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 属性
  displayPath: string;
  pathBreadcrumbs: string[];
  formattedLastScan?: string;
  activeFiltersCount: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryExplorerServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): RepositoryExplorerClientDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorerClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: RepositoryExplorerClientDTO): RepositoryExplorerClient;
}
