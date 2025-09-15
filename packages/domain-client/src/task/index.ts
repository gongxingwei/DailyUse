/**
 * Task模块 - 领域客户端包导出
 * 提供完整的DDD聚合根控制模式实现
 */

// ===== 聚合根 =====
export { TaskTemplate } from './aggregates/TaskTemplate';

// ===== 实体 =====
export { TaskInstance } from './entities/TaskInstance';
export { TaskMetaTemplate } from './entities/TaskMetaTemplate';

// ===== 应用服务 =====
export { TaskApplicationService } from './services/TaskApplicationService';
