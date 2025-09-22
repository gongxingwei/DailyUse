/**
 * Editor Routes
 * 编辑器路由配置
 *
 * 包含两套路由：
 * 1. 聚合根控制路由（推荐） - 基于DDD聚合根控制模式
 * 2. 传统CRUD路由（兼容） - 保持向后兼容性
 */

import { Router } from 'express';

import { createEditorAggregateRoutes } from './editorAggregateRoutes.js';

export function createEditorRoutes(): Router {
  const router = Router();

  // ============ 聚合根控制路由（推荐使用） ============

  /**
   * 挂载聚合根控制路由
   * 基于DDD聚合根控制模式，确保数据一致性和业务规则完整性
   */
  router.use('/aggregate', createEditorAggregateRoutes());

  return router;
}
