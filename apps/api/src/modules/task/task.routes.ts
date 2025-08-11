import type { Router } from 'express';
import express from 'express';
import { TaskController } from './task.controller';
import { authenticateToken } from '../auth/middlewares/auth.middleware';

const router: Router = express.Router();

router.use(authenticateToken);
router.get('/tasks', TaskController.list);
router.post('/tasks', TaskController.create);

export default router;
