/**
 * Repository Config Value Object
 * 仓库配置值对象
 */

import type { ResourceType } from '../enums';

// ============ 接口定义 ============

/**
 * 仓库配置 - Server 接口
 */
export interface IRepositoryConfigServer {
  enableGit: boolean;
  autoSync: boolean;
  syncInterval?: number | null;
  defaultLinkedDocName: string;
  supportedFileTypes: ResourceType[];
  maxFileSize: number;
  enableVersionControl: boolean;

  // 值对象方法
  equals(other: IRepositoryConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IRepositoryConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IRepositoryConfigServer;

  // DTO 转换方法
  toServerDTO(): RepositoryConfigServerDTO;
  toClientDTO(): RepositoryConfigClientDTO;
  toPersistenceDTO(): RepositoryConfigPersistenceDTO;
}

/**
 * 仓库配置 - Client 接口
 */
export interface IRepositoryConfigClient {
  enableGit: boolean;
  autoSync: boolean;
  supportedFileTypes: ResourceType[];

  // UI 辅助属性
  syncIntervalFormatted?: string | null; // "每 5 分钟"
  maxFileSizeFormatted: string; // "100 MB"

  // 值对象方法
  equals(other: IRepositoryConfigClient): boolean;

  // DTO 转换方法
  toServerDTO(): RepositoryConfigServerDTO;
}

// ============ DTO 定义 ============

/**
 * Repository Config Server DTO
 */
export interface RepositoryConfigServerDTO {
  enableGit: boolean;
  autoSync: boolean;
  syncInterval?: number | null;
  defaultLinkedDocName: string;
  supportedFileTypes: ResourceType[];
  maxFileSize: number;
  enableVersionControl: boolean;
}

/**
 * Repository Config Client DTO
 */
export interface RepositoryConfigClientDTO {
  enableGit: boolean;
  autoSync: boolean;
  supportedFileTypes: ResourceType[];
  syncIntervalFormatted?: string | null;
  maxFileSizeFormatted: string;
}

/**
 * Repository Config Persistence DTO
 */
export interface RepositoryConfigPersistenceDTO {
  enable_git: boolean;
  auto_sync: boolean;
  sync_interval?: number | null;
  default_linked_doc_name: string;
  supported_file_types: string; // JSON.stringify(ResourceType[])
  max_file_size: number;
  enable_version_control: boolean;
}

// ============ 类型导出 ============

export type RepositoryConfigServer = IRepositoryConfigServer;
export type RepositoryConfigClient = IRepositoryConfigClient;
