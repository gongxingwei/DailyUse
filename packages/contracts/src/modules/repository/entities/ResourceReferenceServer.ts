/**
 * ResourceReference Entity - Server Interface
 * 资源引用实体 - 服务端接口
 */

import type { ReferenceType } from '../enums';
import type { ResourceReferenceClientDTO } from './ResourceReferenceClient';

// ============ DTO 定义 ============

/**
 * ResourceReference Server DTO
 */
export interface ResourceReferenceServerDTO {
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string | null;
  createdAt: number; // epoch ms
  updatedAt?: number | null; // epoch ms
  lastVerifiedAt?: number | null; // epoch ms
}

/**
 * ResourceReference Persistence DTO (数据库映射)
 */
export interface ResourceReferencePersistenceDTO {
  uuid: string;
  source_resource_uuid: string;
  target_resource_uuid: string;
  reference_type: ReferenceType;
  description?: string | null;
  created_at: number;
  updated_at?: number | null;
  last_verified_at?: number | null;
}

// ============ 实体接口 ============

/**
 * ResourceReference 实体 - Server 接口
 */
export interface ResourceReferenceServer {
  // 基础属性
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: number;
  updatedAt?: number | null;
  lastVerifiedAt?: number | null;

  // ===== 业务方法 =====

  // 引用管理
  updateDescription(description: string): void;
  changeReferenceType(type: ReferenceType): void;

  // 验证
  verify(): Promise<boolean>;
  markAsVerified(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ResourceReferenceServerDTO;

  toClientDTO(): ResourceReferenceClientDTO;
  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ResourceReferencePersistenceDTO;
}

/**
 * ResourceReference 静态工厂方法接口
 */
export interface ResourceReferenceServerStatic {
  /**
   * 创建新的 ResourceReference 实体（静态工厂方法）
   */
  create(params: {
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string;
  }): ResourceReferenceServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReferenceServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ResourceReferencePersistenceDTO): ResourceReferenceServer;
}
