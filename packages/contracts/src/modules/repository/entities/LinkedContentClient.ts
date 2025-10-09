/**
 * LinkedContent Entity - Client Interface
 * 关联内容实体 - 客户端接口
 */

import type { ContentType } from '../enums';
import type { LinkedContentServerDTO } from './LinkedContentServer';

// ============ DTO 定义 ============

/**
 * LinkedContent Client DTO
 */
export interface LinkedContentClientDTO {
  uuid: string;
  resourceUuid: string;
  title: string;
  url: string;
  contentType: ContentType;
  description?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  publishedAt?: number | null;
  isAccessible: boolean;
  lastCheckedAt?: number | null;
  cachedAt?: number | null;
  createdAt: number;
  updatedAt?: number | null;

  // UI 格式化属性
  contentTypeLabel: string;
  formattedPublishedAt?: string;
  formattedLastChecked?: string;
  formattedCreatedAt: string;
  accessibilityStatusIcon: string;
  domain: string;
}

// ============ 实体接口 ============

/**
 * LinkedContent 实体 - Client 接口
 */
export interface LinkedContentClient {
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

  // 时间戳
  createdAt: number;
  updatedAt?: number | null;

  // UI 属性
  contentTypeLabel: string;
  formattedPublishedAt?: string;
  formattedLastChecked?: string;
  formattedCreatedAt: string;
  accessibilityStatusIcon: string;
  domain: string;

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
  }): LinkedContentClient;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): LinkedContentServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): LinkedContentClientDTO;

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: LinkedContentServerDTO): LinkedContentClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: LinkedContentClientDTO): LinkedContentClient;
}
