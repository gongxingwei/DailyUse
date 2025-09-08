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

// 导出模块相关的类型定义
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';

// 确保导出新的认证类型
export type { LoginResponseDTO, UserInfoDTO } from './core/authentication';

// 直接导出常用的接口类型
export type { IGoal, IGoalDir, IKeyResult, IGoalRecord, IGoalReview } from './modules/goal/types';
export type { IRepository } from './modules/repository/types';
export type { ITaskTemplate, ITaskInstance } from './modules/task/types';
export type { IReminderTemplate, IReminderInstance } from './modules/reminder/types';
