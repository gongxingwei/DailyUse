import { Router } from 'express';
import { GoalController } from './controllers/GoalController';

const router = Router();

// 基础 CRUD 路由
router.post('/', GoalController.createGoal);
router.get('/', GoalController.getGoals);
router.get('/search', GoalController.searchGoals);
router.get('/stats', GoalController.getGoalStats);
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// 目标状态管理路由
router.post('/:id/activate', GoalController.activateGoal);
router.post('/:id/pause', GoalController.pauseGoal);
router.post('/:id/complete', GoalController.completeGoal);
router.post('/:id/archive', GoalController.archiveGoal);

// 进度管理路由
router.put('/:id/progress', GoalController.updateProgress);
router.post('/:id/milestones', GoalController.recordMilestone);

// 查询路由
router.get('/:id/timeline', GoalController.getGoalTimeline);
router.get('/account/:accountUuid/active', GoalController.getActiveGoals);
router.get('/account/:accountUuid/completed', GoalController.getCompletedGoals);

export default router;
