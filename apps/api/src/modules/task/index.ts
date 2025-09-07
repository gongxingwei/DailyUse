// 导出应用层
export { TaskApplicationService } from './application/index.js';

// 导出领域层
export {
  TaskDomainService,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
} from './domain/index.js';

// 导出基础设施层
export {
  PrismaTaskTemplateRepository,
  PrismaTaskInstanceRepository,
} from './infrastructure/repositories/index.js';

// 导出接口层
export { taskRouter } from './interface/routes/index.js';
export {
  TaskTemplateController,
  TaskInstanceController,
  TaskController,
} from './interface/controllers/index.js';
