import type {
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate,
  TaskQueryParams,
  KeyResultLink,
} from './types';
import type { TaskTimeType, TaskScheduleMode } from './enums';
import type { ImportanceLevel, UrgencyLevel } from '../../shared/index';

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
 * 任务模板响应 DTO
 */
export type TaskTemplateResponse = TaskTemplateDTO;

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
 * 任务实例响应 DTO
 */
export type TaskInstanceResponse = TaskInstanceDTO;

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
 * 通用任务列表响应 DTO
 */
export type TaskListResponse = TaskInstanceListResponse;

/**
 * 任务元模板响应 DTO
 */
export type TaskMetaTemplateResponse = TaskMetaTemplateDTO;

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

// =================================================================
// Client DTOs - 客户端DTOs（包含计算属性和UI渲染数据）
// =================================================================

/**
 * 任务模板客户端DTO
 * 基于TaskTemplateDTO，添加计算属性用于UI渲染和交互逻辑
 */
export interface TaskTemplateClientDTO extends TaskTemplateDTO {
  // =================================================================
  // UI Display - UI显示属性
  // =================================================================

  /** 显示标题（包含状态标识） */
  displayTitle: string;

  /** 状态文本（中文描述） */
  statusText: string;

  /** 状态颜色（用于UI主题） */
  statusColor: string;

  /** 调度规则文本描述 */
  scheduleText: string;

  /** 完成率文本（百分比） */
  completionRateText: string;

  // =================================================================
  // Status Flags - 状态标志
  // =================================================================

  /** 是否可以激活 */
  canActivate: boolean;

  /** 是否可以暂停 */
  canPause: boolean;

  /** 是否可以编辑 */
  canEdit: boolean;

  /** 是否可以删除 */
  canDelete: boolean;

  /** 是否可以创建实例 */
  canCreateInstance: boolean;

  // =================================================================
  // Metrics - 统计指标
  // =================================================================

  /** 活动实例数量 */
  activeInstancesCount: number;

  /** 总实例数量 */
  totalInstancesCount: number;

  /** 完成的实例数量 */
  completedInstancesCount: number;

  /** 实例完成率（0-100） */
  instanceCompletionRate: number;

  /** 下次调度时间（格式化） */
  nextScheduledTime: string | null;

  /** 是否有待办实例 */
  hasPendingInstances: boolean;

  /** 是否有逾期实例 */
  hasOverdueInstances: boolean;

  // =================================================================
  // Time Analysis - 时间分析
  // =================================================================

  /** 创建天数 */
  daysSinceCreation: number;

  /** 最后执行时间（格式化） */
  lastExecutedTime: string | null;

  /** 平均完成时长（分钟） */
  averageCompletionMinutes: number | null;
}

/**
 * 任务实例客户端DTO
 * 基于TaskInstanceDTO，添加计算属性用于UI渲染和交互逻辑
 */
export interface TaskInstanceClientDTO extends TaskInstanceDTO {
  // =================================================================
  // UI Display - UI显示属性
  // =================================================================

  /** 显示标题（包含状态标识） */
  displayTitle: string;

  /** 状态文本（中文描述） */
  statusText: string;

  /** 状态颜色（用于UI主题） */
  statusColor: string;

  /** 优先级文本 */
  priorityText: string;

  /** 优先级颜色 */
  priorityColor: string;

  // =================================================================
  // Status Flags - 状态标志
  // =================================================================

  /** 是否可以开始 */
  canStart: boolean;

  /** 是否可以完成 */
  canComplete: boolean;

  /** 是否可以取消 */
  canCancel: boolean;

  /** 是否可以重新调度 */
  canReschedule: boolean;

  /** 是否可以编辑 */
  canEdit: boolean;

  /** 是否可以删除 */
  canDelete: boolean;

  // =================================================================
  // Time Analysis - 时间分析
  // =================================================================

  /** 是否逾期 */
  isOverdue: boolean;

  /** 剩余时间文本（如：还剩2小时） */
  remainingTime: string;

  /** 格式化的调度时间 */
  formattedScheduledTime: string;

  /** 格式化的开始时间 */
  formattedStartTime: string | null;

  /** 格式化的完成时间 */
  formattedCompletedTime: string | null;

  /** 格式化的取消时间 */
  formattedCancelledTime: string | null;

  /** 执行时长（分钟） */
  executionDurationMinutes: number | null;

  /** 执行时长文本（如：用时30分钟） */
  executionDurationText: string | null;

  // =================================================================
  // Progress - 进度信息
  // =================================================================

  /** 进度百分比文本（如：80%） */
  progressPercentageText: string;

  /** 执行摘要文本 */
  executionSummary: string;

  /** 是否在今天 */
  isToday: boolean;

  /** 是否在本周 */
  isThisWeek: boolean;

  /** 是否在本月 */
  isThisMonth: boolean;

  // =================================================================
  // Reminders - 提醒信息
  // =================================================================

  /** 是否有提醒 */
  hasReminder: boolean;

  /** 下次提醒时间（格式化） */
  nextReminderTime: string | null;

  /** 是否需要立即提醒 */
  needsImmediateReminder: boolean;
}
