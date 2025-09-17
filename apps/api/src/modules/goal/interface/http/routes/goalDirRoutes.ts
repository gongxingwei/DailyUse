import { Router } from 'express';
import { GoalDirController } from '../controllers/GoalDirController.js';

const router = Router();

// 基础 CRUD 路由
router.post('/', GoalDirController.createGoalDir);
router.get('/', GoalDirController.getGoalDirs);
router.get('/:id', GoalDirController.getGoalDirById);
router.put('/:id', GoalDirController.updateGoalDir);
router.delete('/:id', GoalDirController.deleteGoalDir);

export default router;
