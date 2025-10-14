/**
 * TaskTimeConfig Value Object - Client Interface
 * 任务时间配置值对象 - 客户端接口
 */

import type { TimeType } from '../enums';
import type { TaskTimeConfigServerDTO } from './TaskTimeConfigServer';

// ============ 接口定义 ============

export interface TaskTimeConfigClient {
  timeType: TimeType;
  startDate?: number | null;
  endDate?: number | null;
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;

  // UI 辅助属性
  timeTypeText: string;
  formattedStartDate: string;
  formattedEndDate: string;
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean;

  equals(other: TaskTimeConfigClient): boolean;
  toServerDTO(): TaskTimeConfigServerDTO;
}

// ============ DTO 定义 ============

export interface TaskTimeConfigClientDTO {
  timeType: TimeType;
  startDate?: number | null;
  endDate?: number | null;
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;
  timeTypeText: string;
  formattedStartDate: string;
  formattedEndDate: string;
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean;
}
