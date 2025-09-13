import { Router } from 'express';
import { GoalController } from './controllers/GoalController.js';
import { KeyResultController } from './controllers/KeyResultController.js';
import { GoalRecordController } from './controllers/GoalRecordController.js';
import { GoalReviewController } from './controllers/GoalReviewController.js';
import { goalAggregateRoutes } from './routes/goalAggregateRoutes';

const router = Router();

// ============ DDD聚合根控制路由（推荐使用）============
// 体现DDD聚合根控制模式，通过聚合根管理所有子实体
router.use('/', goalAggregateRoutes);

// ============ 传统CRUD路由（向后兼容）============

// 基础 CRUD 路由
router.post('/', GoalController.createGoal);
router.get('/', GoalController.getGoals);
router.get('/search', GoalController.searchGoals);
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// 目标状态管理路由
router.post('/:id/activate', GoalController.activateGoal);
router.post('/:id/pause', GoalController.pauseGoal);
router.post('/:id/complete', GoalController.completeGoal);
router.post('/:id/archive', GoalController.archiveGoal);

// ============ KeyResult 路由 ============

router.post('/key-results', KeyResultController.createKeyResult);
router.get('/:goalId/key-results', KeyResultController.getKeyResultsByGoal);
router.put('/key-results/:id', KeyResultController.updateKeyResult);
router.put('/key-results/:id/progress', KeyResultController.updateKeyResultProgress);
router.delete('/key-results/:id', KeyResultController.deleteKeyResult);

// ============ GoalRecord 路由 ============

router.post('/records', GoalRecordController.createGoalRecord);
router.get('/:goalId/records', GoalRecordController.getGoalRecordsByGoal);
router.get('/key-results/:keyResultId/records', GoalRecordController.getGoalRecordsByKeyResult);
router.get('/records/:id', GoalRecordController.getGoalRecordById);
router.delete('/records/:id', GoalRecordController.deleteGoalRecord);

// ============ GoalReview 路由 ============

router.post('/:goalId/reviews', GoalReviewController.createGoalReview);
router.get('/:goalId/reviews', GoalReviewController.getGoalReviewsByGoal);
router.get('/reviews/:id', GoalReviewController.getGoalReviewById);
router.put('/reviews/:id', GoalReviewController.updateGoalReview);
router.delete('/reviews/:id', GoalReviewController.deleteGoalReview);

export default router;
