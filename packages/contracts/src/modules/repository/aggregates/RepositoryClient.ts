/**
 * Repository Aggregate Root - Client Interface
 * 仓储聚合根 - 客户端接口
 */

import type {
  RepositoryType,
  RepositoryStatus,
} from '../enums';
import type {
  RepositoryConfig,
  RepositoryStats,
  SyncStatus,
  GitInfo,
  RepositoryServerDTO,
} from './RepositoryServer';

// ============ DTO 定义 ============

/**
 * Repository Client DTO
 */
export interface RepositoryClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfig;
  relatedGoals?: string[] | null;
  status: RepositoryStatus;
  git?: GitInfo | null;
  syncStatus?: SyncStatus | null;
  stats: RepositoryStats;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化属性
  formattedLastAccessed?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayPath: string;
  statusLabel: string;
  typeLabel: string;
}

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Client 接口
 */
export interface RepositoryClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  
  // 配置
  config: RepositoryConfig;
  relatedGoals?: string[] | null;
  
  // 状态
  status: RepositoryStatus;
  git?: GitInfo | null;
  syncStatus?: SyncStatus | null;
  stats: RepositoryStats;
  
  // 时间戳
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 属性
  formattedLastAccessed?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayPath: string;
  statusLabel: string;
  typeLabel: string;
  
  // ===== 转换方法 (To) =====
  
  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryServerDTO;
  
  /**
   * 转换为 Client DTO
   */
  toClientDTO(): RepositoryClientDTO;
  
  // ===== 转换方法 (From - 静态工厂) =====
  
  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: RepositoryServerDTO): RepositoryClient;
  
  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: RepositoryClientDTO): RepositoryClient;
}
