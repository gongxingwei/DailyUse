/**
 * KeyResult Entity - Client Interface
 */

import type { KeyResultServerDTO } from './KeyResultServer';
import type { KeyResultProgressClientDTO } from '../value-objects';
import type { GoalRecordClientDTO } from './GoalRecordClient';

export interface KeyResultClientDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressClientDTO;
  order: number;
  createdAt: number;
  updatedAt: number;
  progressPercentage: number;
  progressText: string;
  progressColor: string;
  isCompleted: boolean;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayTitle: string;
  aggregationMethodText: string; // "求和" / "求平均" / "求最大值" / "求最小值" / "取最后一次"
  calculationExplanation: string; // "当前进度由 5 条记录求和计算得出"
  records?: GoalRecordClientDTO[] | null;
}

export interface KeyResultClient {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressClientDTO;
  order: number;
  createdAt: number;
  updatedAt: number;
  progressPercentage: number;
  progressText: string;
  progressColor: string;
  isCompleted: boolean;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayTitle: string;
  aggregationMethodText: string;
  calculationExplanation: string;
  records?: GoalRecordClientDTO[] | null;

  getDisplayTitle(): string;
  getProgressBadge(): string;
  getProgressIcon(): string;
  getAggregationMethodBadge(): string; // "SUM" / "AVG" / "MAX" / "MIN" / "LAST"
  hasDescription(): boolean;
  getRecordCount(): number;
  hasRecords(): boolean;
  canUpdateProgress(): boolean;
  canDelete(): boolean;

  toClientDTO(): KeyResultClientDTO;
  toServerDTO(): KeyResultServerDTO;
}

export interface KeyResultClientStatic {
  fromClientDTO(dto: KeyResultClientDTO): KeyResultClient;
  fromServerDTO(dto: KeyResultServerDTO): KeyResultClient;
  forCreate(goalUuid: string): KeyResultClient;
}

export interface KeyResultClientInstance extends KeyResultClient {
  clone(): KeyResultClient;
}
