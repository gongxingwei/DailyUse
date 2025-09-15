// Task 聚合根
export { TaskTemplate } from './aggregates/TaskTemplate';

// Task 实体
export { TaskInstance } from './entities/TaskInstance';
export { TaskMetaTemplate } from './entities/TaskMetaTemplate';

// Task 仓储接口
export type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  ITaskMetaTemplateRepository,
  ITaskStatsRepository,
  ITaskTemplateAggregateRepository,
  ITaskInstanceAggregateRepository,
} from './repositories/iTaskRepository';
