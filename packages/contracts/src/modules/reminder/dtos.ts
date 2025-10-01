import type {
  IReminderTemplate,
  IReminderTemplateGroup,
  IReminderInstance,
  ReminderQueryParams,
  ReminderTimeConfig,
} from './types';
import {
  ReminderTemplateEnableMode,
  ReminderPriority,
  ReminderTimeConfigType,
  ReminderDurationUnit,
} from './enums';

/**
 * 创建提醒模板请求 DTO
 */
export interface CreateReminderTemplateRequest {
  name: string;
  description?: string;
  message: string;
  groupUuid?: string;
  enabled?: boolean;
  selfEnabled?: boolean;
  timeConfig: {
    type: ReminderTimeConfigType;
    times: string[];
    weekdays?: number[];
    monthDays?: number[];
    customPattern?: {
      interval: number;
      unit: ReminderDurationUnit;
    };
  };
  priority: ReminderPriority;
  category: string;
  tags: string[];
}

/**
 * 更新提醒模板请求 DTO
 */
export type UpdateReminderTemplateRequest = Partial<CreateReminderTemplateRequest>;

/**
 * 创建提醒分组请求 DTO
 */
export interface CreateReminderGroupRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  enableMode?: ReminderTemplateEnableMode;
  parentUuid?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * 更新提醒分组请求 DTO
 */
export type UpdateReminderGroupRequest = Partial<CreateReminderGroupRequest>;

/**
 * 创建提醒模板分组请求 DTO
 */
export interface CreateReminderTemplateGroupRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  enableMode?: ReminderTemplateEnableMode;
  parentUuid?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * 更新提醒模板分组请求 DTO
 */
export type UpdateReminderTemplateGroupRequest = Partial<CreateReminderTemplateGroupRequest>;

/**
 * 创建提醒实例请求 DTO
 */
export interface CreateReminderInstanceRequest {
  templateUuid: string;
  scheduledTime: string; // ISO date string
  message?: string; // 可以覆盖模板消息
  priority?: ReminderPriority;
  metadata?: {
    category?: string;
    tags?: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
}

/**
 * 更新提醒实例请求 DTO
 */
export interface UpdateReminderInstanceRequest {
  scheduledTime?: string; // ISO date string
  message?: string;
  priority?: ReminderPriority;
  metadata?: {
    category?: string;
    tags?: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
}

/**
 * 稍后提醒请求 DTO
 */
export interface SnoozeReminderRequest {
  snoozeUntil: string; // ISO date string
  reason?: string;
}

/**
 * 提醒模板响应 DTO
 */
export interface ReminderTemplateResponse extends Omit<IReminderTemplate, 'lifecycle'> {
  lifecycle: {
    createdAt: string;
    updatedAt: string;
    lastTriggered?: string;
    triggerCount: number;
  };
}

/**
 * 提醒分组响应 DTO
 */
export interface ReminderGroupResponse extends Omit<IReminderTemplateGroup, 'templates'> {
  templates: ReminderTemplateResponse[];
  templateCount: number;
  activeTemplateCount: number;
}

/**
 * 提醒模板分组响应 DTO
 */
export interface ReminderTemplateGroupResponse {
  uuid: string;
  name: string;
  description?: string;
  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  parentUuid?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isSystemGroup?: boolean;
  position?: {
    x: number;
    y: number;
  };
  children?: ReminderTemplateGroupResponse[];
  templates?: ReminderTemplateResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 提醒模板分组列表响应 DTO
 */
export interface ReminderTemplateGroupListResponse {
  groups: ReminderTemplateGroupResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 提醒实例响应 DTO
 */
export interface ReminderInstanceResponse
  extends Omit<
    IReminderInstance,
    | 'scheduledTime'
    | 'triggeredTime'
    | 'acknowledgedTime'
    | 'dismissedTime'
    | 'snoozedUntil'
    | 'snoozeHistory'
  > {
  scheduledTime: string;
  triggeredTime?: string;
  acknowledgedTime?: string;
  dismissedTime?: string;
  snoozedUntil?: string;
  snoozeHistory: Array<{
    snoozedAt: string;
    snoozeUntil: string;
    reason?: string;
  }>;
  templateName?: string;
  groupName?: string;
}

/**
 * 提醒查询参数 DTO
 */
export interface ReminderQueryParamsDTO extends Omit<ReminderQueryParams, 'dateRange'> {
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * 提醒列表响应 DTO
 */
export interface ReminderListResponse {
  reminders: ReminderInstanceResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 提醒模板列表响应 DTO
 */
export interface ReminderTemplateListResponse {
  reminders: ReminderTemplateResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query?: string; // For search responses
}

/**
 * 标准API响应包装器
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

/**
 * 提醒统计响应 DTO
 */
export interface ReminderStatsResponse {
  total: number;
  pending: number;
  triggered: number;
  acknowledged: number;
  dismissed: number;
  snoozed: number;
  expired: number;
  avgResponseTime: number;
  acknowledgmentRate: number;
  dailyStats: Array<{
    date: string;
    total: number;
    acknowledged: number;
    dismissed: number;
  }>;
}

/**
 * 批量操作提醒请求 DTO
 */
export interface BatchReminderOperationRequest {
  reminderIds: string[];
  operation: 'acknowledge' | 'dismiss' | 'snooze' | 'delete';
  snoozeUntil?: string; // For snooze operation
  reason?: string;
}

// ========== 启用状态控制相关 DTOs ==========

/**
 * 切换分组启用模式请求 DTO
 */
export interface ToggleGroupEnableModeRequest {
  enableMode: ReminderTemplateEnableMode;
  enabled?: boolean; // 当切换到 GROUP 模式时的组启用状态
}

/**
 * 切换分组启用状态请求 DTO
 */
export interface ToggleGroupEnabledRequest {
  enabled: boolean;
}

/**
 * 切换模板自我启用状态请求 DTO
 */
export interface ToggleTemplateSelfEnabledRequest {
  selfEnabled: boolean;
}

/**
 * 批量更新模板启用状态请求 DTO
 */
export interface BatchUpdateTemplatesEnabledRequest {
  templateUuids: string[];
  enabled?: boolean;
  selfEnabled?: boolean;
}

/**
 * 启用状态变更响应 DTO
 */
export interface EnableStatusChangeResponse {
  success: boolean;
  message: string;
  affectedTemplates: number;
  addedInstances: number;
  removedInstances: number;
  updatedInstances: number;
  details: {
    templates: Array<{
      uuid: string;
      name: string;
      oldEnabled: boolean;
      newEnabled: boolean;
    }>;
    instances: {
      added: string[];
      removed: string[];
      updated: string[];
    };
  };
}

/**
 * 获取即将到来的提醒实例请求 DTO
 */
export interface GetUpcomingRemindersRequest {
  limit?: number;
  days?: number; // 未来多少天内的提醒
  priorities?: string[];
  categories?: string[];
  tags?: string[];
}

/**
 * 即将到来的提醒实例响应 DTO
 */
export interface UpcomingRemindersResponse {
  reminders: Array<
    ReminderInstanceResponse & {
      templateName: string;
      groupName?: string;
      timeUntil: number; // 距离触发时间的毫秒数
      formattedTime: string; // 格式化的时间显示
    }
  >;
  total: number;
  nextRefreshTime: string; // 建议下次刷新的时间
}
