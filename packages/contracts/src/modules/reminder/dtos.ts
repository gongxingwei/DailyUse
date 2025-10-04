import type {
  IReminderTemplate,
  IReminderTemplateGroup,
  IReminderInstance,
  ReminderQueryParams,
  ReminderTimeConfig,
  NotificationSettings,
  SnoozeConfig,
} from './types';
import {
  ReminderTemplateEnableMode,
  ReminderPriority,
  ReminderStatus,
  ReminderTimeConfigType,
  ReminderDurationUnit,
  SnoozeType,
} from './enums';
import { ImportanceLevel } from '../../shared/index';

/**
 * ==========================================
 * Reminder Module DTOs - RESTful API Design
 * ==========================================
 *
 * 设计原则：
 * 1. RESTful 风格：所有请求数据在 JSON body 中
 * 2. DTO vs ClientDTO：
 *    - DTO: 服务端内部传输对象（纯数据，时间为 number）
 *    - ClientDTO: 客户端渲染对象（包含计算属性）
 * 3. Request DTO: 直接映射实体属性，前端生成 UUID
 */

// ==================== 提醒模板 (ReminderTemplate) ====================

/**
 * 提醒模板 DTO - 服务端数据传输对象
 * 用于服务端内部传输（Repository <-> Application <-> Domain）
 */
export interface ReminderTemplateDTO {
  uuid: string;
  accountUuid: string;
  groupUuid?: string;
  name: string;
  description?: string;
  message: string;
  enabled: boolean;
  selfEnabled: boolean;
  importanceLevel?: ImportanceLevel;
  timeConfig: ReminderTimeConfig;
  priority: ReminderPriority;
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
  position?: {
    x: number;
    y: number;
  };
  displayOrder: number;
  notificationSettings?: NotificationSettings;
  snoozeConfig?: SnoozeConfig;
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    lastTriggered?: number;
    triggerCount: number;
  };
  analytics: {
    totalTriggers: number;
    acknowledgedCount: number;
    dismissedCount: number;
    snoozeCount: number;
    avgResponseTime?: number;
  };
  version: number;
}

/**
 * 提醒模板客户端 DTO - 前端渲染对象
 * 包含所有服务端数据 + 计算属性
 */
export interface ReminderTemplateClientDTO extends ReminderTemplateDTO {
  // 计算属性
  effectiveEnabled: boolean; // 综合考虑 selfEnabled 和 group.enabled
  nextTriggerTime?: number; // 下次触发时间
  activeInstancesCount?: number; // 活跃实例数量
  groupName?: string; // 所属分组名称
}

/**
 * 创建提醒模板请求 - POST /api/v1/reminders/templates
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateReminderTemplateRequest = Pick<
  ReminderTemplateDTO,
  'uuid' | 'name' | 'message' | 'timeConfig' | 'priority' | 'category' | 'tags'
> & {
  groupUuid?: string;
  description?: string;
  enabled?: boolean; // 默认 true
  selfEnabled?: boolean; // 默认 true
  importanceLevel?: ImportanceLevel;
  icon?: string;
  color?: string;
  position?: { x: number; y: number };
  displayOrder?: number;
  notificationSettings?: NotificationSettings;
  snoozeConfig?: SnoozeConfig;
};

/**
 * 更新提醒模板请求 - PUT /api/v1/reminders/templates/:templateId
 * 只传递需要更新的字段
 */
export type UpdateReminderTemplateRequest = Partial<
  Omit<ReminderTemplateDTO, 'uuid' | 'accountUuid' | 'lifecycle' | 'analytics' | 'version'>
>;

// ==================== 提醒模板分组 (ReminderTemplateGroup) ====================

/**
 * 提醒模板分组 DTO - 服务端数据传输对象
 */
export interface ReminderTemplateGroupDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  parentUuid?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 提醒模板分组客户端 DTO - 前端渲染对象
 */
export interface ReminderTemplateGroupClientDTO extends ReminderTemplateGroupDTO {
  // 计算属性
  templateCount: number; // 包含的模板数量
  activeTemplateCount: number; // 活跃模板数量
  children?: ReminderTemplateGroupClientDTO[]; // 子分组列表
  templates?: ReminderTemplateClientDTO[]; // 包含的模板列表
  isSystemGroup?: boolean; // 是否为系统分组
}

/**
 * 创建提醒分组请求 - POST /api/v1/reminders/groups
 */
export type CreateReminderTemplateGroupRequest = Pick<ReminderTemplateGroupDTO, 'uuid' | 'name'> & {
  description?: string;
  enabled?: boolean; // 默认 true
  enableMode?: ReminderTemplateEnableMode; // 默认 INDIVIDUAL
  parentUuid?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
};

/**
 * 更新提醒分组请求 - PUT /api/v1/reminders/groups/:groupId
 */
export type UpdateReminderTemplateGroupRequest = Partial<
  Omit<ReminderTemplateGroupDTO, 'uuid' | 'accountUuid' | 'createdAt' | 'updatedAt'>
>;

// ==================== 提醒实例 (ReminderInstance) ====================

/**
 * 提醒实例 DTO - 服务端数据传输对象
 */
export interface ReminderInstanceDTO {
  uuid: string;
  accountUuid: string;
  templateUuid: string;
  title?: string;
  message: string;
  scheduledTime: number;
  triggeredTime?: number;
  acknowledgedTime?: number;
  dismissedTime?: number;
  snoozedUntil?: number;
  status: ReminderStatus;
  priority: ReminderPriority;
  metadata: {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
  snoozeHistory: Array<{
    snoozedAt: number;
    snoozeUntil: number;
    snoozeType?: SnoozeType;
    customMinutes?: number;
    reason?: string;
  }>;
  currentSnoozeCount: number;
  createdAt: number;
  updatedAt: number;
  version: number;
}

/**
 * 提醒实例客户端 DTO - 前端渲染对象
 */
export interface ReminderInstanceClientDTO extends ReminderInstanceDTO {
  // 计算属性
  isOverdue: boolean; // 是否已过期
  timeUntil: number; // 距离触发时间的毫秒数
  formattedTime: string; // 格式化的时间显示
  templateName?: string; // 模板名称
  groupName?: string; // 分组名称
}

/**
 * 创建提醒实例请求 - POST /api/v1/reminders/instances
 */
export type CreateReminderInstanceRequest = Pick<
  ReminderInstanceDTO,
  'uuid' | 'templateUuid' | 'scheduledTime' | 'message'
> & {
  title?: string;
  priority?: ReminderPriority;
  metadata?: {
    category?: string;
    tags?: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
};

/**
 * 更新提醒实例请求 - PUT /api/v1/reminders/instances/:instanceId
 */
export type UpdateReminderInstanceRequest = Partial<
  Pick<ReminderInstanceDTO, 'scheduledTime' | 'message' | 'priority' | 'title' | 'metadata'>
>;

/**
 * 稍后提醒请求 - POST /api/v1/reminders/instances/:instanceId/snooze
 */
export interface SnoozeReminderRequest {
  snoozeUntil: number; // 时间戳
  snoozeType?: SnoozeType;
  customMinutes?: number;
  reason?: string;
}

// ==================== 列表响应 DTOs ====================

/**
 * 提醒模板列表响应
 */
export interface ReminderTemplateListResponse {
  data: {
    reminders: ReminderTemplateClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    query?: string; // 搜索响应专用
  };
}

/**
 * 提醒分组列表响应
 */
export interface ReminderTemplateGroupListResponse {
  data: {
    groups: ReminderTemplateGroupClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * 提醒实例列表响应
 */
export interface ReminderInstanceListResponse {
  data: {
    reminders: ReminderInstanceClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ==================== 查询参数 DTOs ====================

/**
 * 提醒查询参数 - GET /api/v1/reminders/instances
 */
export interface ReminderQueryParamsDTO {
  status?: ReminderStatus | ReminderStatus[];
  priority?: ReminderPriority | ReminderPriority[];
  category?: string | string[];
  tags?: string[];
  groupUuid?: string;
  templateUuid?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  page?: number;
  limit?: number;
  sortBy?: 'scheduledTime' | 'priority' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

/**
 * 即将到来的提醒查询参数 - GET /api/v1/reminders/upcoming
 */
export interface GetUpcomingRemindersRequest {
  limit?: number;
  days?: number; // 未来多少天内的提醒
  priorities?: ReminderPriority[];
  categories?: string[];
  tags?: string[];
}

// ==================== 统计响应 DTOs ====================

/**
 * 提醒统计响应 - GET /api/v1/reminders/stats
 */
export interface ReminderStatsResponse {
  data: {
    total: number;
    pending: number;
    triggered: number;
    acknowledged: number;
    dismissed: number;
    snoozed: number;
    expired: number;
    avgResponseTime: number; // 毫秒
    acknowledgmentRate: number; // 0-1
    dailyStats: Array<{
      date: number; // timestamp
      total: number;
      acknowledged: number;
      dismissed: number;
    }>;
  };
}

// ==================== 批量操作 DTOs ====================

/**
 * 批量操作提醒请求 - POST /api/v1/reminders/instances/batch
 */
export interface BatchReminderOperationRequest {
  instanceUuids: string[];
  operation: 'acknowledge' | 'dismiss' | 'snooze' | 'delete';
  snoozeUntil?: number; // For snooze operation
  snoozeType?: SnoozeType;
  customMinutes?: number;
  reason?: string;
}

/**
 * 批量更新模板启用状态请求 - POST /api/v1/reminders/templates/batch/enabled
 */
export interface BatchUpdateTemplatesEnabledRequest {
  templateUuids: string[];
  enabled?: boolean;
  selfEnabled?: boolean;
}

// ==================== 启用状态控制 DTOs ====================

/**
 * 切换分组启用模式请求 - PUT /api/v1/reminders/groups/:groupId/enable-mode
 */
export interface ToggleGroupEnableModeRequest {
  enableMode: ReminderTemplateEnableMode;
  enabled?: boolean; // 当切换到 GROUP 模式时的组启用状态
}

/**
 * 切换分组启用状态请求 - PUT /api/v1/reminders/groups/:groupId/enabled
 */
export interface ToggleGroupEnabledRequest {
  enabled: boolean;
}

/**
 * 切换模板自我启用状态请求 - PUT /api/v1/reminders/templates/:templateId/self-enabled
 */
export interface ToggleTemplateSelfEnabledRequest {
  selfEnabled: boolean;
}

/**
 * 启用状态变更响应
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

// ==================== 单个资源响应 DTOs ====================

/**
 * 单个提醒模板响应 - GET/POST/PUT /api/v1/reminders/templates/*
 */
export interface ReminderTemplateResponse {
  data: ReminderTemplateClientDTO;
}

/**
 * 单个提醒实例响应 - GET/POST/PUT /api/v1/reminders/instances/*
 */
export interface ReminderInstanceResponse {
  data: ReminderInstanceClientDTO;
}

/**
 * 单个提醒分组响应 - GET/POST/PUT /api/v1/reminders/groups/*
 */
export interface ReminderTemplateGroupResponse {
  data: ReminderTemplateGroupClientDTO;
}

/**
 * 即将到来的提醒响应 - GET /api/v1/reminders/upcoming
 */
export interface UpcomingRemindersResponse {
  data: {
    reminders: ReminderInstanceClientDTO[];
    total: number;
    timeRange: {
      start: number;
      end: number;
    };
  };
}

/**
 * 提醒列表响应 (别名)
 * @deprecated 使用 ReminderInstanceListResponse 代替
 */
export type ReminderListResponse = ReminderInstanceListResponse;
