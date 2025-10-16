/**
 * SyncConfig Value Object - Server Interface
 * 同步配置值对象 - 服务端接口
 */

import type { SyncConfigClientDTO } from './SyncConfigClient';

// ============ DTO 定义 ============

/**
 * SyncConfig Server DTO
 */
export interface SyncConfigServerDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

/**
 * SyncConfig Persistence DTO
 */
export interface SyncConfigPersistenceDTO {
  enabled: boolean;
  sync_to_cloud: boolean;
  sync_to_devices: boolean;
}

// ============ 值对象接口 ============

export interface SyncConfigServer {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;

  toServerDTO(): SyncConfigServerDTO;
  toClientDTO(): SyncConfigClientDTO;
}

export interface SyncConfigServerStatic {
  create(params: {
    enabled?: boolean;
    syncToCloud?: boolean;
    syncToDevices?: boolean;
  }): SyncConfigServer;
  fromServerDTO(dto: SyncConfigServerDTO): SyncConfigServer;
  fromPersistenceDTO(dto: SyncConfigPersistenceDTO): SyncConfigServer;
}
