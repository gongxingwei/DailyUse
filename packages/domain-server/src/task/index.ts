// Task 聚合根
export { TaskTemplate } from './aggregates/TaskTemplate';
export { TaskMetaTemplate } from './aggregates/TaskMetaTemplate';

// Task 实体
export { TaskInstance } from './entities/TaskInstance';

// Task 异常
export { TaskDomainException, TaskErrorCode } from './exceptions/TaskDomainException';

// Task 仓储接口（按聚合根分离）
export type { ITaskTemplateAggregateRepository } from './repositories/ITaskTemplateAggregateRepository';
export type { ITaskMetaTemplateAggregateRepository } from './repositories/ITaskMetaTemplateAggregateRepository';
export type { ITaskStatsAggregateRepository } from './repositories/ITaskStatsAggregateRepository';
