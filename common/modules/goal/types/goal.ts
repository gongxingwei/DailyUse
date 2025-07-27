/**
 * 关键结果关联（用于任务关联）
 */
export type KeyResultLink = {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
};

/**
 * 关键结果量化指标
 */
export interface IKeyResult {
  uuid: string;
  name: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  weight: number;
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "completed" | "archived";
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
  records: IRecord[];
  reviews: IGoalReview[];
  analysis: {
    motive: string;
    feasibility: string;
  };
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "completed" | "paused" | "archived";
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
    status: "active" | "archived";
  };
}

/**
 * 关键结果记录
 */
export interface IRecord {
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
  type: "weekly" | "monthly" | "midterm" | "final" | "custom";
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
  ALL: "system_all",
  DELETED: "system_deleted",
  ARCHIVED: "system_archived",
} as const;