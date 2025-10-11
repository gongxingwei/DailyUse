import { Router, type Router as ExpressRouter } from 'express';
import { GoalDirController } from '../controllers/GoalDirController';

const router: ExpressRouter = Router();

// 基础 CRUD 路由
router.post('/', GoalDirController.createGoalDir);
router.get('/', GoalDirController.getGoalDirs);
router.get('/:id', GoalDirController.getGoalDirById);
router.put('/:id', GoalDirController.updateGoalDir);
router.delete('/:id', GoalDirController.deleteGoalDir);

export default router;
