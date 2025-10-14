/**
 * Domain Client - 客户端领域层
 *
 * 此包包含所有领域模块的客户端实现
 */

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

// 通知模块
export * as NotificationDomain from './notification';

// 提醒模块
export * as ReminderDomain from './reminder';

// 账户模块
export * as AccountDomain from './account';

// 认证模块
export * as AuthenticationDomain from './authentication';
