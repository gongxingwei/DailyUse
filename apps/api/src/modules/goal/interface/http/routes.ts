import { Router } from 'express';
import { GoalController } from './controllers/GoalController.js';

const router = Router();

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

export default router;
