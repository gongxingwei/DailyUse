import type { Request, Response } from 'express';
import { createTaskUseCase } from '@dailyuse/domain';
import { TaskRepository } from '../../adapters/task/task.repository';
import { SystemClock } from '../../adapters/task/clock.adapter';

export class TaskController {
  static async create(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }
    const { id, title } = req.body as { id: string; title: string };
    if (!id || !title) {
      res.status(400).json({ success: false, message: '缺少必要字段' });
      return;
    }

    const uc = createTaskUseCase({ repo: new TaskRepository(userId), clock: new SystemClock() });
    const task = await uc({ id, title });
    res.status(201).json({ success: true, data: task });
  }

  static async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }
    const repo = new TaskRepository(userId);
    const tasks = await repo.list();
    res.json({ success: true, data: tasks });
  }
}
