/**
 * KeyResult Entity - Server Interface
 */

import type { KeyResultProgressServerDTO } from '../value-objects';
import type { GoalRecordServerDTO } from './GoalRecordServer';

export interface KeyResultServerDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressServerDTO;
  order: number;
  createdAt: number;
  updatedAt: number;
  records?: GoalRecordServerDTO[] | null;
}

export interface KeyResultPersistenceDTO {
  uuid: string;
  goal_uuid: string;
  title: string;
  description?: string | null;
  progress: string;
  order: number;
  created_at: number;
  updated_at: number;
}

export interface KeyResultServer {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressServerDTO;
  order: number;
  createdAt: number;
  updatedAt: number;
  records?: GoalRecordServerDTO[] | null;

  updateTitle(title: string): void;
  updateDescription(description: string): void;
  updateProgress(newValue: number, note?: string): GoalRecordServerDTO;
  calculatePercentage(): number;
  isCompleted(): boolean;
  updateOrder(order: number): void;
  addRecord(record: GoalRecordServerDTO): void;
  recalculateProgress(): void; // 根据聚合方式重新计算进度
  getRecordValues(): number[]; // 获取所有记录的值

  toServerDTO(): KeyResultServerDTO;
  toClientDTO(): KeyResultClientDTO;
  toPersistenceDTO(): KeyResultPersistenceDTO;
}

export interface KeyResultServerStatic {
  create(params: {
    goalUuid: string;
    title: string;
    description?: string;
    progress: KeyResultProgressServerDTO;
    order?: number;
  }): KeyResultServer;
  fromServerDTO(dto: KeyResultServerDTO): KeyResultServer;
  fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResultServer;
}
