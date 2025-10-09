/**
 * LinkedContent Entity - Server Interface
 * 关联内容实体 - 服务端接口
 */

import type { ContentType } from '../enums';

// ============ DTO 定义 ============

/**
 * LinkedContent Server DTO
 */
export interface LinkedContentServerDTO {
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: ContentType;
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  publishedAt?: number | null; // epoch ms
  isAccessible: boolean;
  lastCheckedAt?: number | null; // epoch ms
  cachedAt?: number | null; // epoch ms
  createdAt: number; // epoch ms
  updatedAt?: number | null; // epoch ms
}

/**
 * LinkedContent Persistence DTO (数据库映射)
 */
export interface LinkedContentPersistenceDTO {
  uuid: string;
  resource_uuid: string;
  title: string;
  url: string;
  content_type: ContentType;
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  published_at?: number | null;
  is_accessible: number; // 0 or 1
  last_checked_at?: number | null;
  cached_at?: number | null;
  created_at: number;
  updated_at?: number | null;
}

// ============ 实体接口 ============

/**
 * LinkedContent 实体 - Server 接口
 */
export interface LinkedContentServer {
  // 基础属性
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: ContentType;
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  publishedAt?: number | null;

  // 状态
  isAccessible: boolean;
  lastCheckedAt?: number | null;
  cachedAt?: number | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: number;
  updatedAt?: number | null;

  // ===== 工厂方法 =====

  /**
   * 创建新的 LinkedContent 实体（静态工厂方法）
   */
  create(params: {
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): LinkedContentServer;

  // ===== 业务方法 =====

  // 内容管理
  updateMetadata(metadata: {
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): void;

  // 可访问性检查
  checkAccessibility(): Promise<boolean>;
  markAsAccessible(): void;
  markAsInaccessible(): void;

  // 缓存管理
  cache(): Promise<void>;
  clearCache(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): LinkedContentServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): LinkedContentPersistenceDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: LinkedContentServerDTO): LinkedContentServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: LinkedContentPersistenceDTO): LinkedContentServer;
}
