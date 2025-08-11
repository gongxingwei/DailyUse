export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum KeyResultStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum KeyResultCalculationMethod {
  SUM = 'sum',
  AVERAGE = 'average',
  MAX = 'max',
  MIN = 'min',
  CUSTOM = 'custom',
}

export enum GoalReviewType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MIDTERM = 'midterm',
  FINAL = 'final',
  CUSTOM = 'custom',
}

export enum GoalDirStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
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
 * 关键结果量化指标
 */
export interface IKeyResult {
  uuid: string;
  name: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  calculationMethod: KeyResultCalculationMethod;
  weight: number;
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: KeyResultStatus;
  };
}

/**
 * 目标基础信息
 */
export interface IGoal {
  uuid: string;
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: Date;
  endTime: Date;
  note?: string;
  keyResults: IKeyResult[];
  records: IGoalRecord[];
  reviews: IGoalReview[];
  analysis: {
    motive: string;
    feasibility: string;
  };
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: GoalStatus;
  };
  version: number;
}

/**
 * 目标目录
 */
export interface IGoalDir {
  uuid: string;
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
    createdAt: Date;
    updatedAt: Date;
    status: GoalDirStatus;
  };
}

/**
 * 关键结果记录
 */
export interface IGoalRecord {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  value: number;
  note?: string;
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * 目标复盘
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
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };
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
