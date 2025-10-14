/**
 * Reminder Module - API Requests and Responses
 * 提醒模块 - API 请求和响应定义
 */

import { ImportanceLevel } from '../../shared/importance';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
} from './aggregates';
import type { ReminderHistoryClientDTO } from './entities';
import type { ReminderType, ReminderStatus, ControlMode } from './enums';
import type {
  TriggerConfigServerDTO,
  RecurrenceConfigServerDTO,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServerDTO,
  NotificationConfigServerDTO,
} from './value-objects';

// ============ Reminder Template 请求 ============

/**
 * 创建提醒模板请求
 */
export interface CreateReminderTemplateRequestDTO {
  title: string;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  activeTime: ActiveTimeConfigServerDTO;
  notificationConfig: NotificationConfigServerDTO;
  description?: string;
  recurrence?: RecurrenceConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 更新提醒模板请求
 */
export interface UpdateReminderTemplateRequestDTO {
  title?: string;
  description?: string;
  trigger?: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO;
  activeTime?: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  notificationConfig?: NotificationConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 查询提醒模板请求
 */
export interface QueryReminderTemplatesRequestDTO {
  status?: ReminderStatus;
  type?: ReminderType;
  groupUuid?: string;
  tags?: string[];
  importanceLevel?: ImportanceLevel;
  effectiveEnabled?: boolean; // 查询实际启用状态
}

// ============ Reminder Template 响应 ============

/**
 * 提醒模板详情响应（单个）
 */
export type ReminderTemplateDTO = ReminderTemplateClientDTO;

/**
 * 提醒模板列表响应
 */
export interface ReminderTemplateListDTO {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============ Reminder Group 请求 ============

/**
 * 创建提醒分组请求
 */
export interface CreateReminderGroupRequestDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 更新提醒分组请求
 */
export interface UpdateReminderGroupRequestDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 切换分组控制模式请求
 */
export interface SwitchGroupControlModeRequestDTO {
  mode: ControlMode;
}

/**
 * 批量操作分组模板请求
 */
export interface BatchGroupTemplatesRequestDTO {
  action: 'ENABLE' | 'PAUSE';
}

// ============ Reminder Group 响应 ============

/**
 * 提醒分组详情响应（单个）
 */
export type ReminderGroupDTO = ReminderGroupClientDTO;

/**
 * 提醒分组列表响应
 */
export interface ReminderGroupListDTO {
  groups: ReminderGroupClientDTO[];
  total: number;
}

// ============ Reminder History 响应 ============

/**
 * 提醒历史详情响应（单个）
 */
export type ReminderHistoryDTO = ReminderHistoryClientDTO;

/**
 * 提醒历史列表响应
 */
export interface ReminderHistoryListDTO {
  history: ReminderHistoryClientDTO[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============ Reminder Statistics 响应 ============

/**
 * 提醒统计响应
 */
export type ReminderStatisticsDTO = ReminderStatisticsClientDTO;

// ============ 操作响应 ============

/**
 * 启用/暂停操作响应
 */
export interface ReminderOperationResponseDTO {
  success: boolean;
  message?: string;
  affectedCount?: number;
}

/**
 * 触发操作响应
 */
export interface ReminderTriggerResponseDTO {
  success: boolean;
  triggeredAt: number;
  nextTriggerAt?: number | null;
  message?: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponseDTO {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: Array<{
    uuid: string;
    error: string;
  }>;
}
