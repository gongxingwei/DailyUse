/**
 * TaskTimeConfig Value Object - Server Interface
 * 任务时间配置值对象 - 服务端接口
 */

import type { TimeType } from '../enums';
import type { TaskTimeConfigClientDTO } from './TaskTimeConfigClient';

// ============ 接口定义 ============

export interface TaskTimeConfigServer {
  timeType: TimeType;
  startDate?: number | null;
  endDate?: number | null;
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;

  equals(other: TaskTimeConfigServer): boolean;
  toServerDTO(): TaskTimeConfigServerDTO;
  toClientDTO(): TaskTimeConfigClientDTO;
  toPersistenceDTO(): TaskTimeConfigPersistenceDTO;
}

// ============ DTO 定义 ============

export interface TaskTimeConfigServerDTO {
  timeType: TimeType;
  startDate?: number | null;
  endDate?: number | null;
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;
}

export interface TaskTimeConfigPersistenceDTO {
  timeType: string;
  startDate?: number | null;
  endDate?: number | null;
  timePoint?: number | null;
  timeRange?: string | null; // JSON
}
