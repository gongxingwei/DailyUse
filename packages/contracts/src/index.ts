export * from './shared';

// 导出响应系统类型定义
export * from './response';

// 导出API层面的验证模式 (Zod schemas)
export * as AccountContracts from './schemas/account';
export { AccountStatus, AccountType } from './core/account';
export * as AuthContracts from './schemas/auth';

// 导出所有领域核心类型定义 (Core Contracts)
export * from './core';
export * as CoreContracts from './core';

// 导出所有事件相关的定义
export * from './events/index';
export * as EventContracts from './events/index';

// 导出前端相关的类型定义
export * from './frontend';
export * as FrontendContracts from './frontend';

// 导出所有模块相关的类型定义
export * from './modules';
export * as ModuleContracts from './modules';

// 导出模块相关的类型定义（保持向后兼容）
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';

// 新增模块的导出
export * as AccountModuleContracts from './modules/account';
export * as AuthenticationContracts from './modules/authentication';
export * as SessionManagementContracts from './modules/sessionManagement';
export * as NotificationContracts from './modules/notification';
export * as AppContracts from './modules/app';
export * as SettingContracts from './modules/setting';
export * as ThemeContracts from './modules/theme';

// 确保导出新的认证类型
export type { LoginResponseDTO, UserInfoDTO } from './core/authentication';

// 直接导出常用的接口类型
export type { IGoal, IGoalDir, IKeyResult, IGoalRecord, IGoalReview } from './modules/goal/types';
export type { IRepository } from './modules/repository/types';
export type { ITaskTemplate, ITaskInstance } from './modules/task/types';
export type { IReminderTemplate, IReminderInstance } from './modules/reminder/types';

// 导出新增模块的核心接口
export type { IAccount, IUser } from './modules/account/types';
export type { IUserSession, SessionType } from './modules/sessionManagement/types';
export { SessionStatus } from './modules/sessionManagement/types';
export type {
  INotification,
  NotificationType,
  NotificationStatus,
} from './modules/notification/types';
export type { IAppInfo, IAppConfig, IWindowConfig } from './modules/app/types';
export type { ISettingDefinition, ISettingGroup, SettingScope } from './modules/setting/types';
export type { IThemeDefinition, IThemeConfig, ThemeType } from './modules/theme/types';

// 导出Schedule模块
export * as ScheduleContracts from './modules/schedule';
export * from './modules/schedule';
