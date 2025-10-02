import type {
  IGoal,
  IKeyResult,
  IGoalRecord,
  IGoalReview,
  IGoalDir,
  GoalQueryParams,
} from './types';
import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import {
  GoalDirStatus,
  GoalDirSystemType,
  GoalProgressStatus,
  GoalReviewType,
  GoalSortField,
  GoalStatus,
  GoalTodayProgressLevel,
  KeyResultCalculationMethod,
  KeyResultStatus,
  SortOrder,
} from './enums';

/**
 * ==========================================
 * Goal Module DTOs - RESTful API Design
 * ==========================================
 *
 * 设计原则：
 * 1. RESTful 风格：所有请求数据在 JSON body 中
 * 2. DTO vs ClientDTO：
 *    - DTO: 服务端内部传输对象（纯数据）
 *    - ClientDTO: 客户端渲染对象（包含计算属性）
 * 3. Request DTO: 直接映射实体属性，不过度拆分
 */

// ==================== 关键结果 (KeyResult) ====================

/**
 * 关键结果 DTO - 服务端数据传输对象
 * 用于服务端内部传输（Repository <-> Application <-> Domain）
 */
export interface KeyResultDTO {
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
    createdAt: number;
    updatedAt: number;
    status: KeyResultStatus;
  };
}

/**
 * 关键结果客户端 DTO - 前端渲染对象
 * 包含所有服务端数据 + 计算属性
 */
export interface KeyResultClientDTO extends KeyResultDTO {
  // 计算属性
  progress: number; // 完成百分比 (0-100)
  isCompleted: boolean; // 是否已完成
  remaining: number; // 剩余数量
}

/**
 * 创建关键结果请求 - POST /api/v1/goals/:goalId/key-results
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateKeyResultRequest = Pick<
  KeyResultDTO,
  'uuid' | 'name' | 'startValue' | 'targetValue' | 'unit' | 'weight'
> & {
  description?: string;
  currentValue?: number; // 默认为 startValue
  calculationMethod?: KeyResultCalculationMethod; // 默认为 INCREMENTAL
};

/**
 * 更新关键结果请求 - PUT /api/v1/goals/:goalId/key-results/:keyResultId
 * 只传递需要更新的字段
 */
export type UpdateKeyResultRequest = Partial<
  Omit<KeyResultDTO, 'uuid' | 'goalUuid' | 'lifecycle'>
> & {
  status?: KeyResultStatus; // 允许更新状态
};

// ==================== 目标记录 (GoalRecord) ====================

/**
 * 目标记录 DTO - 服务端数据传输对象
 */
export interface GoalRecordDTO {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  value: number;
  note?: string;
  createdAt: number;
}

/**
 * 目标记录客户端 DTO - 前端渲染对象
 * 目前与 GoalRecordDTO 相同，预留扩展空间
 */
export type GoalRecordClientDTO = GoalRecordDTO;

/**
 * 创建目标记录请求 - POST /api/v1/goals/:goalId/key-results/:keyResultId/records
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateGoalRecordRequest = Pick<GoalRecordDTO, 'uuid' | 'keyResultUuid' | 'value'> & {
  note?: string;
  recordDate?: number; // 默认为当前时间
};

// ==================== 目标复盘 (GoalReview) ====================

/**
 * 目标复盘 DTO - 服务端数据传输对象
 */
export interface GoalReviewDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  type: GoalReviewType;
  reviewDate: number;
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  snapshot: {
    snapshotDate: number;
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
  createdAt: number;
  updatedAt: number;
}

/**
 * 目标复盘客户端 DTO - 前端渲染对象
 */
export interface GoalReviewClientDTO extends GoalReviewDTO {
  // 计算属性
  overallRating: number; // 平均评分
  isPositiveReview: boolean; // 是否为正向评价 (评分 >= 7)
}

/**
 * 创建目标复盘请求 - POST /api/v1/goals/:goalId/reviews
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateGoalReviewRequest = Pick<
  GoalReviewDTO,
  'uuid' | 'title' | 'type' | 'content' | 'rating'
> & {
  reviewDate?: number; // 默认为当前时间
};

/**
 * 更新目标复盘请求 - PUT /api/v1/goals/:goalId/reviews/:reviewId
 * 只传递需要更新的字段（不包含 snapshot，由后端自动生成）
 */
export type UpdateGoalReviewRequest = Partial<
  Omit<GoalReviewDTO, 'uuid' | 'goalUuid' | 'snapshot' | 'createdAt' | 'updatedAt'>
>;

// ==================== 目标 (Goal) ====================

/**
 * 目标 DTO - 服务端数据传输对象
 * 用于服务端内部传输（Repository <-> Application <-> Domain）
 */
export interface GoalDTO {
  uuid: string;
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: number;
  endTime: number;
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    status: GoalStatus;
  };
  metadata: {
    tags: string[];
    category: string;
  };
  version: number;

  // 关联的子实体
  keyResults?: KeyResultDTO[];
  records?: GoalRecordDTO[];
  reviews?: GoalReviewDTO[];
}

/**
 * 目标客户端 DTO - 前端渲染对象
 * 包含所有服务端数据 + 计算属性
 */
export interface GoalClientDTO extends Omit<GoalDTO, 'keyResults' | 'records' | 'reviews'> {
  // 子实体使用 ClientDTO
  keyResults?: KeyResultClientDTO[];
  records?: GoalRecordClientDTO[];
  reviews?: GoalReviewClientDTO[];

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
  progressStatus: GoalProgressStatus; // 进度状态
  healthScore: number; // 健康度评分 (0-100)

  // ===== 计算属性 - 时间相关 =====
  daysRemaining: number; // 剩余天数
  isOverdue: boolean; // 是否过期
  durationDays: number; // 持续天数
  elapsedDays: number; // 已进行天数
  timeProgress: number; // 时间进度百分比 (0-100)

  // ===== 计算属性 - 今日进度相关 =====
  hasTodayProgress: boolean; // 是否有今日进展
  todayProgressLevel: GoalTodayProgressLevel; // 今日进度等级
  todayRecordsStats: {
    totalRecords: number; // 今日记录总数
    keyResultsWithRecords: number; // 有记录的关键结果数
    averageRecordValue: number; // 平均记录值
    totalRecordValue: number; // 总记录值
  };
}

/**
 * 创建目标请求 - POST /api/v1/goals
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateGoalRequest = Pick<
  GoalDTO,
  'uuid' | 'name' | 'color' | 'startTime' | 'endTime' | 'analysis' | 'metadata'
> & {
  description?: string;
  dirUuid?: string;
  note?: string;
  // 创建时可以一起创建子实体
  keyResults?: CreateKeyResultRequest[];
  records?: CreateGoalRecordRequest[];
  reviews?: CreateGoalReviewRequest[];
};

/**
 * 更新目标请求 - PUT /api/v1/goals/:goalId
 * 只传递需要更新的字段（不包含子实体，子实体通过独立 API 操作）
 */
export type UpdateGoalRequest = Partial<
  Omit<GoalDTO, 'uuid' | 'lifecycle' | 'version' | 'keyResults' | 'records' | 'reviews'>
> & {
  status?: GoalStatus; // 允许更新状态
};

// ==================== 目标目录 (GoalDir) ====================

/**
 * 目标目录 DTO - 服务端数据传输对象
 */
export interface GoalDirDTO {
  uuid: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentUuid?: string;
  sortConfig: {
    sortKey: GoalSortField;
    sortOrder: number;
  };
  systemType?: GoalDirSystemType;
  isDefault?: boolean;
  metadata?: {
    isSystemCreated?: boolean;
    createdBy?: string;
    purpose?: string;
    [key: string]: any;
  };
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    status: GoalDirStatus;
  };
}

/**
 * 目标目录客户端 DTO - 前端渲染对象
 */
export interface GoalDirClientDTO extends GoalDirDTO {
  // 计算属性
  goalsCount: number; // 目录下的目标数量
  subDirs?: GoalDirClientDTO[]; // 子目录列表
}

/**
 * 创建目标目录请求 - POST /api/v1/goal-dirs
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateGoalDirRequest = Pick<GoalDirDTO, 'uuid' | 'name' | 'icon' | 'color'> & {
  description?: string;
  parentUuid?: string;
  sortConfig?: {
    sortKey: GoalSortField;
    sortOrder: number;
  };
};

/**
 * 更新目标目录请求 - PUT /api/v1/goal-dirs/:dirId
 * 只传递需要更新的字段
 */
export type UpdateGoalDirRequest = Partial<
  Omit<GoalDirDTO, 'uuid' | 'lifecycle' | 'systemType' | 'isDefault' | 'metadata'>
> & {
  status?: GoalDirStatus; // 允许更新状态
};

// ==================== 列表响应 DTOs ====================

/**
 * 关键结果列表响应
 */
export interface KeyResultListResponse {
  data: KeyResultClientDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 目标记录列表响应
 */
export interface GoalRecordListResponse {
  data: GoalRecordClientDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 目标复盘列表响应
 */
export interface GoalReviewListResponse {
  data: GoalReviewClientDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 目标列表响应
 */
export interface GoalListResponse {
  data: GoalClientDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 目标目录列表响应
 */
export interface GoalDirListResponse {
  data: GoalDirClientDTO[];
  total: number;
}

// ==================== 其他响应 DTOs ====================

/**
 * 目标查询参数 DTO
 */
export interface GoalQueryParamsDTO extends Omit<GoalQueryParams, 'dateRange'> {
  dateRange?: {
    start: number;
    end: number;
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
    date: number;
    progress: number;
  }>;
  upcomingDeadlines: Array<{
    goalUuid: string;
    goalName: string;
    endTime: number;
    daysRemaining: number;
  }>;
}

/**
 * 目标聚合视图响应 - 包含目标及所有相关子实体的完整信息
 */
export interface GoalAggregateViewResponse {
  goal: GoalClientDTO;
  keyResults: KeyResultClientDTO[];
  recentRecords: GoalRecordClientDTO[];
  reviews: GoalReviewClientDTO[];
}

// ==================== 兼容性别名（逐步废弃）====================

/**
 * @deprecated 使用 KeyResultClientDTO 替代
 */
export type KeyResultResponse = KeyResultClientDTO;

/**
 * @deprecated 使用 GoalRecordClientDTO 替代
 */
export type GoalRecordResponse = GoalRecordClientDTO;

/**
 * @deprecated 使用 GoalReviewClientDTO 替代
 */
export type GoalReviewResponse = GoalReviewClientDTO;

/**
 * @deprecated 使用 GoalClientDTO 替代
 */
export type GoalResponse = GoalClientDTO;

/**
 * @deprecated 使用 GoalDirClientDTO 替代
 */
export type GoalDirResponse = GoalDirClientDTO;
