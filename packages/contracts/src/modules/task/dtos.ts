import type {
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate,
  TaskQueryParams,
  TaskTimeType,
  TaskScheduleMode,
  KeyResultLink,
} from './types';
import type { ImportanceLevel, UrgencyLevel } from '../../core';

/**
 * 创建任务模板请求 DTO
 */
export interface CreateTaskTemplateRequest {
  title: string;
  description?: string;
  timeConfig: {
    time: {
      timeType: TaskTimeType;
      startTime?: string; // HH:mm 格式
      endTime?: string; // HH:mm 格式
    };
    date: {
      startDate: string; // ISO date string
      endDate?: string; // ISO date string
    };
    schedule: {
      mode: TaskScheduleMode;
      intervalDays?: number;
      weekdays?: number[];
      monthDays?: number[];
    };
    timezone: string;
  };
  reminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  goalLinks?: KeyResultLink[];
}

/**
 * 更新任务模板请求 DTO
 */
export type UpdateTaskTemplateRequest = Partial<CreateTaskTemplateRequest>;

/**
 * 创建任务元模板请求 DTO
 */
export interface CreateTaskMetaTemplateRequest {
  name: string;
  description?: string;
  appearance: {
    icon?: string;
    color?: string;
    category: string;
  };
  defaultTimeConfig: {
    timeType: TaskTimeType;
    scheduleMode: TaskScheduleMode;
    timezone: string;
    commonTimeSettings?: {
      startTime?: string;
      endTime?: string;
    };
  };
  defaultReminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  defaultProperties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    tags: string[];
    location?: string;
  };
}

/**
 * 更新任务元模板请求 DTO
 */
export type UpdateTaskMetaTemplateRequest = Partial<CreateTaskMetaTemplateRequest>;

/**
 * 创建任务实例请求 DTO
 */
export interface CreateTaskInstanceRequest {
  templateUuid: string;
  title?: string; // 可选，使用模板标题
  description?: string; // 可选，使用模板描述
  timeConfig: {
    timeType: TaskTimeType;
    scheduledDate: string; // ISO date string
    startTime?: string; // HH:mm 格式
    endTime?: string; // HH:mm 格式
    estimatedDuration?: number;
    timezone: string;
  };
  properties?: {
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    location?: string;
    tags?: string[];
  };
  goalLinks?: KeyResultLink[];
}

/**
 * 更新任务实例请求 DTO
 */
export interface UpdateTaskInstanceRequest {
  title?: string;
  description?: string;
  timeConfig?: {
    timeType?: TaskTimeType;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    timezone?: string;
  };
  properties?: {
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    location?: string;
    tags?: string[];
  };
  goalLinks?: KeyResultLink[];
}

/**
 * 完成任务请求 DTO
 */
export interface CompleteTaskRequest {
  actualStartTime?: string; // ISO date string
  actualEndTime?: string; // ISO date string
  actualDuration?: number; // 分钟
  progressPercentage?: number; // 0-100
  notes?: string;
}

/**
 * 重新调度任务请求 DTO
 */
export interface RescheduleTaskRequest {
  newScheduledDate: string; // ISO date string
  newStartTime?: string; // HH:mm 格式
  newEndTime?: string; // HH:mm 格式
  reason?: string;
}

/**
 * 任务实例状态更新请求 DTO
 */
export interface UpdateTaskInstanceStatusRequest {
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
  note?: string;
}

/**
 * 任务模板 DTO
 */
export interface TaskTemplateDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  timeConfig: {
    time: {
      timeType: TaskTimeType;
      startTime?: string;
      endTime?: string;
    };
    date: {
      startDate: string; // ISO date string
      endDate?: string; // ISO date string
    };
    schedule: {
      mode: TaskScheduleMode;
      intervalDays?: number;
      weekdays?: number[];
      monthDays?: number[];
    };
    timezone: string;
  };
  reminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  };
  stats: {
    totalInstances: number;
    completedInstances: number;
    completionRate: number;
    lastInstanceDate?: string; // ISO date string
  };
  goalLinks?: KeyResultLink[];
}

/**
 * 任务实例 DTO
 */
export interface TaskInstanceDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  timeConfig: {
    timeType: TaskTimeType;
    scheduledDate: string; // ISO date string
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    timezone: string;
  };
  reminderStatus: {
    enabled: boolean;
    status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
    scheduledTime?: string; // ISO date string
    triggeredAt?: string; // ISO date string
    snoozeCount: number;
    snoozeUntil?: string; // ISO date string
  };
  execution: {
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
    actualStartTime?: string; // ISO date string
    actualEndTime?: string; // ISO date string
    actualDuration?: number;
    progressPercentage: number;
    notes?: string;
  };
  properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  lifecycle: {
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    events: Array<{
      type:
        | 'created'
        | 'started'
        | 'paused'
        | 'resumed'
        | 'completed'
        | 'cancelled'
        | 'rescheduled';
      timestamp: string; // ISO date string
      note?: string;
    }>;
  };
  goalLinks?: KeyResultLink[];
}

/**
 * 任务元模板 DTO
 */
export interface TaskMetaTemplateDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  appearance: {
    icon?: string;
    color?: string;
    category: string;
  };
  defaultTimeConfig: {
    timeType: TaskTimeType;
    scheduleMode: TaskScheduleMode;
    timezone: string;
    commonTimeSettings?: {
      startTime?: string;
      endTime?: string;
    };
  };
  defaultReminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  defaultProperties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    tags: string[];
    location?: string;
  };
  usage: {
    usageCount: number;
    lastUsedAt?: string; // ISO date string
    isFavorite: boolean;
  };
  lifecycle: {
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    isActive: boolean;
  };
}

/**
 * 任务查询参数 DTO
 */
export interface TaskQueryParamsDTO {
  templateUuid?: string;
  status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
  importance?: ImportanceLevel[];
  urgency?: UrgencyLevel[];
  tags?: string[];
  goalUuid?: string;
  keyResultId?: string;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  limit?: number;
  offset?: number;
  sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt' | 'importance' | 'urgency';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 任务模板列表响应 DTO
 */
export interface TaskTemplateListResponse {
  templates: TaskTemplateDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 任务实例列表响应 DTO
 */
export interface TaskInstanceListResponse {
  instances: TaskInstanceDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 任务元模板列表响应 DTO
 */
export interface TaskMetaTemplateListResponse {
  metaTemplates: TaskMetaTemplateDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 任务统计 DTO
 */
export interface TaskStatsDTO {
  overall: {
    total: number;
    completed: number;
    incomplete: number;
    completionRate: number;
    overdue: number;
    inProgress: number;
    pending: number;
  };
  byTemplate: Array<{
    templateUuid: string;
    templateTitle: string;
    total: number;
    completed: number;
    completionRate: number;
    avgDuration?: number;
  }>;
  byTimePeriod: {
    today: {
      total: number;
      completed: number;
      completionRate: number;
    };
    thisWeek: {
      total: number;
      completed: number;
      completionRate: number;
    };
    thisMonth: {
      total: number;
      completed: number;
      completionRate: number;
    };
  };
  trends: {
    dailyCompletion: Array<{
      date: string; // ISO date string
      completed: number;
      total: number;
    }>;
    weeklyCompletion: Array<{
      week: string; // ISO week format
      completed: number;
      total: number;
    }>;
  };
}
