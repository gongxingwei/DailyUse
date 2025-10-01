import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import {
  GoalDirStatus,
  GoalReviewType,
  GoalStatus,
  GoalSortField,
  KeyResultCalculationMethod,
  KeyResultStatus,
  SortOrder,
} from './enums';

/**
 * 关键结果接口
 */
export interface IKeyResult {
  uuid: string;
  goalUuid: string;

  name: string;
  description?: string;

  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: KeyResultCalculationMethod;

  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: KeyResultStatus;
  };
}

/**
 * 目标记录接口
 */
export interface IGoalRecord {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;

  value: number;
  note?: string;
  createdAt: Date;
}

/**
 * 目标复盘接口
 */
export interface IGoalReview {
  uuid: string;
  goalUuid: string;
  title: string;
  type: GoalReviewType;
  reviewDate: Date;
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  snapshot: {
    snapshotDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 目标接口
 */
export interface IGoal {
  uuid: string;
  dirUuid?: string;

  name: string;
  description?: string;
  color: string;

  startTime: Date;
  endTime: Date;
  note?: string;
  keyResults: IKeyResult[];
  records: IGoalRecord[];
  reviews: IGoalReview[];
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: GoalStatus;
  };
  metadata: {
    tags: string[];
    category: string;
  };
  version: number;
}

/**
 * 目标目录接口
 */
export interface IGoalDir {
  uuid: string;
  parentUuid?: string;

  name: string;
  description?: string;
  icon: string;
  color: string;

  sortConfig: {
    sortKey: GoalSortField;
    sortOrder: number;
  };

  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: GoalDirStatus;
  };
}

/**
 * 关键结果关联（用于任务关联）
 */
export interface KeyResultLink {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
}

/**
 * 目标分析接口
 */
export interface IGoalAnalysis {
  motive: string;
  feasibility: string;
  risks?: string[];
  opportunities?: string[];
  resources?: string[];
}

/**
 * 目标统计接口
 */
export interface IGoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  avgKeyResultsPerGoal: number;
  completionRate: number;
}

/**
 * 查询参数接口
 */
export interface GoalQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: GoalStatus;
  sortBy?: GoalSortField;
  sortOrder?: SortOrder;
  dirUuid?: string;
  offset?: number;
  tags?: string[];
  category?: string;
  importanceLevel?: ImportanceLevel;
  urgencyLevel?: UrgencyLevel;
  startTime?: number;
  endTime?: number;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface GoalDirQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  parentUuid?: string;
  includeSubDirs?: boolean;
}

/**
 * 系统默认文件夹配置
 */
export const SYSTEM_GOAL_DIRS = {
  ALL: {
    uuid: 'system_all',
    name: '全部目标',
    icon: 'mdi-folder-multiple',
    color: '#2196f3',
  },
  DELETED: {
    uuid: 'system_deleted',
    name: '已删除',
    icon: 'mdi-delete',
    color: '#f44336',
  },
  ARCHIVED: {
    uuid: 'system_archived',
    name: '已归档',
    icon: 'mdi-archive',
    color: '#9e9e9e',
  },
} as const;
