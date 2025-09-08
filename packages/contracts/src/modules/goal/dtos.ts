import type {
  IGoal,
  IKeyResult,
  IGoalRecord,
  IGoalReview,
  IGoalDir,
  GoalQueryParams,
} from './types';
import { ImportanceLevel, UrgencyLevel } from '../../core';

// ============ 关键结果 DTOs ============

/**
 * 关键结果 DTO
 */
export interface KeyResultDTO {
  uuid: string;
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  createdAt: number; // 时间戳
  updatedAt: number; // 时间戳
  status: 'active' | 'completed' | 'archived';
}

/**
 * 创建关键结果请求 DTO
 */
export interface CreateKeyResultRequest {
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  unit: string;
  weight: number;
  calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
}

/**
 * 更新关键结果请求 DTO
 */
export type UpdateKeyResultRequest = Partial<CreateKeyResultRequest>;

/**
 * 更新关键结果进度请求 DTO
 */
export interface UpdateKeyResultProgressRequest {
  keyResultUuid: string;
  increment: number;
  note?: string;
}

// ============ 目标记录 DTOs ============

/**
 * 目标记录 DTO
 */
export interface GoalRecordDTO {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  value: number;
  note?: string;
  recordDate: number; // 时间戳
  createdAt: number; // 时间戳
}

/**
 * 创建目标记录请求 DTO
 */
export interface CreateGoalRecordRequest {
  keyResultUuid: string;
  value: number;
  note?: string;
  recordDate?: string; // ISO date string, defaults to now
}

// ============ 目标复盘 DTOs ============

/**
 * 目标复盘 DTO
 */
export interface GoalReviewDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
  reviewDate: number; // 时间戳
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  snapshot: {
    snapshotDate: number; // 时间戳
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
    keyResultsSnapshot: Array<{
      uuid: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
    }>;
  };
  rating: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
  createdAt: number; // 时间戳
  updatedAt: number; // 时间戳
}

/**
 * 创建目标复盘请求 DTO
 */
export interface CreateGoalReviewRequest {
  title: string;
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  rating: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
  reviewDate?: string; // ISO date string, defaults to now
}

// ============ 目标 DTOs ============

/**
 * 目标 DTO
 */
export interface GoalDTO {
  uuid: string;
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: number; // 时间戳
  endTime: number; // 时间戳
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  lifecycle: {
    createdAt: number; // 时间戳
    updatedAt: number; // 时间戳
    status: 'active' | 'completed' | 'paused' | 'archived';
  };
  metadata: {
    tags: string[];
    category: string;
  };
  version: number;
}

/**
 * 创建目标请求 DTO
 */
export interface CreateGoalRequest {
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
  };
  keyResults?: CreateKeyResultRequest[];
}

/**
 * 更新目标请求 DTO
 */
export type UpdateGoalRequest = Partial<CreateGoalRequest>;

// ============ 目标目录 DTOs ============

/**
 * 目标目录 DTO
 */
export interface GoalDirDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentUuid?: string;
  sortConfig: {
    sortKey: string;
    sortOrder: number;
  };
  lifecycle: {
    createdAt: number; // 时间戳
    updatedAt: number; // 时间戳
    status: 'active' | 'archived';
  };
}

/**
 * 创建目标目录请求 DTO
 */
export interface CreateGoalDirRequest {
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentUuid?: string;
  sortConfig?: {
    sortKey: string;
    sortOrder: number;
  };
}

/**
 * 更新目标目录请求 DTO
 */
export type UpdateGoalDirRequest = Partial<CreateGoalDirRequest>;

// ============ 响应 DTOs ============

/**
 * 目标响应 DTO
 */
export interface GoalResponse extends GoalDTO {
  keyResults: Array<
    KeyResultDTO & {
      progress: number;
      isCompleted: boolean;
    }
  >;
  records: GoalRecordDTO[];
  reviews: GoalReviewDTO[];
  analytics: {
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
    daysRemaining: number;
    isOverdue: boolean;
  };
}

/**
 * 目标列表响应 DTO
 */
export interface GoalListResponse {
  goals: GoalResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 目标目录响应 DTO
 */
export interface GoalDirResponse extends GoalDirDTO {
  goalsCount: number;
  subDirs?: GoalDirResponse[];
}

/**
 * 目标目录列表响应 DTO
 */
export interface GoalDirListResponse {
  goalDirs: GoalDirResponse[];
  total: number;
}

/**
 * 目标查询参数 DTO
 */
export interface GoalQueryParamsDTO extends Omit<GoalQueryParams, 'dateRange'> {
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
}

/**
 * 目标统计响应 DTO
 */
export interface GoalStatsResponse {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  pausedGoals: number;
  archivedGoals: number;
  overallProgress: number;
  avgKeyResultsPerGoal: number;
  completionRate: number;
  progressTrend: Array<{
    date: string; // ISO date string
    progress: number;
  }>;
  upcomingDeadlines: Array<{
    goalUuid: string;
    goalName: string;
    endTime: string; // ISO date string
    daysRemaining: number;
  }>;
}
