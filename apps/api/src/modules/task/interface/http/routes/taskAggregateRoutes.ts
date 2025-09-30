/**
 * Task Aggregate Routes - 聚合根控制路由
 * 基于DDD聚合根控制模式的任务管理API路由
 *
 * 路由设计原则：
 * 1. 体现TaskTemplate聚合根对TaskInstance实体的管理控制
 * 2. 所有TaskInstance操作都通过TaskTemplate聚合根进行
 * 3. 提供聚合根级别的统计和分析功能
 * 4. 支持聚合根的完整生命周期管理
 *
 * 注意：使用 /aggregates 前缀避免与传统CRUD路由冲突
 */

import { Router } from 'express';
import { TaskAggregateController } from '../controllers/TaskAggregateController.js';

const router = Router();

// ===== TaskTemplate 聚合根管理 =====

/**
 * 创建任务模板聚合根
 * POST /api/v1/tasks/aggregates/templates
 */
router.post('/templates', TaskAggregateController.createTemplateAggregate);

/**
 * 获取任务模板聚合根（包含所有实例）
 * GET /api/v1/tasks/aggregates/templates/:templateUuid
 */
router.get('/templates/:templateUuid', TaskAggregateController.loadTemplateAggregate);

/**
 * 更新任务模板聚合根
 * PUT /api/v1/tasks/aggregates/templates/:templateUuid
 */
router.put('/templates/:templateUuid', TaskAggregateController.updateTemplateAggregate);

/**
 * 删除任务模板聚合根（包含所有实例）
 * DELETE /api/v1/tasks/aggregates/templates/:templateUuid
 */
router.delete('/templates/:templateUuid', TaskAggregateController.deleteTemplateAggregate);

/**
 * 获取任务模板聚合根的分析统计
 * GET /api/v1/tasks/aggregates/templates/:templateUuid/analytics
 */
router.get(
  '/templates/:templateUuid/analytics',
  TaskAggregateController.getTemplateAggregateAnalytics,
);

// ===== 通过聚合根管理TaskInstance实体 =====

/**
 * 通过聚合根创建任务实例
 * POST /api/v1/tasks/aggregates/templates/:templateUuid/instances
 */
router.post(
  '/templates/:templateUuid/instances',
  TaskAggregateController.createInstanceViaAggregate,
);

/**
 * 通过聚合根更新任务实例
 * PUT /api/v1/tasks/aggregates/templates/:templateUuid/instances/:instanceUuid
 */
router.put(
  '/templates/:templateUuid/instances/:instanceUuid',
  TaskAggregateController.updateInstanceViaAggregate,
);

/**
 * 通过聚合根删除任务实例
 * DELETE /api/v1/tasks/aggregates/templates/:templateUuid/instances/:instanceUuid
 */
router.delete(
  '/templates/:templateUuid/instances/:instanceUuid',
  TaskAggregateController.deleteInstanceViaAggregate,
);

/**
 * 通过聚合根完成任务实例
 * POST /api/v1/tasks/aggregates/templates/:templateUuid/instances/:instanceUuid/complete
 */
router.post(
  '/templates/:templateUuid/instances/:instanceUuid/complete',
  TaskAggregateController.completeInstanceViaAggregate,
);

/**
 * 通过聚合根取消任务实例
 * POST /api/v1/tasks/aggregates/templates/:templateUuid/instances/:instanceUuid/cancel
 */
router.post(
  '/templates/:templateUuid/instances/:instanceUuid/cancel',
  TaskAggregateController.cancelInstanceViaAggregate,
);

/**
 * 通过聚合根重新调度任务实例
 * POST /api/v1/tasks/aggregates/templates/:templateUuid/instances/:instanceUuid/reschedule
 */
router.post(
  '/templates/:templateUuid/instances/:instanceUuid/reschedule',
  TaskAggregateController.rescheduleInstanceViaAggregate,
);

// ===== 聚合根批量操作 =====

/**
 * 批量处理聚合根下的实例
 * POST /api/v1/tasks/aggregates/templates/:templateUuid/instances/batch
 */
router.post(
  '/templates/:templateUuid/instances/batch',
  TaskAggregateController.batchProcessInstancesViaAggregate,
);

// ===== 聚合根查询操作 =====

/**
 * 获取账户的所有任务模板聚合根列表
 * GET /api/v1/tasks/aggregates/template-aggregates
 */
router.get('/template-aggregates', TaskAggregateController.getAccountTemplateAggregates);

/**
 * 搜索任务模板聚合根
 * GET /api/v1/tasks/aggregates/template-aggregates/search
 */
router.get('/template-aggregates/search', TaskAggregateController.searchTemplateAggregates);

export default router;
