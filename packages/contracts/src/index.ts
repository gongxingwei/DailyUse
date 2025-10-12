// 导出响应系统类型定义
export * from './response';

// 导出共享的基础类型定义
export * as sharedContracts from './shared/index';
// 直接导出重要的枚举类型，方便其他包使用
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';

// 导出所有事件相关的定义
export * from './events/index';
export * as EventContracts from './events/index';

// 导出模块相关的类型定义（定义命名空间防止冲突）
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';
export * as AccountContracts from './modules/account';
export * as AuthenticationContracts from './modules/authentication';
export * as SessionManagementContracts from './modules/sessionManagement';
export * as NotificationContracts from './modules/notification';
export * as AppContracts from './modules/app';
export * as SettingContracts from './modules/setting';
export * as ThemeContracts from './modules/theme';
export * as ScheduleContracts from './modules/schedule';
export * from './modules/index';

// 注意：不再直接导出所有枚举，避免 SortOrder 等重复定义冲突
// SortOrder 在 goal/notification/reminder 模块中都有定义，必须通过命名空间访问
// 例如: GoalContracts.SortOrder, NotificationContracts.SortOrder

// 保留 Reminder 枚举导出（代码中有直接使用）
export {
  ReminderTimeConfigType,
  ReminderDurationUnit,
  ReminderPriority,
  ReminderStatus,
  ReminderTemplateEnableMode,
} from './modules/reminder/enums';

// 导出 Schedule 枚举（新的 DDD 架构）
// 注意：旧的枚举（ScheduleStatus, SchedulePriority 等）已废弃，使用新的枚举
export {
  ScheduleTaskStatus,
  ExecutionStatus,
  TaskPriority,
  SourceModule,
  Timezone,
} from './modules/schedule/enums';

// 旧枚举的类型别名（向后兼容，待迁移）
// TODO: 逐步迁移使用旧枚举的代码到新枚举
export { TaskPriority as SchedulePriority } from './modules/schedule/enums';

// 导出 Goal 枚举（不包含 SortOrder）
export {
  GoalStatus,
  KeyResultStatus,
  GoalProgressStatus,
  GoalSortField,
  GoalDirSystemType,
} from './modules/goal/enums';

// 导出 Notification 枚举（不包含 SortOrder）
export {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  DeliveryStatus,
  NotificationActionType, // 添加 NotificationActionType
} from './modules/notification/enums';

// 导出 Task 枚举（常用的）
export {
  TaskTemplateStatus,
  TaskInstanceStatus,
  TaskTimeType,
  TaskScheduleMode,
} from './modules/task/enums';

// 导出 Theme 枚举
export { ThemeType } from './modules/theme/enums';
