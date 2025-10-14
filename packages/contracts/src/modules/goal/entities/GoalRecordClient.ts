/**
 * GoalRecord Entity - Client Interface
 */

import type { GoalRecordServerDTO } from './GoalRecordServer';

export interface GoalRecordClientDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  note?: string | null;
  recordedAt: number;
  createdAt: number;
  changePercentage: number;
  isPositiveChange: boolean;
  changeText: string;
  formattedRecordedAt: string;
  formattedCreatedAt: string;
  changeIcon: string;
  changeColor: string;
}

export interface GoalRecordClient {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  note?: string | null;
  recordedAt: number;
  createdAt: number;
  changePercentage: number;
  isPositiveChange: boolean;
  changeText: string;
  formattedRecordedAt: string;
  formattedCreatedAt: string;
  changeIcon: string;
  changeColor: string;

  getDisplayText(): string;
  getSummary(): string;
  hasNote(): boolean;

  toClientDTO(): GoalRecordClientDTO;
  toServerDTO(): GoalRecordServerDTO;
}

export interface GoalRecordClientStatic {
  fromClientDTO(dto: GoalRecordClientDTO): GoalRecordClient;
  fromServerDTO(dto: GoalRecordServerDTO): GoalRecordClient;
}

export interface GoalRecordClientInstance extends GoalRecordClient {
  clone(): GoalRecordClient;
}
