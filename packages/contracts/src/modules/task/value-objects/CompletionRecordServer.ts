/**
 * CompletionRecord Value Object - Server Interface
 * 完成记录值对象 - 服务端接口
 */

import type { CompletionRecordClientDTO } from './CompletionRecordClient';

// ============ 接口定义 ============

export interface CompletionRecordServer {
  completedAt: number;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;

  equals(other: CompletionRecordServer): boolean;
  toServerDTO(): CompletionRecordServerDTO;
  toClientDTO(): CompletionRecordClientDTO;
  toPersistenceDTO(): CompletionRecordPersistenceDTO;
}

// ============ DTO 定义 ============

export interface CompletionRecordServerDTO {
  completedAt: number;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;
}

export interface CompletionRecordPersistenceDTO {
  completed_at: number;
  actual_duration?: number | null;
  note?: string | null;
  rating?: number | null;
}
