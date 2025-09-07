/**
 * 关键结果接口
 */
export interface IKeyResult {
  uuid: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 目标记录接口
 */
export interface IGoalRecord {
  uuid: string;
  keyResultUuid: string;
  value: number;
  note?: string;
  recordDate: Date;
  createdAt: Date;
}

/**
 * 目标复盘接口
 */
export interface IGoalReview {
  uuid: string;
  reviewDate: Date;
  content: string;
  rating: number; // 1-5
  lessonsLearned?: string;
  nextSteps?: string;
  createdAt: Date;
}

/**
 * 目标接口
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
    status: 'active' | 'completed' | 'paused' | 'archived';
  };
  version: number;
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
