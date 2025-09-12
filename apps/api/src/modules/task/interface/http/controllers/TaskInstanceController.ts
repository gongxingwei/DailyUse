/**
 * Task Instance Controller
 * 任务实例控制器
 */

import type { Request, Response } from 'express';
import { TaskInstanceApplicationService } from '../../../application/services/TaskInstanceApplicationService';
import { PrismaClient } from '@prisma/client';
import type { TaskContracts } from '@dailyuse/contracts';

type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;

const prisma = new PrismaClient();

export class TaskInstanceController {
  private static taskService = new TaskInstanceApplicationService(prisma);

  /**
   * 创建任务实例
   */
  static async createInstance(req: Request, res: Response) {
    try {
      const request: CreateTaskInstanceRequest = req.body;
      const { accountUuid } = req.params;
      const instanceUuid = await TaskInstanceController.taskService.create(accountUuid, request);

      res.status(201).json({
        success: true,
        data: { uuid: instanceUuid },
        message: '任务实例创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建任务实例失败',
      });
    }
  }

  /**
   * 获取任务实例列表
   */
  static async getInstances(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { limit, offset, sortBy, sortOrder } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as
          | 'createdAt'
          | 'updatedAt'
          | 'scheduledDate'
          | 'importance'
          | 'urgency'
          | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const instances = await TaskInstanceController.taskService.getAllByAccount(
        accountUuid,
        options,
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务实例列表失败',
      });
    }
  }

  /**
   * 根据ID获取任务实例
   */
  static async getInstanceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await TaskInstanceController.taskService.getById(id);

      if (!instance) {
        return res.status(404).json({
          success: false,
          error: '任务实例不存在',
        });
      }

      res.json({
        success: true,
        data: instance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务实例失败',
      });
    }
  }

  /**
   * 更新任务实例
   */
  static async updateInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: UpdateTaskInstanceRequest = req.body;
      await TaskInstanceController.taskService.update(id, request);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务实例更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新任务实例失败',
      });
    }
  }

  /**
   * 删除任务实例
   */
  static async deleteInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TaskInstanceController.taskService.delete(id);

      res.json({
        success: true,
        message: '任务实例删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除任务实例失败',
      });
    }
  }

  /**
   * 开始任务
   */
  static async startTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TaskInstanceController.taskService.start(id);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务已开始',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '开始任务失败',
      });
    }
  }

  /**
   * 完成任务
   */
  static async completeTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      await TaskInstanceController.taskService.complete(id, notes);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务已完成',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '完成任务失败',
      });
    }
  }

  /**
   * 取消任务
   */
  static async cancelTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await TaskInstanceController.taskService.cancel(id, reason);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务已取消',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '取消任务失败',
      });
    }
  }

  /**
   * 重新安排任务
   */
  static async rescheduleTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newScheduledDate, reason } = req.body;
      await TaskInstanceController.taskService.reschedule(id, newScheduledDate, reason);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务重新安排成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '重新安排任务失败',
      });
    }
  }

  /**
   * 更新任务进度
   */
  static async updateProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { progressPercentage } = req.body;
      await TaskInstanceController.taskService.updateProgress(id, progressPercentage);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务进度更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新任务进度失败',
      });
    }
  }

  /**
   * 获取今天的任务
   */
  static async getTodayTasks(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { limit, offset } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const instances = await TaskInstanceController.taskService.getToday(accountUuid, options);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取今日任务失败',
      });
    }
  }

  /**
   * 获取过期任务
   */
  static async getOverdueTasks(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { limit, offset } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const instances = await TaskInstanceController.taskService.getOverdue(accountUuid, options);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取过期任务失败',
      });
    }
  }

  /**
   * 按状态获取任务
   */
  static async getTasksByStatus(req: Request, res: Response) {
    try {
      const { accountUuid, status } = req.params;
      const { limit, offset } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const instances = await TaskInstanceController.taskService.getByStatus(
        accountUuid,
        status as 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
        options,
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务列表失败',
      });
    }
  }

  /**
   * 获取任务统计
   */
  static async getTaskStats(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const stats = await TaskInstanceController.taskService.getCountByStatus(accountUuid);

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
   * 批量更新任务状态
   */
  static async batchUpdateStatus(req: Request, res: Response) {
    try {
      const { uuids, status } = req.body;
      await TaskInstanceController.taskService.batchUpdateStatus(uuids, status);

      res.json({
        success: true,
        message: '批量更新任务状态成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量更新任务状态失败',
      });
    }
  }

  /**
   * 撤销完成任务
   */
  static async undoComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TaskInstanceController.taskService.undoComplete(id);

      // 获取更新后的实例
      const instance = await TaskInstanceController.taskService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '任务完成状态已撤销',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '撤销任务完成状态失败',
      });
    }
  }

  /**
   * 触发提醒
   */
  static async triggerReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      // TODO: 实现提醒触发逻辑

      res.json({
        success: true,
        message: '提醒已触发',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '触发提醒失败',
      });
    }
  }

  /**
   * 延后提醒
   */
  static async snoozeReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      const { snoozeMinutes } = req.body;
      // TODO: 实现提醒延后逻辑

      res.json({
        success: true,
        message: `提醒已延后 ${snoozeMinutes} 分钟`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '延后提醒失败',
      });
    }
  }

  /**
   * 忽略提醒
   */
  static async dismissReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      // TODO: 实现提醒忽略逻辑

      res.json({
        success: true,
        message: '提醒已忽略',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '忽略提醒失败',
      });
    }
  }

  /**
   * 批量删除任务
   */
  static async batchDelete(req: Request, res: Response) {
    try {
      const { uuids } = req.body;
      await TaskInstanceController.taskService.batchDelete(uuids);

      res.json({
        success: true,
        message: '批量删除任务成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量删除任务失败',
      });
    }
  }
}
