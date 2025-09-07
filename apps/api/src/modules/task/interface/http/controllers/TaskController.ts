import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import type { TaskContracts } from '@dailyuse/contracts';

export class TaskController {
  private static taskService = new TaskApplicationService();

  /**
   * 获取任务统计
   */
  static async getTaskStats(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const stats = await TaskController.taskService.getTaskStats(queryParams);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务统计失败',
      });
    }
  }

  /**
   * 获取任务时间线
   */
  static async getTaskTimeline(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const timeline = await TaskController.taskService.getTaskTimeline(queryParams);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务时间线失败',
      });
    }
  }

  /**
   * 搜索任务
   */
  static async searchTasks(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const tasks = await TaskController.taskService.searchTasks(queryParams);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索任务失败',
      });
    }
  }

  /**
   * 获取即将到来的任务
   */
  static async getUpcomingTasks(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const tasks = await TaskController.taskService.getUpcomingTasks(queryParams);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取即将到来的任务失败',
      });
    }
  }

  /**
   * 获取过期任务
   */
  static async getOverdueTasks(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const tasks = await TaskController.taskService.getOverdueTasks(queryParams);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取过期任务失败',
      });
    }
  }
}
