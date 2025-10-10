/**
 * RepositoryExplorer Entity - Server Interface
 * 仓库浏览器实体 - 服务端接口
 */

import type { ResourceType } from '../enums';

// ============ 值对象接口 ============

/**
 * 资源过滤器
 */
export interface ResourceFilters {
  type?: ResourceType[];
  tags?: string[];
  status?: string;
  keyword?: string;
  dateRange?: {
    start: number; // epoch ms
    end: number; // epoch ms
  };
  sizeRange?: { min: number; max: number };
  isFavorite?: boolean;
}

/**
 * 浏览器视图配置
 */
export interface ExplorerViewConfig {
  viewMode: 'list' | 'grid' | 'tree';
  sortBy: 'name' | 'size' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
  groupBy?: 'type' | 'category' | 'tag' | null;
  showHidden: boolean;
  columnWidths?: Record<string, number>;
}

// ============ DTO 定义 ============

/**
 * RepositoryExplorer Server DTO
 */
export interface RepositoryExplorerServerDTO {
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
  lastScanAt?: number | null; // epoch ms
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * RepositoryExplorer Persistence DTO (数据库映射)
 */
export interface RepositoryExplorerPersistenceDTO {
  uuid: string;
  repository_uuid: string;
  account_uuid: string;
  name: string;
  description?: string | null;
  current_path: string;
  filters: string; // JSON string
  view_config: string; // JSON string
  pinned_paths: string; // JSON string
  recent_paths: string; // JSON string
  last_scan_at?: number | null;
  created_at: number;
  updated_at: number;
}

// ============ 实体接口 ============

/**
 * RepositoryExplorer 实体 - Server 接口
 */
export interface RepositoryExplorerServer {
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

  // 时间戳 (统一使用 number epoch ms)
  lastScanAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 导航
  navigateTo(path: string): void;
  navigateUp(): void;
  navigateBack(): void;
  navigateForward(): void;

  // 过滤器管理
  updateFilters(filters: Partial<ResourceFilters>): void;
  clearFilters(): void;

  // 视图配置
  updateViewConfig(config: Partial<ExplorerViewConfig>): void;
  resetViewConfig(): void;

  // 路径管理
  pinPath(path: string): void;
  unpinPath(path: string): void;
  addToRecent(path: string): void;
  clearRecent(): void;

  // 扫描
  scan(): Promise<void>;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryExplorerServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): RepositoryExplorerPersistenceDTO;
}

/**
 * RepositoryExplorer 静态工厂方法接口
 */
export interface RepositoryExplorerServerStatic {
  /**
   * 创建新的 RepositoryExplorer 实体（静态工厂方法）
   */
  create(params: {
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorerServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: RepositoryExplorerPersistenceDTO): RepositoryExplorerServer;
}
