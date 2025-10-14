/**
 * TaskTemplateHistory Entity - Client Interface
 */

import type { TaskTemplateHistoryServerDTO } from './TaskTemplateHistoryServer';

export interface TaskTemplateHistoryClientDTO {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: number;
  actionText: string;
  formattedCreatedAt: string;
  hasChanges: boolean;
  changesSummary?: string | null;
}

export interface TaskTemplateHistoryClient {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: number;
  actionText: string;
  formattedCreatedAt: string;
  hasChanges: boolean;
  changesSummary?: string | null;

  getActionIcon(): string;
  hasSpecificChange(key: string): boolean;

  toClientDTO(): TaskTemplateHistoryClientDTO;
  toServerDTO(): TaskTemplateHistoryServerDTO;
}

export interface TaskTemplateHistoryClientStatic {
  fromClientDTO(dto: TaskTemplateHistoryClientDTO): TaskTemplateHistoryClient;
  fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistoryClient;
}

export interface TaskTemplateHistoryClientInstance extends TaskTemplateHistoryClient {
  clone(): TaskTemplateHistoryClient;
}
