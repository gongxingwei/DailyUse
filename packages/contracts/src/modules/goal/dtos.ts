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
 * 关键结果 DTO - DDD聚合根控制模式
 */
export interface KeyResultDTO {
  uuid: string;
  goalUuid: string; // 只保留聚合根关联
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  lifecycle: {
    createdAt: number; // 时间戳
    updatedAt: number; // 时间戳
    status: 'active' | 'completed' | 'archived';
  };
}

/**
 * 关键结果响应 DTO
 */
export interface KeyResultResponse extends KeyResultDTO {
  progress: number; // 完成百分比
  isCompleted: boolean;
  remaining: number; // 剩余数量
}

/**
 * 关键结果列表响应 DTO
 */
export interface KeyResultListResponse {
  data: KeyResultResponse[];
  total: number;
  page?: number;
  limit?: number;
}
export interface CreateKeyResultRequest {
  goalUuid: string;
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue?: number;
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
 * 目标记录 DTO - DDD聚合根控制模式
 */
export interface GoalRecordDTO {
  uuid: string;
  keyResultUuid: string; // 只保留直接父实体关联
  value: number;
  note?: string;
  createdAt: number; // 时间戳
}

/**
 * 目标记录响应 DTO
 */
export interface GoalRecordResponse extends GoalRecordDTO {
  xxxx: string; // 预留字段
}

export interface GoalReviewDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
  reviewDate: number; // timestamp
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  snapshot: {
    snapshotDate: number; // timestamp
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
    progressSatisfaction: number; // 1-10
    executionEfficiency: number; // 1-10
    goalReasonableness: number; // 1-10
  };
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface GoalReviewResponse extends GoalReviewDTO {
  overallRating: number;
  isPositiveReview: boolean;
}

/**
 * 目标记录列表响应 DTO
 */
export interface GoalRecordListResponse {
  data: GoalRecordResponse[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 创建目标记录请求 DTO
 * keyResultUuid 通过 URL 路径参数传递，不在请求体中
 */
export interface CreateGoalRecordRequest {
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

/**
 * 目标复盘响应 DTO
 */
export interface GoalReviewResponse extends GoalReviewDTO {
  overallRating: number;
  isPositiveReview: boolean;
}

/**
 * 目标复盘列表响应 DTO
 */
export interface GoalReviewListResponse {
  reviews: GoalReviewResponse[];
  total: number;
  page?: number;
  limit?: number;
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

  keyResults?: KeyResultDTO[];
  records?: GoalRecordDTO[];
  reviews?: GoalReviewDTO[];
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
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  metadata: {
    tags: string[];
    category: string;
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
  xxxx?: string; // 预留字段
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

/**
 * DDD聚合根完整视图响应
 * 包含目标及所有相关子实体的完整信息
 */
export interface GoalAggregateViewResponse {
  goal: GoalResponse;
  keyResults: KeyResultResponse[];
  recentRecords: GoalRecordResponse[];
  reviews: GoalReviewResponse[];
}
