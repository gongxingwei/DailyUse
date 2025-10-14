/**
 * TaskInstance Aggregate Root - Client Interface
 */

import type { TaskInstanceServerDTO } from './TaskInstanceServer';
import type { TaskInstanceStatus } from '../enums';

export interface TaskInstanceClientDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: any;
  status: TaskInstanceStatus;
  completionRecord?: any | null;
  skipRecord?: any | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration?: number | null;
  durationText?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface TaskInstanceClient {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: any;
  status: TaskInstanceStatus;
  completionRecord?: any | null;
  skipRecord?: any | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration?: number | null;
  durationText?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

  getStatusBadge(): { text: string; color: string };
  getStatusIcon(): string;
  canStart(): boolean;
  canComplete(): boolean;
  canSkip(): boolean;

  toClientDTO(): TaskInstanceClientDTO;
  toServerDTO(): TaskInstanceServerDTO;
}

export interface TaskInstanceClientStatic {
  fromClientDTO(dto: TaskInstanceClientDTO): TaskInstanceClient;
  fromServerDTO(dto: TaskInstanceServerDTO): TaskInstanceClient;
  forCreate(templateUuid: string, accountUuid: string, instanceDate: number): TaskInstanceClient;
}

export interface TaskInstanceClientInstance extends TaskInstanceClient {
  clone(): TaskInstanceClient;
}
