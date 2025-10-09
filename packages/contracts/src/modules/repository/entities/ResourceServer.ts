/**
 * Resource Entity - Server Interface
 * 资源实体 - 服务端接口
 */

import type { ResourceType, ResourceStatus } from '../enums';

// ============ 值对象接口 ============

/**
 * 资源元数据
 */
export interface ResourceMetadata {
  mimeType?: string | null;
  encoding?: string | null;
  thumbnailPath?: string | null;
  isFavorite?: boolean;
  accessCount?: number;
  lastAccessedAt?: number | null; // epoch ms
  [key: string]: any;
}

// ============ DTO 定义 ============

/**
 * Resource Server DTO
 */
export interface ResourceServerDTO {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string | null;
  author?: string | null;
  version?: string | null;
  tags: string[];
  category?: string | null;
  status: ResourceStatus;
  metadata: ResourceMetadata;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  modifiedAt?: number | null; // epoch ms
}

/**
 * Resource Persistence DTO (数据库映射)
 */
export interface ResourcePersistenceDTO {
  uuid: string;
  repository_uuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string | null;
  author?: string | null;
  version?: string | null;
  tags: string; // JSON string
  category?: string | null;
  status: ResourceStatus;
  metadata: string; // JSON string
  created_at: number;
  updated_at: number;
  modified_at?: number | null;
}

// ============ 实体接口 ============

/**
 * Resource 实体 - Server 接口
 */
export interface ResourceServer {
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string | null;
  author?: string | null;
  version?: string | null;
  tags: string[];
  category?: string | null;
  status: ResourceStatus;
  metadata: ResourceMetadata;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;

  // ===== 业务方法 =====

  // 内容管理
  updateContent(content: string | Uint8Array): Promise<void>;
  move(newPath: string): Promise<void>;
  rename(newName: string): void;

  // 元数据管理
  updateMetadata(metadata: Partial<ResourceMetadata>): void;
  toggleFavorite(): void;
  incrementAccessCount(): void;

  // 标签和分类
  addTag(tag: string): void;
  removeTag(tag: string): void;
  setCategory(category: string): void;

  // 状态管理
  archive(): void;
  activate(): void;
  markAsDeleted(): void;

  // 版本管理
  updateVersion(version: string): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ResourceServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ResourcePersistenceDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ResourceServerDTO): ResourceServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ResourcePersistenceDTO): ResourceServer;
}
