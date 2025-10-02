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

// ==================== 客户端接口（包含计算属性）====================

/**
 * 关键结果客户端接口 - 包含计算属性
 * 继承基础接口，添加前端需要的计算属性
 */
export interface IKeyResultClient extends IKeyResult {
  // 计算属性
  progress: number; // 完成百分比 (0-100)
  isCompleted: boolean; // 是否已完成
  remaining: number; // 剩余数量
}

/**
 * 目标记录客户端接口 - 包含计算属性
 * 目前与基础接口相同，预留扩展空间
 */
export interface IGoalRecordClient extends IGoalRecord {
  // 预留扩展
}

/**
 * 目标复盘客户端接口 - 包含计算属性
 */
export interface IGoalReviewClient extends IGoalReview {
  // 计算属性
  overallRating: number; // 平均评分
  isPositiveReview: boolean; // 是否为正向评价 (评分 >= 7)
}

/**
 * 目标客户端接口 - 包含所有计算属性
 * 前端渲染专用，包含所有实时计算的属性
 */
export interface IGoalClient extends Omit<IGoal, 'keyResults' | 'records' | 'reviews'> {
  // 子实体使用客户端接口
  keyResults: IKeyResultClient[];
  records: IGoalRecordClient[];
  reviews: IGoalReviewClient[];

  // ===== 计算属性 - 进度相关 =====
  overallProgress: number; // 整体进度百分比 (0-100)
  weightedProgress: number; // 加权进度百分比 (0-100)
  calculatedProgress: number; // 计算进度百分比 (0-100)
  todayProgress: number; // 今日进度增量百分比

  // ===== 计算属性 - 关键结果统计 =====
  completedKeyResults: number; // 已完成的关键结果数量
  totalKeyResults: number; // 关键结果总数
  keyResultCompletionRate: number; // 关键结果完成率 (0-100)

  // ===== 计算属性 - 状态分析 =====
  progressStatus:
    | 'not-started'
    | 'in-progress'
    | 'nearly-completed'
    | 'completed'
    | 'over-achieved'; // 进度状态（继承自 IGoal）
  healthScore: number; // 健康度评分 (0-100)

  // ===== 计算属性 - 时间相关 =====
  daysRemaining: number; // 剩余天数
  isOverdue: boolean; // 是否过期
  durationDays: number; // 持续天数
  elapsedDays: number; // 已进行天数
  timeProgress: number; // 时间进度百分比 (0-100)

  // ===== 计算属性 - 今日进度相关 =====
  hasTodayProgress: boolean; // 是否有今日进展
  todayProgressLevel: 'none' | 'low' | 'medium' | 'high' | 'excellent'; // 今日进度等级
  todayRecordsStats: {
    totalRecords: number; // 今日记录总数
    keyResultsWithRecords: number; // 有记录的关键结果数
    averageRecordValue: number; // 平均记录值
    totalRecordValue: number; // 总记录值
  };
}

/**
 * 目标目录客户端接口 - 包含计算属性
 */
export interface IGoalDirClient extends IGoalDir {
  // 计算属性
  goalsCount: number; // 目录下的目标数量
  subDirs?: IGoalDirClient[]; // 子目录列表
}
