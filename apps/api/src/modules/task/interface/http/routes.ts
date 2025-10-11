import { Router, type Router as ExpressRouter } from 'express';
import taskTemplateRoutes from './routes/taskTemplateRoutes';
import taskMetaTemplateRoutes from './routes/taskMetaTemplateRoutes';

/**
 * Task 模块主路由 - DDD 聚合根设计
 *
 * 架构原则：
 * 1. TaskTemplate 是聚合根，TaskInstance 是子实体
 * 2. TaskInstance 只能通过 TaskTemplate 聚合根访问
 * 3. 前端通过 /templates API 获取完整数据（包含 instances）
 * 4. 前端 Store 维护两份数据：templates（聚合）和 instances（扁平化视图）
 *
 * 路由组织：
 * - /templates/* → TaskTemplateController（聚合根，包含子实体操作）
 * - /meta-templates/* → TaskMetaTemplateController（元模板聚合根）
 *
 * 数据流转：
 * Backend: Template (含 instances[]) → Frontend Store: { templates, instances }
 */
const router: ExpressRouter = Router();

// ========== TaskTemplate 聚合根路由 ==========
// 路径: /api/v1/tasks/templates/*
// 说明: 包含模板 CRUD、实例管理、统计查询
router.use('/templates', taskTemplateRoutes);

// ========== TaskMetaTemplate 聚合根路由 ==========
// 路径: /api/v1/tasks/meta-templates/*
router.use('/meta-templates', taskMetaTemplateRoutes);

export default router;
