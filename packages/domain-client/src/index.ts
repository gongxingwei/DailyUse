/**
 * Domain Client - 客户端领域层
 *
 * 此包包含所有领域模块的客户端实现
 */

// ============ 命名空间导出（用于需要完整模块访问的场景） ============
// 编辑器模块
export * as EditorDomain from './editor';

// 目标模块
export * as GoalDomain from './goal';

// 知识库模块
export * as RepositoryDomain from './repository';

// 日程模块
export * as ScheduleDomain from './schedule';

// 任务模块
export * as TaskDomain from './task';

// 设置模块
export * as SettingDomain from './setting';

// ============ 直接导出（便于直接导入常用类型） ============

// Goal 模块 - 从实现导出
export type {
  Goal,
  GoalFolder,
  GoalDir, // 兼容性别名
  GoalStatistics,
  KeyResult,
  GoalRecord,
  GoalReview,
  GoalMetadata,
  GoalTimeRange,
  GoalReminderConfig,
  KeyResultProgress,
  KeyResultSnapshot,
} from './goal/types';

// Task 模块 - 从实现导出
export type {
  TaskTemplate,
  TaskInstance,
  TaskStatistics,
  TaskTemplateHistory,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from './task/types';

// Repository 模块 - 从实现导出
export type {
  Repository,
  Resource,
  LinkedContent,
  ResourceReference,
  RepositoryExplorer,
  RepositoryConfig,
  GitInfo,
  SyncStatus,
  RepositoryStats,
} from './repository';

// Account 模块 - 从 contracts 导出（domain-client 中暂无实现）
import type { AccountContracts } from '@dailyuse/contracts';

export type Account = AccountContracts.AccountClientDTO;

// Reminder 模块 - 从 contracts 导出（domain-client 中暂无实现）
// 注意：这些是 DTO 类型，不是类实现
// 使用命名空间导入以避免冲突
import type { ReminderContracts } from '@dailyuse/contracts';

export type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;
export type ReminderTemplateGroup = ReminderContracts.ReminderGroupClientDTO;

// TODO: ReminderInstance 类型不存在于 contracts，需要定义或移除相关引用
// 临时导出空类型以避免编译错误
export type ReminderInstance = any;

// Setting 模块
export type { UserSetting } from './setting';
// TODO: UserPreferences 可能需要作为 UserSetting 的别名
export type { UserSetting as UserPreferences } from './setting';
