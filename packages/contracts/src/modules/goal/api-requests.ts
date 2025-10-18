/**
 * Goal Module API Requests
 * 目标模块 API 请求/响应类型定义
 */

import type {
  GoalServerDTO,
  GoalClientDTO,
  GoalFolderServerDTO,
  GoalFolderClientDTO,
  GoalStatisticsServerDTO,
  GoalStatisticsClientDTO,
} from './aggregates';
import type { KeyResultServerDTO, GoalReviewServerDTO } from './entities';
import type { GoalStatus, ImportanceLevel, UrgencyLevel, FolderType } from './enums';
import type { BatchOperationResponseDTO } from '../../shared/dtos';

// ============ Goal 请求/响应 ============

/**
 * 创建目标请求
 */
export interface CreateGoalRequest {
  accountUuid: string;
  title: string;
  description?: string;
  color?: string; // 主题色（hex 格式，如 #FF5733）
  feasibilityAnalysis?: string; // 可行性分析
  motivation?: string; // 实现动机
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  category?: string;
  tags?: string[];
  startDate?: number;
  targetDate?: number;
  folderUuid?: string;
  parentGoalUuid?: string;
  keyResults?: Array<{
    title: string;
    description?: string;
    valueType: string;
    targetValue: number;
    unit?: string;
    weight: number;
  }>;
}

/**
 * 更新目标请求
 */
export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  color?: string; // 主题色
  feasibilityAnalysis?: string; // 可行性分析
  motivation?: string; // 实现动机
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  category?: string;
  tags?: string[];
  startDate?: number;
  targetDate?: number;
  folderUuid?: string;
  parentGoalUuid?: string;
}

/**
 * 查询目标请求
 */
export interface QueryGoalsRequest {
  accountUuid: string;
  status?: GoalStatus[];
  importance?: ImportanceLevel[];
  urgency?: UrgencyLevel[];
  category?: string;
  tags?: string[];
  folderUuid?: string;
  keyword?: string;
  startDate?: number;
  endDate?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'targetDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeKeyResults?: boolean;
  includeReviews?: boolean;
}

/**
 * 目标响应
 */
export interface GoalResponse {
  goal: GoalServerDTO | GoalClientDTO;
}

/**
 * 目标列表响应
 */
export interface GoalsResponse {
  goals: (GoalServerDTO | GoalClientDTO)[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ KeyResult 请求/响应 ============

/**
 * 添加关键结果请求
 */
export interface AddKeyResultRequest {
  goalUuid: string;
  title: string;
  description?: string;
  valueType: string;
  targetValue: number;
  unit?: string;
  weight: number;
}

/**
 * 更新关键结果请求
 */
export interface UpdateKeyResultRequest {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  weight?: number;
}

/**
 * 更新关键结果进度请求
 */
export interface UpdateKeyResultProgressRequest {
  keyResultUuid: string;
  newValue: number;
  note?: string;
}

/**
 * 关键结果响应
 */
export interface KeyResultResponse {
  keyResult: KeyResultServerDTO;
}

// ============ GoalReview 请求/响应 ============

/**
 * 创建复盘请求
 */
export interface CreateGoalReviewRequest {
  goalUuid: string;
  title: string;
  content: string;
  reviewType: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
  reviewedAt?: number;
}

/**
 * 更新复盘请求
 */
export interface UpdateGoalReviewRequest {
  title?: string;
  content?: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
}

/**
 * 复盘响应
 */
export interface GoalReviewResponse {
  review: GoalReviewServerDTO;
}

/**
 * 复盘列表响应
 */
export interface GoalReviewsResponse {
  reviews: GoalReviewServerDTO[];
  total: number;
}

// ============ GoalFolder 请求/响应 ============

/**
 * 创建文件夹请求
 */
export interface CreateGoalFolderRequest {
  accountUuid: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 更新文件夹请求
 */
export interface UpdateGoalFolderRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 查询文件夹请求
 */
export interface QueryGoalFoldersRequest {
  accountUuid: string;
  parentFolderUuid?: string;
  includeSystemFolders?: boolean;
  sortBy?: 'name' | 'createdAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 文件夹响应
 */
export interface GoalFolderResponse {
  folder: GoalFolderServerDTO | GoalFolderClientDTO;
}

/**
 * 文件夹列表响应
 */
export interface GoalFoldersResponse {
  folders: (GoalFolderServerDTO | GoalFolderClientDTO)[];
  total: number;
}

// ============ GoalStatistics 请求/响应 ============

/**
 * 获取统计请求
 */
export interface GetGoalStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 统计响应
 */
export interface GoalStatisticsResponse {
  statistics: GoalStatisticsServerDTO | GoalStatisticsClientDTO;
}

// ============ 批量操作 ============

/**
 * 批量更新目标状态请求
 */
export interface BatchUpdateGoalStatusRequest {
  goalUuids: string[];
  status: GoalStatus;
}

/**
 * 批量移动目标请求
 */
export interface BatchMoveGoalsRequest {
  goalUuids: string[];
  targetFolderUuid: string;
}

/**
 * 批量删除目标请求
 */
export interface BatchDeleteGoalsRequest {
  goalUuids: string[];
  hardDelete?: boolean;
}

/**
 * 批量操作响应
 */
export type BatchOperationResponse = BatchOperationResponseDTO;

// ============ 导出/导入 ============

/**
 * 导出目标请求
 */
export interface ExportGoalsRequest {
  accountUuid: string;
  goalUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeKeyResults?: boolean;
  includeReviews?: boolean;
}

/**
 * 导出响应
 */
export interface ExportGoalsResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入目标请求
 */
export interface ImportGoalsRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}

/**
 * 导入响应
 */
export interface ImportGoalsResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}
