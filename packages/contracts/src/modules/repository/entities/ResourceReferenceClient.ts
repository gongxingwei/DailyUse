/**
 * ResourceReference Entity - Client Interface
 * 资源引用实体 - 客户端接口
 */

import type { ReferenceType } from '../enums';
import type { ResourceReferenceServerDTO } from './ResourceReferenceServer';

// ============ DTO 定义 ============

/**
 * ResourceReference Client DTO
 */
export interface ResourceReferenceClientDTO {
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string | null;
  createdAt: number;
  updatedAt?: number | null;
  lastVerifiedAt?: number | null;

  // UI 格式化属性
  referenceTypeLabel: string;
  formattedCreatedAt: string;
  formattedLastVerified?: string;
  isVerified: boolean;
}

// ============ 实体接口 ============

/**
 * ResourceReference 实体 - Client 接口
 */
export interface ResourceReferenceClient {
  // 基础属性
  uuid: string;
  sourceResourceUuid: string;
  targetResourceUuid: string;
  referenceType: ReferenceType;
  description?: string | null;

  // 时间戳
  createdAt: number;
  updatedAt?: number | null;
  lastVerifiedAt?: number | null;

  // UI 属性
  referenceTypeLabel: string;
  formattedCreatedAt: string;
  formattedLastVerified?: string;
  isVerified: boolean;

  // ===== 工厂方法 =====

  /**
   * 创建新的 ResourceReference 实体（静态工厂方法）
   */
  create(params: {
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string;
  }): ResourceReferenceClient;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ResourceReferenceServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): ResourceReferenceClientDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReferenceClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: ResourceReferenceClientDTO): ResourceReferenceClient;
}
