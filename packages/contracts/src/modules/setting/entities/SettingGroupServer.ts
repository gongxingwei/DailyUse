/**
 * SettingGroup Entity - Server Interface
 * 设置分组实体 - 服务端接口
 */

import type { SettingItemServer, SettingItemServerDTO } from './SettingItemServer';

// ============ DTO 定义 ============

/**
 * SettingGroup Server DTO
 */
export interface SettingGroupServerDTO {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemServerDTO[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/**
 * SettingGroup Persistence DTO
 */
export interface SettingGroupPersistenceDTO {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parent_group_uuid?: string | null;
  path: string;
  level: number;
  sort_order: number;
  settings: string; // JSON
  is_system_group: boolean;
  is_collapsed: boolean;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// ============ 实体接口 ============

export interface SettingGroupServer {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemServer[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // 业务方法
  addSetting(setting: SettingItemServer): void;
  removeSetting(settingUuid: string): void;
  reorderSettings(settingUuids: string[]): void;
  getSettings(): SettingItemServer[];
  getSettingByKey(key: string): SettingItemServer | null;
  collapse(): void;
  expand(): void;
  softDelete(): void;
  restore(): void;

  toServerDTO(): SettingGroupServerDTO;
  toPersistenceDTO(): SettingGroupPersistenceDTO;
}

export interface SettingGroupServerStatic {
  create(params: {
    name: string;
    description?: string;
    icon?: string;
    parentGroupUuid?: string;
    path: string;
    level: number;
    sortOrder?: number;
    isSystemGroup?: boolean;
  }): SettingGroupServer;
  fromServerDTO(dto: SettingGroupServerDTO): SettingGroupServer;
  fromPersistenceDTO(dto: SettingGroupPersistenceDTO): SettingGroupServer;
}
