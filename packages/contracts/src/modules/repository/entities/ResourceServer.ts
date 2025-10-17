/**
 * Resource Entity - Server Interface
 * 资源实体 - 服务端接口
 */

import type { ResourceType, ResourceStatus } from '../enums';
import type {
  ResourceReferenceServer,
  ResourceReferenceServerDTO,
} from './ResourceReferenceServer';
import type { LinkedContentServer, LinkedContentServerDTO } from './LinkedContentServer';
import type { ResourceClientDTO } from './ResourceClient';

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

  // ===== 子实体 DTO =====
  references?: ResourceReferenceServerDTO[] | null; // 资源引用列表（可选加载）
  linkedContents?: LinkedContentServerDTO[] | null; // 关联内容列表（可选加载）
}

/**
 * Resource Persistence DTO (数据库映射)
 */
export interface ResourcePersistenceDTO {
  uuid: string;
  repositoryUuid: string;
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
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
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

  // ===== 子实体集合 =====

  /**
   * 资源引用列表（懒加载，可选）
   */
  references?: ResourceReferenceServer[] | null;

  /**
   * 关联内容列表（懒加载，可选）
   */
  linkedContents?: LinkedContentServer[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：ResourceReference（通过实体创建）
   */
  createReference(params: {
    targetResourceUuid: string;
    referenceType: string;
    description?: string;
  }): ResourceReferenceServer;

  /**
   * 创建子实体：LinkedContent（通过实体创建）
   */
  createLinkedContent(params: {
    title: string;
    url: string;
    contentType: string;
    description?: string;
  }): LinkedContentServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加引用
   */
  addReference(reference: ResourceReferenceServer): void;

  /**
   * 移除引用
   */
  removeReference(referenceUuid: string): ResourceReferenceServer | null;

  /**
   * 获取所有引用
   */
  getAllReferences(): ResourceReferenceServer[];

  /**
   * 添加关联内容
   */
  addLinkedContent(content: LinkedContentServer): void;

  /**
   * 移除关联内容
   */
  removeLinkedContent(contentUuid: string): LinkedContentServer | null;

  /**
   * 获取所有关联内容
   */
  getAllLinkedContents(): LinkedContentServer[];

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
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): ResourceServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ResourcePersistenceDTO;
}

/**
 * Resource 静态工厂方法接口
 */
export interface ResourceServerStatic {
  /**
   * 创建新的 Resource 实体（静态工厂方法）
   */
  create(params: {
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): ResourceServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: ResourceServerDTO): ResourceServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ResourcePersistenceDTO): ResourceServer;
}
