/**
 * Goal 模块持久化 DTO 定义 - 用于扁平化存储
 */

import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import {
  GoalDirStatus,
  GoalDirSystemType,
  GoalRelationshipType,
  GoalReviewType,
  GoalStatus,
  KeyResultCalculationMethod,
  KeyResultStatus,
} from './enums';

/**
 * 目标持久化 DTO
 */
export interface GoalPersistenceDTO {
  uuid: string;
  accountUuid: string;

  // 基本信息
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: Date; // PostgreSQL TIMESTAMP WITH TIME ZONE
  endTime: Date; // PostgreSQL TIMESTAMP WITH TIME ZONE
  note?: string;

  // 分析信息 - 扁平化
  motive: string;
  feasibility: string;
  importanceLevel: ImportanceLevel;
  urgencyLevel: UrgencyLevel;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
  status: GoalStatus;

  // 元数据 - JSON 存储
  tags: string; // JSON string
  category: string;

  // 版本控制
  version: number;
}

/**
 * 关键结果持久化 DTO
 */
export interface KeyResultPersistenceDTO {
  uuid: string;
  goalUuid: string;

  // 基本信息
  name: string;
  description?: string;
  unit: string;
  weight: number;

  // 数值信息
  startValue: number;
  targetValue: number;
  currentValue: number;

  // 计算配置
  calculationMethod: KeyResultCalculationMethod;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
  status: KeyResultStatus;
}

/**
 * 目标记录持久化 DTO
 */
export interface GoalRecordPersistenceDTO {
  uuid: string;
  goalUuid: string; // 添加 goalUuid 属性
  keyResultUuid: string;

  // 记录信息
  value: number;
  note?: string;
  createdAt: Date;
}

/**
 * 目标复盘持久化 DTO
 */
export interface GoalReviewPersistenceDTO {
  uuid: string;
  goalUuid: string;

  // 评审信息
  title: string;
  type: GoalReviewType;
  reviewDate: Date;
  content: string; // JSON string
  rating: string; // JSON string
  snapshot: string; // JSON string

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 目标关系持久化 DTO
 */
export interface GoalRelationshipPersistenceDTO {
  uuid: string;
  sourceGoalUuid: string;
  targetGoalUuid: string;

  // 关系信息
  relationshipType: GoalRelationshipType;
  strength: number;
  description?: string;
  isActive: boolean;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 目标目录持久化 DTO
 */
export interface GoalDirPersistenceDTO {
  uuid: string;
  accountUuid: string;
  parentUuid?: string;

  name: string;
  description?: string;
  icon: string;
  color: string;

  // 排序配置 - 扁平化
  sortKey: string;
  sortOrder: number;

  // 系统配置
  status: GoalDirStatus;
  isDefault: boolean;
  metadata?: string; // JSON string
  systemType?: GoalDirSystemType;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
}
