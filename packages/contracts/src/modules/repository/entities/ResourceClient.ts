/**
 * Resource Entity - Client Interface
 * 资源实体 - 客户端接口
 */

import type { ResourceType, ResourceStatus } from '../enums';
import type { ResourceMetadata, ResourceServerDTO } from './ResourceServer';
import type {
  ResourceReferenceClient,
  ResourceReferenceClientDTO,
} from './ResourceReferenceClient';
import type { LinkedContentClient, LinkedContentClientDTO } from './LinkedContentClient';

// ============ DTO 定义 ============

/**
 * Resource Client DTO
 */
export interface ResourceClientDTO {
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
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;

  // UI 格式化属性
  formattedSize: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedModifiedAt?: string;
  fileExtension: string;
  typeLabel: string;
  statusLabel: string;
  isFavorite: boolean;

  // ===== 子实体 DTO =====
  references?: ResourceReferenceClientDTO[] | null; // 资源引用列表（可选加载）
  linkedContents?: LinkedContentClientDTO[] | null; // 关联内容列表（可选加载）
}

// ============ 实体接口 ============

/**
 * Resource 实体 - Client 接口
 */
export interface ResourceClient {
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

  // 时间戳
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;

  // UI 属性
  formattedSize: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedModifiedAt?: string;
  fileExtension: string;
  typeLabel: string;
  statusLabel: string;
  isFavorite: boolean;

  // ===== 子实体集合 =====

  /**
   * 资源引用列表（懒加载，可选）
   */
  references?: ResourceReferenceClient[] | null;

  /**
   * 关联内容列表（懒加载，可选）
   */
  linkedContents?: LinkedContentClient[] | null;

  // ===== 工厂方法 =====

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
  }): ResourceClient;

  /**
   * 创建子实体：ResourceReference（通过实体创建）
   */
  createReference(params: {
    targetResourceUuid: string;
    referenceType: string;
    description?: string;
  }): ResourceReferenceClient;

  /**
   * 创建子实体：LinkedContent（通过实体创建）
   */
  createLinkedContent(params: {
    title: string;
    url: string;
    contentType: string;
    description?: string;
  }): LinkedContentClient;

  // ===== 子实体管理方法 =====

  /**
   * 添加引用
   */
  addReference(reference: ResourceReferenceClient): void;

  /**
   * 移除引用
   */
  removeReference(referenceUuid: string): ResourceReferenceClient | null;

  /**
   * 获取所有引用
   */
  getAllReferences(): ResourceReferenceClient[];

  /**
   * 添加关联内容
   */
  addLinkedContent(content: LinkedContentClient): void;

  /**
   * 移除关联内容
   */
  removeLinkedContent(contentUuid: string): LinkedContentClient | null;

  /**
   * 获取所有关联内容
   */
  getAllLinkedContents(): LinkedContentClient[];

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): ResourceServerDTO;

  /**
   * 转换为 Client DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): ResourceClientDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: ResourceServerDTO): ResourceClient;

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  fromClientDTO(dto: ResourceClientDTO): ResourceClient;
}
