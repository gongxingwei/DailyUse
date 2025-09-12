import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import { PrismaClient } from '@prisma/client';
import {
  PrismaTaskTemplateRepository,
  PrismaTaskInstanceRepository,
  PrismaTaskMetaTemplateRepository,
  PrismaTaskStatsRepository,
} from '../../../infrastructure/repositories/prisma';
import type { TaskContracts } from '@dailyuse/contracts';

const prisma = new PrismaClient();

export class TaskController {
  private static taskService = new TaskApplicationService(
    new PrismaTaskTemplateRepository(prisma),
    new PrismaTaskInstanceRepository(prisma),
    new PrismaTaskMetaTemplateRepository(prisma),
    new PrismaTaskStatsRepository(prisma),
  );

  /**
   * 获取任务统计
   */
  static async getTaskStats(req: Request, res: Response) {
    try {
      const { accountUuid } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      const stats = await TaskController.taskService.getTaskStats(accountUuid as string);

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
      const { accountUuid, timezone = 'Asia/Shanghai' } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      const tasks = await TaskController.taskService.getThisWeekTasks(
        accountUuid as string,
        timezone as string,
      );

      res.json({
        success: true,
        data: tasks,
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
      const { accountUuid, q: query = '' } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      const tasks = await TaskController.taskService.searchTasks(
        accountUuid as string,
        query as string,
      );

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
      const { accountUuid, timezone = 'Asia/Shanghai' } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      const tasks = await TaskController.taskService.getTodayTasks(
        accountUuid as string,
        timezone as string,
      );

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
      const { accountUuid } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      const tasks = await TaskController.taskService.getOverdueTasks(accountUuid as string);

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
