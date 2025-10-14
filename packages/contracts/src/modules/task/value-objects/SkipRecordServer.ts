/**
 * SkipRecord Value Object - Server Interface
 * 跳过记录值对象 - 服务端接口
 */

import type { SkipRecordClientDTO } from './SkipRecordClient';

// ============ 接口定义 ============

export interface SkipRecordServer {
  skippedAt: number;
  reason?: string | null;

  equals(other: SkipRecordServer): boolean;
  toServerDTO(): SkipRecordServerDTO;
  toClientDTO(): SkipRecordClientDTO;
  toPersistenceDTO(): SkipRecordPersistenceDTO;
}

// ============ DTO 定义 ============

export interface SkipRecordServerDTO {
  skippedAt: number;
  reason?: string | null;
}

export interface SkipRecordPersistenceDTO {
  skipped_at: number;
  reason?: string | null;
}
