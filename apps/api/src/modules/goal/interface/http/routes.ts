import { Router } from 'express';
import { GoalController } from './controllers/GoalController.js';
import { GoalAggregateController } from './controllers/GoalAggregateController.js';
import { goalAggregateRoutes } from './routes/goalAggregateRoutes';

const router = Router();

// ============ DDD聚合根控制路由（推荐使用）============
// 体现DDD聚合根控制模式，通过聚合根管理所有子实体
// 注意：必须在通用路由之前注册，避免路由冲突
router.use('/', goalAggregateRoutes);

// ============ 传统CRUD路由（向后兼容）============
// 注意：这些路由要放在聚合路由之后，避免 /:id 匹配到聚合路由

// 搜索路由（必须在 /:id 之前）
router.get('/search', GoalController.searchGoals);

// 基础 CRUD 路由
router.post('/', GoalController.createGoal);
router.get('/', GoalController.getGoals);
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// 目标状态管理路由
router.post('/:id/activate', GoalController.activateGoal);
router.post('/:id/pause', GoalController.pauseGoal);
router.post('/:id/complete', GoalController.completeGoal);
router.post('/:id/archive', GoalController.archiveGoal);

export default router;
