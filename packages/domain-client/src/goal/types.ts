/**
 * Goal Module - Type Aliases
 * 目标模块 - 类型别名
 * 
 * 这个文件提供简短的类型别名，便于在应用中导入使用
 */

import { GoalClient } from './aggregates/GoalClient';
import { GoalFolderClient } from './aggregates/GoalFolderClient';
import { GoalStatisticsClient } from './aggregates/GoalStatisticsClient';
import { KeyResultClient } from './entities/KeyResultClient';
import { GoalRecordClient } from './entities/GoalRecordClient';
import { GoalReviewClient } from './entities/GoalReviewClient';

// 聚合根别名
export type Goal = GoalClient;
export type GoalFolder = GoalFolderClient;
export type GoalStatistics = GoalStatisticsClient;

// 实体别名
export type KeyResult = KeyResultClient;
export type GoalRecord = GoalRecordClient;
export type GoalReview = GoalReviewClient;

// 值对象别名
export type {
  GoalMetadataClient as GoalMetadata,
  GoalTimeRangeClient as GoalTimeRange,
  GoalReminderConfigClient as GoalReminderConfig,
  KeyResultProgressClient as KeyResultProgress,
  KeyResultSnapshotClient as KeyResultSnapshot,
} from './value-objects';

// 也导出原始类名（保持兼容性）
export {
  GoalClient,
  GoalFolderClient,
  GoalStatisticsClient,
  KeyResultClient,
  GoalRecordClient,
  GoalReviewClient,
};
