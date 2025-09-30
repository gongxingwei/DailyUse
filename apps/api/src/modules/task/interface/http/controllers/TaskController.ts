import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import { prisma } from '../../../../../config/prisma';
import {
  PrismaTaskTemplateRepository,
  PrismaTaskInstanceRepository,
  PrismaTaskMetaTemplateRepository,
  PrismaTaskStatsRepository,
} from '../../../infrastructure/repositories/prisma';
import type { TaskContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';

export class TaskController {
  private static taskService: TaskApplicationService;

  /**
   * 初始化任务服务
   */
  private static async getTaskService(): Promise<TaskApplicationService> {
    if (!TaskController.taskService) {
      TaskController.taskService = await TaskApplicationService.createInstance();
    }
    return TaskController.taskService;
  }

  /**
   * 获取任务统计
   */
  static async getTaskStats(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;
      const taskService = await TaskController.getTaskService();

      const stats = await taskService.getTaskStats(accountUuid);

      res.json({
        success: true,
        data: { stats },
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
  static async getTaskTimeline(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;
      const { timezone = 'Asia/Shanghai' } = req.query;

      const tasks = await TaskController.taskService.getThisWeekTasks(
        accountUuid,
        timezone as string,
      );

      res.json({
        success: true,
        data: { timeline: tasks },
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
  static async searchTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;
      const { q: query } = req.query;

      // 验证搜索关键词是必填的
      if (!query || (typeof query === 'string' && query.trim().length === 0)) {
        return res.status(500).json({
          success: false,
          error: '搜索关键词不能为空',
        });
      }

      const tasks = await TaskController.taskService.searchTasks(accountUuid, query as string);

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
  static async getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;
      const { timezone = 'Asia/Shanghai' } = req.query;

      const tasks = await TaskController.taskService.getTodayTasks(accountUuid, timezone as string);

      res.json({
        success: true,
        data: { tasks },
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
  static async getOverdueTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;

      const tasks = await TaskController.taskService.getOverdueTasks(accountUuid);

      res.json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取过期任务失败',
      });
    }
  }
}
