/**
 * Repository Module - API Request/Response DTOs
 * 仓储模块 API 请求响应类型定义
 *
 * 所有前端 API 客户端使用的类型都在这里定义
 */

import type { RepositoryServerDTO } from './aggregates/RepositoryServer';
import type { ResourceServerDTO } from './entities/ResourceServer';
import type { ResourceReferenceServerDTO } from './entities/ResourceReferenceServer';
import type { RepositoryType, ResourceType, ResourceStatus, ReferenceType } from './enums';
import type { GitStatusInfo } from './aggregates/RepositoryServer';

// ============ API 响应类型（服务端返回给前端）============

/**
 * 单个仓库响应
 */
export type RepositoryDTO = RepositoryServerDTO;

/**
 * 仓库列表响应
 */
export interface RepositoryListResponseDTO {
  repositories: RepositoryServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 单个资源响应
 */
export type ResourceDTO = ResourceServerDTO;

/**
 * 资源列表响应
 */
export interface ResourceListResponseDTO {
  resources: ResourceServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 资源引用响应
 */
export type ResourceReferenceDTO = ResourceReferenceServerDTO;

/**
 * 资源引用列表响应
 */
export interface ResourceReferenceListResponseDTO {
  references: ResourceReferenceServerDTO[];
  total: number;
}

/**
 * Git 状态响应
 */
export type GitStatusResponseDTO = GitStatusInfo;

/**
 * Git 提交响应
 */
export interface GitCommitDTO {
  hash: string;
  message: string;
  author: string;
  date: number;
}

// ============ API 请求类型（前端发送给服务端）============

/**
 * 创建仓库请求
 */
export interface CreateRepositoryRequestDTO {
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: any;
}

/**
 * 更新仓库请求
 */
export interface UpdateRepositoryRequestDTO {
  name?: string;
  path?: string;
  description?: string;
  config?: any;
}

/**
 * 创建资源请求
 */
export interface CreateResourceRequestDTO {
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  description?: string;
  tags?: string[];
  content?: string | Uint8Array;
}

/**
 * 更新资源请求
 */
export interface UpdateResourceRequestDTO {
  name?: string;
  description?: string;
  tags?: string[];
  status?: ResourceStatus;
}

/**
 * 资源查询参数
 */
export interface ResourceQueryParamsDTO {
  repositoryUuid?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  keyword?: string;
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * 创建资源引用请求
 */
export interface CreateResourceReferenceRequestDTO {
  resourceUuid: string;
  targetUuid: string;
  type: ReferenceType;
  description?: string;
}
