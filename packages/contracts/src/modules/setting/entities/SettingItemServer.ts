/**
 * SettingItem Entity - Server Interface
 * 设置项实体 - 服务端接口
 */

import type { SettingItemClientDTO } from './SettingItemClient';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/UIConfigServer';
import { SettingValueType } from '../enums';

// ============ DTO 定义 ============

/**
 * SettingItem Server DTO
 */
export interface SettingItemServerDTO {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServerDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * SettingItem Persistence DTO
 */
export interface SettingItemPersistenceDTO {
  uuid: string;
  group_uuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: string; // JSON
  default_value: string; // JSON
  value_type: SettingValueType;
  ui: string; // JSON
  sort_order: number;
  is_read_only: boolean;
  is_visible: boolean;
  created_at: number;
  updated_at: number;
}

// ============ 实体接口 ============

export interface SettingItemServer {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServer;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;

  // 业务方法
  setValue(newValue: any): void;
  resetToDefault(): void;
  isDefault(): boolean;

  toServerDTO(): SettingItemServerDTO;
  toClientDTO(): SettingItemClientDTO;
  toPersistenceDTO(): SettingItemPersistenceDTO;
}

export interface SettingItemServerStatic {
  create(params: {
    groupUuid: string;
    key: string;
    name: string;
    description?: string;
    value: any;
    defaultValue: any;
    valueType: SettingValueType;
    ui: UIConfigServer;
    sortOrder?: number;
    isReadOnly?: boolean;
    isVisible?: boolean;
  }): SettingItemServer;
  fromServerDTO(dto: SettingItemServerDTO): SettingItemServer;
  fromPersistenceDTO(dto: SettingItemPersistenceDTO): SettingItemServer;
}
