// ========== Goal 模块枚举定义 ==========

/**
 * 目标状态枚举
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/**
 * 关键结果状态枚举
 */
export enum KeyResultStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/**
 * 关键结果计算方式
 */
export enum KeyResultCalculationMethod {
  SUM = 'sum',
  AVERAGE = 'average',
  MAX = 'max',
  MIN = 'min',
  CUSTOM = 'custom',
}

/**
 * 目标复盘类型
 */
export enum GoalReviewType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MIDTERM = 'midterm',
  FINAL = 'final',
  CUSTOM = 'custom',
}

/**
 * 目标关系类型
 */
export enum GoalRelationshipType {
  PARENT = 'parent',
  CHILD = 'child',
  DEPENDENCY = 'dependency',
  RELATED = 'related',
}

/**
 * 目标目录状态
 */
export enum GoalDirStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * 目标目录系统类型
 */
export enum GoalDirSystemType {
  ALL = 'ALL',
  UNCATEGORIZED = 'UNCATEGORIZED',
  ARCHIVED = 'ARCHIVED',
  CUSTOM = 'CUSTOM',
}

/**
 * 目标进度状态
 */
export enum GoalProgressStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  NEARLY_COMPLETED = 'nearly-completed',
  COMPLETED = 'completed',
  OVER_ACHIEVED = 'over-achieved',
}

/**
 * 今日进度等级
 */
export enum GoalTodayProgressLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXCELLENT = 'excellent',
}

/**
 * 目标排序字段
 */
export enum GoalSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  END_TIME = 'endTime',
  PROGRESS = 'progress',
}

/**
 * 排序方向
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
