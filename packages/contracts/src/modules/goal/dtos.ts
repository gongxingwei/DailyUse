import type { IGoal, IKeyResult, IGoalRecord, IGoalReview, GoalQueryParams } from './types';

/**
 * 创建目标请求 DTO
 */
export interface CreateGoalRequest {
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: string; // ISO date string
  endTime: string;
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
  };
  keyResults?: Array<{
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    weight: number;
  }>;
}

/**
 * 更新目标请求 DTO
 */
export type UpdateGoalRequest = Partial<CreateGoalRequest>;

/**
 * 创建关键结果请求 DTO
 */
export interface CreateKeyResultRequest {
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight: number;
}

/**
 * 更新关键结果请求 DTO
 */
export type UpdateKeyResultRequest = Partial<CreateKeyResultRequest>;

/**
 * 创建目标记录请求 DTO
 */
export interface CreateGoalRecordRequest {
  keyResultUuid: string;
  value: number;
  note?: string;
  recordDate?: string; // ISO date string, defaults to now
}

/**
 * 创建目标复盘请求 DTO
 */
export interface CreateGoalReviewRequest {
  content: string;
  rating: number; // 1-5
  lessonsLearned?: string;
  nextSteps?: string;
  reviewDate?: string; // ISO date string, defaults to now
}

/**
 * 目标响应 DTO
 */
export interface GoalResponse
  extends Omit<
    IGoal,
    'startTime' | 'endTime' | 'lifecycle' | 'keyResults' | 'records' | 'reviews'
  > {
  startTime: string;
  endTime: string;
  lifecycle: {
    createdAt: string;
    updatedAt: string;
    status: string;
  };
  keyResults: Array<
    Omit<IKeyResult, 'createdAt' | 'updatedAt'> & {
      createdAt: string;
      updatedAt: string;
      progress: number;
      isCompleted: boolean;
    }
  >;
  records: Array<
    Omit<IGoalRecord, 'recordDate' | 'createdAt'> & {
      recordDate: string;
      createdAt: string;
    }
  >;
  reviews: Array<
    Omit<IGoalReview, 'reviewDate' | 'createdAt'> & {
      reviewDate: string;
      createdAt: string;
    }
  >;
  analytics: {
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
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
 * 目标查询参数 DTO
 */
export interface GoalQueryParamsDTO extends Omit<GoalQueryParams, 'dateRange'> {
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * 目标统计响应 DTO
 */
export interface GoalStatsResponse {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  avgKeyResultsPerGoal: number;
  completionRate: number;
  progressTrend: Array<{
    date: string;
    progress: number;
  }>;
}

/**
 * 更新关键结果进度请求 DTO
 */
export interface UpdateKeyResultProgressRequest {
  keyResultUuid: string;
  increment: number;
  note?: string;
}
