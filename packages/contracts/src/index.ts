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

// 导出模块相关的类型定义（保持向后兼容）
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

// 导出模块的枚举类型
export * from './modules/goal/enums';
export * from './modules/schedule/enums';
