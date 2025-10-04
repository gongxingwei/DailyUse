import { Router } from 'express';
import taskTemplateRoutes from './routes/taskTemplateRoutes';
import taskMetaTemplateRoutes from './routes/taskMetaTemplateRoutes';

/**
 * Task模块主路由
 * 采用 DDD 聚合根控制模式，一个聚合根对应一个路由文件
 *
 * 路由组织：
 * - taskTemplateRoutes.ts → TaskTemplateController（任务模板聚合根，包含TaskInstance子实体）
 * - taskMetaTemplateRoutes.ts → TaskMetaTemplateController（任务元模板聚合根）
 */
const router = Router();

// ========== TaskTemplate 聚合根路由 ==========
// 路径: /api/tasks/templates/*
// 包含: 任务模板、任务实例、统计查询
router.use('/templates', taskTemplateRoutes);

// ========== TaskMetaTemplate 聚合根路由 ==========
// 路径: /api/tasks/meta-templates/*
router.use('/meta-templates', taskMetaTemplateRoutes);

export default router;
