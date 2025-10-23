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

// 设置模块
export * as SettingDomain from './setting';

// 重新导出常用类型（便于直接导入）
export * from './goal';
