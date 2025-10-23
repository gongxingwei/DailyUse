import { Router, type Router as ExpressRouter } from 'express';
import taskTemplateRoutes from './taskTemplateRoutes';
import taskDependencyRoutes from './taskDependencyRoutes';

/**
 * Task Module Main Router
 * 任务模块主路由器
 * 
 * 统一管理任务模块的所有路由:
 * - /templates - 任务模板管理
 * - /:taskUuid/dependencies - 任务依赖管理
 * - /dependencies/* - 依赖关系操作
 */
const router: ExpressRouter = Router();

// 任务模板路由 (保持现有结构)
router.use('/templates', taskTemplateRoutes);

// 任务依赖路由
// 合并到主路由，这样 URL 就是:
// - POST /tasks/:taskUuid/dependencies
// - GET /tasks/:taskUuid/dependencies
// - DELETE /tasks/dependencies/:uuid
// 等
router.use('/', taskDependencyRoutes);

export default router;
