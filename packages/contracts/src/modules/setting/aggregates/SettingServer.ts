/**
 * Setting Aggregate Root - Server Interface
 * 设置聚合根 - 服务端接口
 */

import type {
  ValidationRuleServer,
  ValidationRuleServerDTO,
} from '../value-objects/ValidationRuleServer';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/UIConfigServer';
import type { SyncConfigServer, SyncConfigServerDTO } from '../value-objects/SyncConfigServer';
import type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
} from '../entities/SettingHistoryServer';

// ============ DTO 定义 ============

/**
 * Setting Server DTO
 */
export interface SettingServerDTO {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleServerDTO | null;
  ui?: UIConfigServerDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigServerDTO | null;
  history?: SettingHistoryServerDTO[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/**
 * Setting Persistence DTO
 */
export interface SettingPersistenceDTO {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  value_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
  value: string; // JSON
  default_value: string; // JSON
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  account_uuid?: string | null;
  device_id?: string | null;
  group_uuid?: string | null;
  validation?: string | null; // JSON
  ui?: string | null; // JSON
  is_encrypted: boolean;
  is_read_only: boolean;
  is_system_setting: boolean;
  sync_config?: string | null; // JSON
  history: string; // JSON
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// ============ 聚合根接口 ============

export interface SettingServer {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleServer | null;
  ui?: UIConfigServer | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigServer | null;
  history?: SettingHistoryServer[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // 值管理
  setValue(newValue: any, operatorUuid?: string): void;
  resetToDefault(): void;
  getValue(): any;
  getTypedValue<T>(): T;

  // 验证
  validate(value: any): { valid: boolean; error?: string };

  // 加密
  encrypt(): void;
  decrypt(): any;

  // 同步
  sync(): Promise<void>;

  // 历史记录
  addHistory(oldValue: any, newValue: any, operatorUuid?: string): void;
  getHistory(limit?: number): SettingHistoryServer[];

  // 查询
  isDefault(): boolean;
  hasChanged(): boolean;

  toServerDTO(includeHistory?: boolean): SettingServerDTO;
  toPersistenceDTO(): SettingPersistenceDTO;
}

export interface SettingServerStatic {
  create(params: {
    key: string;
    name: string;
    description?: string;
    valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'OBJECT';
    value: any;
    defaultValue: any;
    scope: 'SYSTEM' | 'USER' | 'DEVICE';
    accountUuid?: string;
    deviceId?: string;
    groupUuid?: string;
    validation?: ValidationRuleServer;
    ui?: UIConfigServer;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfigServer;
  }): SettingServer;
  fromServerDTO(dto: SettingServerDTO): SettingServer;
  fromPersistenceDTO(dto: SettingPersistenceDTO): SettingServer;
}
