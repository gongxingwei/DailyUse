import { UrgencyLevel } from "../../core";
import { ImportanceLevel } from "../../core";

/**
 * 关键结果接口
 */
export interface IKeyResult {
  uuid: string;
  accountUuid: string;
  goalUuid: string;

  name: string;
  description?: string;

  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';

  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'archived';
  };
}

/**
 * 目标记录接口
 */
export interface IGoalRecord {
  uuid: string;
  accountUuid: string;
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
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
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
    status: 'active' | 'completed' | 'paused' | 'archived';
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
  accountUuid: string;
  parentUuid?: string;

  name: string;
  description?: string;
  icon: string;
  color: string;
 
  sortConfig: {
    sortKey: string;
    sortOrder: number;
  };

  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'archived';
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
 * 目标查询参数
 */
export interface GoalQueryParams {
  status?: 'active' | 'completed' | 'paused' | 'archived';
  dateRange?: {
    start: Date;
    end: Date;
  };
  dirUuid?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
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
