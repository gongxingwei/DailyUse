/**
 * Sync Status Value Object
 * 同步状态值对象
 */

// ============ 接口定义 ============

/**
 * 同步状态 - Server 接口
 */
export interface ISyncStatusServer {
  isSyncing: boolean;
  lastSyncAt?: number | null; // epoch ms
  syncError?: string | null;
  pendingSyncCount: number;
  conflictCount: number;

  // 值对象方法
  equals(other: ISyncStatusServer): boolean;
  with(
    updates: Partial<
      Omit<
        ISyncStatusServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ISyncStatusServer;

  // DTO 转换方法
  toServerDTO(): SyncStatusServerDTO;
  toClientDTO(): SyncStatusClientDTO;
  toPersistenceDTO(): SyncStatusPersistenceDTO;
}

/**
 * 同步状态 - Client 接口
 */
export interface ISyncStatusClient {
  isSyncing: boolean;
  syncError?: string | null;
  lastSyncAt?: number | null;

  // UI 辅助属性
  syncStatusText: string; // "同步中" / "已同步" / "同步失败"
  syncStatusColor: string;
  lastSyncFormatted?: string | null; // "2分钟前"
  hasPendingChanges: boolean;
  hasConflicts: boolean;

  // 值对象方法
  equals(other: ISyncStatusClient): boolean;

  // DTO 转换方法
  toServerDTO(): SyncStatusServerDTO;
}

// ============ DTO 定义 ============

/**
 * Sync Status Server DTO
 */
export interface SyncStatusServerDTO {
  isSyncing: boolean;
  lastSyncAt?: number | null;
  syncError?: string | null;
  pendingSyncCount: number;
  conflictCount: number;
}

/**
 * Sync Status Client DTO
 */
export interface SyncStatusClientDTO {
  isSyncing: boolean;
  syncError?: string | null;
  lastSyncAt?: number | null;
  syncStatusText: string;
  syncStatusColor: string;
  lastSyncFormatted?: string | null;
  hasPendingChanges: boolean;
  hasConflicts: boolean;
}

/**
 * Sync Status Persistence DTO
 */
export interface SyncStatusPersistenceDTO {
  is_syncing: boolean;
  last_sync_at?: number | null;
  sync_error?: string | null;
  pending_sync_count: number;
  conflict_count: number;
}

// ============ 类型导出 ============

export type SyncStatusServer = ISyncStatusServer;
export type SyncStatusClient = ISyncStatusClient;
