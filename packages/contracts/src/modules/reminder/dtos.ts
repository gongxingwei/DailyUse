import type {
  IReminderTemplate,
  IReminderTemplateGroup,
  IReminderInstance,
  ReminderQueryParams,
  ReminderTimeConfig,
} from './types';

/**
 * 创建提醒模板请求 DTO
 */
export interface CreateReminderTemplateRequest {
  name: string;
  description?: string;
  message: string;
  groupUuid?: string;
  timeConfig: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    times: string[];
    weekdays?: number[];
    monthDays?: number[];
    customPattern?: {
      interval: number;
      unit: 'minutes' | 'hours' | 'days';
    };
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
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
  enabled: boolean;
  enableMode: 'group' | 'individual';
  parentUuid?: string;
}

/**
 * 更新提醒分组请求 DTO
 */
export type UpdateReminderGroupRequest = Partial<CreateReminderGroupRequest>;

/**
 * 创建提醒实例请求 DTO
 */
export interface CreateReminderInstanceRequest {
  templateUuid: string;
  scheduledTime: string; // ISO date string
  message?: string; // 可以覆盖模板消息
  priority?: 'low' | 'normal' | 'high' | 'urgent';
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
  priority?: 'low' | 'normal' | 'high' | 'urgent';
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
