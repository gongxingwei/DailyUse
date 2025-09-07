import type { ITaskTemplate, ITaskInstance, ITaskMetaTemplate, TaskQueryParams } from './types';

/**
 * 创建任务模板请求 DTO
 */
export interface CreateTaskTemplateRequest {
  title: string;
  description?: string;
  timeConfig: {
    type: 'allDay' | 'timed' | 'timeRange';
    baseTime: {
      start: string; // ISO date string
      end?: string;
      duration?: number;
    };
    recurrence: {
      type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
      interval?: number;
      endCondition?: {
        type: 'never' | 'date' | 'count';
        endDate?: string;
        count?: number;
      };
    };
    timezone: string;
  };
  reminderConfig: {
    enabled: boolean;
    alerts: Array<{
      timing: {
        type: 'relative' | 'absolute';
        minutesBefore?: number;
        absoluteTime?: string;
      };
      type: 'notification' | 'email' | 'sound';
      message?: string;
    }>;
    snooze: {
      enabled: boolean;
      interval: number;
      maxCount: number;
    };
  };
  metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    importance: string;
    urgency: string;
    location?: string;
  };
  keyResultLinks?: Array<{
    goalUuid: string;
    keyResultId: string;
    incrementValue: number;
  }>;
}

/**
 * 更新任务模板请求 DTO
 */
export type UpdateTaskTemplateRequest = Partial<CreateTaskTemplateRequest>;

/**
 * 创建任务实例请求 DTO
 */
export interface CreateTaskInstanceRequest {
  templateUuid: string;
  title: string;
  description?: string;
  scheduledTime: string; // ISO date string
  endTime?: string;
  keyResultLinks?: Array<{
    goalUuid: string;
    keyResultId: string;
    incrementValue: number;
  }>;
}

/**
 * 更新任务实例请求 DTO
 */
export interface UpdateTaskInstanceRequest {
  title?: string;
  description?: string;
  scheduledTime?: string;
  endTime?: string;
}

/**
 * 完成任务请求 DTO
 */
export interface CompleteTaskRequest {
  accountUuid: string;
  actualDuration?: number;
}

/**
 * 重新调度任务请求 DTO
 */
export interface RescheduleTaskRequest {
  newScheduledTime: string;
  newEndTime?: string;
  reason?: string;
}

/**
 * 任务模板响应 DTO
 */
export interface TaskTemplateResponse extends Omit<ITaskTemplate, 'timeConfig' | 'lifecycle'> {
  timeConfig: {
    type: string;
    baseTime: {
      start: string;
      end?: string;
      duration?: number;
    };
    recurrence: {
      type: string;
      interval?: number;
      endCondition?: {
        type: string;
        endDate?: string;
        count?: number;
      };
    };
    timezone: string;
  };
  lifecycle: {
    status: string;
    createdAt: string;
    updatedAt: string;
    activatedAt?: string;
    pausedAt?: string;
  };
}

/**
 * 任务实例响应 DTO
 */
export interface TaskInstanceResponse
  extends Omit<ITaskInstance, 'timeConfig' | 'lifecycle' | 'reminderStatus'> {
  timeConfig: {
    type: string;
    scheduledTime: string;
    endTime?: string;
    estimatedDuration?: number;
    timezone: string;
    allowReschedule: boolean;
    maxDelayDays?: number;
  };
  lifecycle: {
    status: string;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    events: Array<{
      type: string;
      timestamp: string;
      alertId?: string;
      details?: Record<string, any>;
    }>;
  };
  reminderStatus: {
    enabled: boolean;
    alerts: Array<{
      uuid: string;
      status: string;
      scheduledTime: string;
      triggeredAt?: string;
      dismissedAt?: string;
    }>;
    globalSnoozeCount: number;
    lastTriggeredAt?: string;
  };
}

/**
 * 任务查询参数 DTO
 */
export interface TaskQueryParamsDTO extends Omit<TaskQueryParams, 'dateRange'> {
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * 任务列表响应 DTO
 */
export interface TaskListResponse {
  tasks: TaskInstanceResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
