/**
 * Resource Entity - Client Interface
 * 资源实体 - 客户端接口
 */

import type { ResourceType, ResourceStatus } from '../enums';
import type { ResourceMetadata, ResourceServerDTO } from './ResourceServer';

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

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ResourceServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): ResourceClientDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ResourceServerDTO): ResourceClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: ResourceClientDTO): ResourceClient;
}
