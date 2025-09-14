import { Router } from 'express';
import { GoalAggregateController } from '../controllers/GoalAggregateController.js';

/**
 * Goal聚合根控制路由
 * 体现DDD聚合根控制模式的REST API设计
 *
 * 路由设计原则：
 * 1. 子实体操作必须通过聚合根路径
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 */
const router = Router();

// 注意：认证在控制器层处理（从JWT token提取accountUuid）

// ===== 聚合根控制：关键结果管理 =====
// 体现DDD原则：KeyResult只能通过Goal聚合根操作

/**
 * 通过Goal聚合根创建关键结果
 * POST /api/v1/goals/:goalId/key-results
 *
 * 请求体示例：
 * {
 *   "name": "增加用户活跃度",
 *   "description": "通过功能优化提升用户活跃度",
 *   "startValue": 0,
 *   "targetValue": 80,
 *   "currentValue": 45,
 *   "unit": "%",
 *   "weight": 30,
 *   "calculationMethod": "average"
 * }
 *
 * 聚合根控制体现：
 * - 验证权重总和不超过100%
 * - 自动关联到指定目标
 * - 维护聚合一致性
 */
router.post('/:goalId/key-results', GoalAggregateController.createKeyResult);

/**
 * 通过Goal聚合根更新关键结果
 * PUT /api/v1/goals/:goalId/key-results/:keyResultId
 *
 * 请求体示例：
 * {
 *   "name": "新的关键结果名称",
 *   "currentValue": 60,
 *   "weight": 25,
 *   "status": "active"
 * }
 *
 * 聚合根控制体现：
 * - 重新验证权重总和
 * - 更新聚合根版本
 * - 维护业务规则
 */
router.put('/:goalId/key-results/:keyResultId', GoalAggregateController.updateKeyResult);

/**
 * 通过Goal聚合根删除关键结果
 * DELETE /api/v1/goals/:goalId/key-results/:keyResultId
 *
 * 聚合根控制体现：
 * - 级联删除相关记录
 * - 维护聚合一致性
 * - 发布领域事件
 */
router.delete('/:goalId/key-results/:keyResultId', GoalAggregateController.deleteKeyResult);

// ===== 聚合根控制：目标记录管理 =====

/**
 * 通过Goal聚合根创建目标记录
 * POST /api/v1/goals/:goalId/records
 *
 * 请求体示例：
 * {
 *   "keyResultUuid": "kr-uuid-123",
 *   "value": 65,
 *   "note": "本周通过新功能上线，用户活跃度提升至65%"
 * }
 *
 * 聚合根控制体现：
 * - 自动更新关键结果当前值
 * - 验证记录数据合理性
 * - 维护数据一致性
 */
router.post('/:goalId/records', GoalAggregateController.createGoalRecord);

// ===== 聚合根控制：目标复盘管理 =====

/**
 * 通过Goal聚合根创建目标复盘
 * POST /api/v1/goals/:goalId/reviews
 *
 * 请求体示例：
 * {
 *   "title": "Q1季度复盘",
 *   "type": "monthly",
 *   "content": {
 *     "achievements": "完成了用户活跃度提升目标",
 *     "challenges": "遇到了技术难题",
 *     "learnings": "学会了新的数据分析方法",
 *     "nextSteps": "继续优化用户体验",
 *     "adjustments": "调整目标权重分配"
 *   },
 *   "rating": {
 *     "progressSatisfaction": 8,
 *     "executionEfficiency": 7,
 *     "goalReasonableness": 9
 *   },
 *   "reviewDate": "2024-03-31T00:00:00.000Z"
 * }
 *
 * 聚合根控制体现：
 * - 自动生成状态快照
 * - 包含完整聚合状态
 * - 统一复盘数据管理
 */
router.post('/:goalId/reviews', GoalAggregateController.createGoalReview);

// ===== 聚合根完整视图 =====

/**
 * 获取Goal聚合根的完整视图
 * GET /api/v1/goals/:goalId/aggregate
 *
 * 响应示例：
 * {
 *   "success": true,
 *   "data": {
 *     "goal": { ... },
 *     "keyResults": [ ... ],
 *     "recentRecords": [ ... ],
 *     "reviews": [ ... ]
 *   }
 * }
 *
 * 聚合根完整性体现：
 * - 提供统一的数据视图
 * - 包含所有子实体信息
 * - 保证数据一致性
 */
router.get('/:goalId/aggregate', GoalAggregateController.getGoalAggregateView);

// ===== 聚合根批量操作 =====

/**
 * 批量更新关键结果权重（聚合根控制）
 * PUT /api/v1/goals/:goalId/key-results/batch-weight
 *
 * 请求体示例：
 * {
 *   "keyResults": [
 *     { "uuid": "kr-1", "weight": 40 },
 *     { "uuid": "kr-2", "weight": 35 },
 *     { "uuid": "kr-3", "weight": 25 }
 *   ]
 * }
 *
 * 聚合根控制体现：
 * - 验证权重总和不超过100%
 * - 原子性更新所有关键结果
 * - 维护业务规则一致性
 */
router.put(
  '/:goalId/key-results/batch-weight',
  GoalAggregateController.batchUpdateKeyResultWeights,
);

/**
 * 复制Goal聚合根（包含所有子实体）
 * POST /api/v1/goals/:goalId/clone
 *
 * 请求体示例：
 * {
 *   "newName": "2024年Q2用户增长目标",
 *   "newDescription": "基于Q1经验制定的新目标"
 * }
 *
 * 聚合根完整性体现：
 * - 复制目标及所有关键结果
 * - 保持数据关联关系
 * - 重置时间戳和状态
 */
router.post('/:goalId/clone', GoalAggregateController.cloneGoalAggregate);

export { router as goalAggregateRoutes };

/**
 * DDD聚合根控制模式在API设计中的体现：
 *
 * 1. **路由层次结构体现聚合边界**
 *    - /goals/:goalId/key-results/* (关键结果属于Goal聚合)
 *    - /goals/:goalId/records/* (记录属于Goal聚合)
 *    - /goals/:goalId/reviews/* (复盘属于Goal聚合)
 *
 * 2. **聚合根控制业务规则**
 *    - 关键结果权重总和验证
 *    - 数据一致性维护
 *    - 级联删除操作
 *
 * 3. **聚合根提供统一视图**
 *    - /goals/:goalId/aggregate 提供完整聚合视图
 *    - 包含所有相关子实体信息
 *    - 保证数据关联正确性
 *
 * 4. **批量操作通过聚合根**
 *    - 批量权重更新保证业务规则
 *    - 聚合根克隆保证完整性
 *    - 原子性操作保证一致性
 *
 * 5. **与传统CRUD的区别**
 *    - 传统：PUT /key-results/:id (直接操作子实体)
 *    - DDD：PUT /goals/:goalId/key-results/:id (通过聚合根)
 *    - 优势：业务规则集中，数据一致性有保障
 */
