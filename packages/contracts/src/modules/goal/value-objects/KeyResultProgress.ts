/**
 * Key Result Progress Value Object
 * 关键成果进度值对象
 */

import type { KeyResultValueType, AggregationMethod } from '../enums';

// ============ 接口定义 ============

/**
 * 关键成果进度 - Server 接口
 */
export interface IKeyResultProgressServer {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod; // 聚合计算方式
  targetValue: number;
  currentValue: number;
  unit?: string | null;

  // 值对象方法
  equals(other: IKeyResultProgressServer): boolean;
  with(
    updates: Partial<
      Omit<
        IKeyResultProgressServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IKeyResultProgressServer;

  // 业务方法
  calculatePercentage(): number; // 计算完成百分比
  isCompleted(): boolean; // 是否已完成
  updateProgress(newValue: number): IKeyResultProgressServer; // 更新进度
  recalculateFromRecords(recordValues: number[]): number; // 根据记录重新计算当前值

  // DTO 转换方法
  toServerDTO(): KeyResultProgressServerDTO;
  toClientDTO(): KeyResultProgressClientDTO;
  toPersistenceDTO(): KeyResultProgressPersistenceDTO;
}

/**
 * 关键成果进度 - Client 接口
 */
export interface IKeyResultProgressClient {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  targetValue: number;
  currentValue: number;
  unit?: string | null;

  // UI 辅助属性
  progressPercentage: number; // 完成百分比 0-100
  progressText: string; // "50/100 次" / "50%"
  progressBarColor: string; // 进度条颜色
  isCompleted: boolean;
  valueTypeText: string; // "累计值" / "绝对值" / "百分比" / "二元"
  aggregationMethodText: string; // "求和" / "求平均" / "求最大值" / "求最小值" / "取最后一次"

  // 值对象方法
  equals(other: IKeyResultProgressClient): boolean;

  // DTO 转换方法
  toServerDTO(): KeyResultProgressServerDTO;
}

// ============ DTO 定义 ============

/**
 * Key Result Progress Server DTO
 */
export interface KeyResultProgressServerDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}

/**
 * Key Result Progress Client DTO
 */
export interface KeyResultProgressClientDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
  progressPercentage: number;
  progressText: string;
  progressBarColor: string;
  isCompleted: boolean;
  valueTypeText: string;
  aggregationMethodText: string;
}

/**
 * Key Result Progress Persistence DTO
 */
export interface KeyResultProgressPersistenceDTO {
  valueType: KeyResultValueType;
  aggregation_method: AggregationMethod;
  target_value: number;
  current_value: number;
  unit?: string | null;
}

// ============ 类型导出 ============

export type KeyResultProgressServer = IKeyResultProgressServer;
export type KeyResultProgressClient = IKeyResultProgressClient;
