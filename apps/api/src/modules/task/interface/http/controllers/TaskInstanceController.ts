import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import type { TaskContracts } from '@dailyuse/contracts';

type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;
type CompleteTaskRequest = TaskContracts.CompleteTaskRequest;
type RescheduleTaskRequest = TaskContracts.RescheduleTaskRequest;

export class TaskInstanceController {
  private static taskService = new TaskApplicationService();

  /**
   * 创建任务实例
   */
  static async createInstance(req: Request, res: Response) {
    try {
      const request: CreateTaskInstanceRequest = req.body;
      const instance = await TaskInstanceController.taskService.createInstance(request);

      res.status(201).json({
        success: true,
        data: instance,
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
      const queryParams = req.query;
      const instances = await TaskInstanceController.taskService.getInstances(queryParams);

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
      const instance = await TaskInstanceController.taskService.getInstanceById(id);

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
      const instance = await TaskInstanceController.taskService.updateInstance(id, request);

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
      await TaskInstanceController.taskService.deleteInstance(id);

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
   * 完成任务
   */
  static async completeTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: CompleteTaskRequest = req.body;
      const instance = await TaskInstanceController.taskService.completeTask(id, request);

      res.json({
        success: true,
        data: instance,
        message: '任务完成成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '完成任务失败',
      });
    }
  }

  /**
   * 撤销完成任务
   */
  static async undoComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { accountUuid } = req.body;
      const instance = await TaskInstanceController.taskService.undoCompleteTask(id, accountUuid);

      res.json({
        success: true,
        data: instance,
        message: '任务完成已撤销',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '撤销任务完成失败',
      });
    }
  }

  /**
   * 重新调度任务
   */
  static async rescheduleTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: RescheduleTaskRequest = req.body;
      const instance = await TaskInstanceController.taskService.rescheduleTask(id, request);

      res.json({
        success: true,
        data: instance,
        message: '任务重新调度成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '重新调度任务失败',
      });
    }
  }

  /**
   * 取消任务
   */
  static async cancelTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await TaskInstanceController.taskService.cancelTask(id);

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
   * 触发提醒
   */
  static async triggerReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      await TaskInstanceController.taskService.triggerReminder(id, alertId);

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
   * 稍后提醒
   */
  static async snoozeReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      const { snoozeUntil, reason } = req.body;
      await TaskInstanceController.taskService.snoozeReminder(
        id,
        alertId,
        new Date(snoozeUntil),
        reason,
      );

      res.json({
        success: true,
        message: '提醒已延迟',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '延迟提醒失败',
      });
    }
  }

  /**
   * 忽略提醒
   */
  static async dismissReminder(req: Request, res: Response) {
    try {
      const { id, alertId } = req.params;
      await TaskInstanceController.taskService.dismissReminder(id, alertId);

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
}
