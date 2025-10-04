import type { Response } from 'express';
import type { TaskContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';
import { TaskTemplateApplicationService } from '../../../application/services/TaskTemplateApplicationService';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTemplateController');

/**
 * TaskTemplate 统一控制器
 *
 * 职责：
 * 1. 管理 TaskTemplate 聚合根的所有 HTTP 接口
 * 2. 通过聚合根控制所有 TaskInstance 子实体操作
 * 3. 使用统一的响应格式
 *
 * 整合说明：
 * - 合并了 TaskController 的基础CRUD
 * - 合并了 TaskAggregateController 的聚合根控制逻辑
 * - 合并了 TaskInstanceController 的实例管理（通过聚合根）
 * - 所有子实体操作都通过 TaskTemplate 聚合根控制（DDD原则）
 */
export class TaskTemplateController {
  private static taskTemplateService: TaskTemplateApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（使用依赖注入）
   */
  private static async initializeService(): Promise<void> {
    if (!this.taskTemplateService) {
      this.taskTemplateService = await TaskTemplateApplicationService.getInstance();
    }
  }

  // ===== TaskTemplate 聚合根管理 =====

  /**
   * 创建任务模板
   * POST /api/v1/tasks/templates
   */
  static async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const request: TaskContracts.CreateTaskTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.createTemplate(
        accountUuid,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template created successfully',
      );
    } catch (error) {
      logger.error('Failed to create task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to create task template',
      });
    }
  }

  /**
   * 获取任务模板列表
   * GET /api/v1/tasks/templates
   */
  static async getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { limit, offset, sortBy, sortOrder } = req.query;
      const accountUuid = req.accountUuid!;

      const templates = await TaskTemplateController.taskTemplateService!.getTemplates(
        accountUuid,
        {
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
          sortBy: sortBy as 'createdAt' | 'updatedAt' | 'title' | undefined,
          sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        },
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        templates,
        'Task templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task templates', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve task templates',
      });
    }
  }

  /**
   * 获取任务模板详情
   * GET /api/v1/tasks/templates/:templateId
   */
  static async getTemplateById(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.getTemplateById(
        accountUuid,
        templateId,
      );

      if (!template) {
        return logger.warn('Task template not found');
        TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Task template not found',
        });
      }

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve task template',
      });
    }
  }

  /**
   * 更新任务模板
   * PUT /api/v1/tasks/templates/:templateId
   */
  static async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const request: TaskContracts.UpdateTaskTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.updateTemplate(
        accountUuid,
        templateId,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template updated successfully',
      );
    } catch (error) {
      logger.error('Failed to update task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to update task template',
      });
    }
  }

  /**
   * 删除任务模板
   * DELETE /api/v1/tasks/templates/:templateId
   */
  static async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateService!.deleteTemplate(accountUuid, templateId);

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Task template deleted successfully',
      );
    } catch (error) {
      logger.error('Failed to delete task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to delete task template',
      });
    }
  }

  // ===== TaskTemplate 状态管理 =====

  /**
   * 激活任务模板
   * POST /api/v1/tasks/templates/:templateId/activate
   */
  static async activateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.activateTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template activated successfully',
      );
    } catch (error) {
      logger.error('Failed to activate task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to activate task template',
      });
    }
  }

  /**
   * 暂停任务模板
   * POST /api/v1/tasks/templates/:templateId/pause
   */
  static async pauseTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.pauseTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template paused successfully',
      );
    } catch (error) {
      logger.error('Failed to pause task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to pause task template',
      });
    }
  }

  /**
   * 归档任务模板
   * POST /api/v1/tasks/templates/:templateId/archive
   */
  static async archiveTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const template = await TaskTemplateController.taskTemplateService!.archiveTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template archived successfully',
      );
    } catch (error) {
      logger.error('Failed to archive task template', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to archive task template',
      });
    }
  }

  // ===== TaskInstance 管理（通过聚合根）=====

  /**
   * 创建任务实例（通过聚合根）
   * POST /api/v1/tasks/instances
   */
  static async createInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const request: TaskContracts.CreateTaskInstanceRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.createInstance(
        accountUuid,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance created successfully',
      );
    } catch (error) {
      logger.error('Failed to create task instance', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to create task instance',
      });
    }
  }

  /**
   * 获取任务实例列表
   * GET /api/v1/tasks/instances
   */
  static async getInstances(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const queryParams = req.query as TaskContracts.TaskQueryParamsDTO;
      const accountUuid = req.accountUuid!;

      const instances = await TaskTemplateController.taskTemplateService!.getInstances(
        accountUuid,
        queryParams,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instances,
        'Task instances retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task instances', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve task instances',
      });
    }
  }

  /**
   * 获取任务实例详情
   * GET /api/v1/tasks/instances/:instanceId
   */
  static async getInstanceById(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.getInstanceById(
        accountUuid,
        instanceId,
      );

      if (!instance) {
        return logger.warn('Task instance not found');
        TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Task instance not found',
        });
      }

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task instance', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve task instance',
      });
    }
  }

  /**
   * 更新任务实例（通过聚合根）
   * PUT /api/v1/tasks/instances/:instanceId
   */
  static async updateInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const request: TaskContracts.UpdateTaskInstanceRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.updateInstance(
        accountUuid,
        instanceId,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task instance updated successfully',
      );
    } catch (error) {
      logger.error('Failed to update task instance', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to update task instance',
      });
    }
  }

  /**
   * 删除任务实例（通过聚合根）
   * DELETE /api/v1/tasks/instances/:instanceId
   */
  static async deleteInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateService!.deleteInstance(accountUuid, instanceId);

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Task instance deleted successfully',
      );
    } catch (error) {
      logger.error('Failed to delete task instance', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to delete task instance',
      });
    }
  }

  // ===== TaskInstance 状态管理 =====

  /**
   * 完成任务
   * POST /api/v1/tasks/instances/:instanceId/complete
   */
  static async completeTask(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const request: TaskContracts.CompleteTaskRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.completeTask(
        accountUuid,
        instanceId,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task completed successfully',
      );
    } catch (error) {
      logger.error('Failed to complete task', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to complete task',
      });
    }
  }

  /**
   * 撤销完成任务
   * POST /api/v1/tasks/instances/:instanceId/undo-complete
   */
  static async undoCompleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.undoCompleteTask(
        accountUuid,
        instanceId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task completion undone successfully',
      );
    } catch (error) {
      logger.error('Failed to undo task completion', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to undo task completion',
      });
    }
  }

  /**
   * 开始任务
   * POST /api/v1/tasks/instances/:instanceId/start
   */
  static async startTask(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.startTask(
        accountUuid,
        instanceId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task started successfully',
      );
    } catch (error) {
      logger.error('Failed to start task', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to start task',
      });
    }
  }

  /**
   * 取消任务
   * POST /api/v1/tasks/instances/:instanceId/cancel
   */
  static async cancelTask(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.cancelTask(
        accountUuid,
        instanceId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task cancelled successfully',
      );
    } catch (error) {
      logger.error('Failed to cancel task', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to cancel task',
      });
    }
  }

  /**
   * 重新调度任务
   * POST /api/v1/tasks/instances/:instanceId/reschedule
   */
  static async rescheduleTask(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId } = req.params;
      const request: TaskContracts.RescheduleTaskRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateService!.rescheduleTask(
        accountUuid,
        instanceId,
        request,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instance,
        'Task rescheduled successfully',
      );
    } catch (error) {
      logger.error('Failed to reschedule task', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to reschedule task',
      });
    }
  }

  // ===== 提醒管理 =====

  /**
   * 触发提醒
   * POST /api/v1/tasks/instances/:instanceId/reminders/:reminderId/trigger
   */
  static async triggerReminder(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId, reminderId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateService!.triggerReminder(
        accountUuid,
        instanceId,
        reminderId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder triggered successfully',
      );
    } catch (error) {
      logger.error('Failed to trigger reminder', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to trigger reminder',
      });
    }
  }

  /**
   * 延后提醒
   * POST /api/v1/tasks/instances/:instanceId/reminders/:reminderId/snooze
   */
  static async snoozeReminder(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId, reminderId } = req.params;
      const { snoozeUntil, reason } = req.body;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateService!.snoozeReminder(
        accountUuid,
        instanceId,
        reminderId,
        new Date(snoozeUntil),
        reason,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder snoozed successfully',
      );
    } catch (error) {
      logger.error('Failed to snooze reminder', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to snooze reminder',
      });
    }
  }

  /**
   * 忽略提醒
   * POST /api/v1/tasks/instances/:instanceId/reminders/:reminderId/dismiss
   */
  static async dismissReminder(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { instanceId, reminderId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateService!.dismissReminder(
        accountUuid,
        instanceId,
        reminderId,
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Reminder dismissed successfully',
      );
    } catch (error) {
      logger.error('Failed to dismiss reminder', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to dismiss reminder',
      });
    }
  }

  // ===== 统计和查询 =====

  /**
   * 获取任务统计
   * GET /api/v1/tasks/stats
   */
  static async getTaskStats(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const accountUuid = req.accountUuid!;

      const stats = await TaskTemplateController.taskTemplateService!.getTaskStats(accountUuid);

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        stats,
        'Task stats retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task stats', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve task stats',
      });
    }
  }

  /**
   * 搜索任务
   * GET /api/v1/tasks/search
   */
  static async searchTasks(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const queryParams = req.query as TaskContracts.TaskQueryParamsDTO;
      const accountUuid = req.accountUuid!;

      const tasks = await TaskTemplateController.taskTemplateService!.searchTasks(
        accountUuid,
        queryParams,
      );

      TaskTemplateController.responseBuilder.sendSuccess(res, tasks, 'Tasks searched successfully');
    } catch (error) {
      logger.error('Failed to search tasks', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to search tasks',
      });
    }
  }

  /**
   * 获取即将到来的任务
   * GET /api/v1/tasks/upcoming
   */
  static async getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { limit, offset } = req.query;
      const accountUuid = req.accountUuid!;

      const tasks = await TaskTemplateController.taskTemplateService!.getUpcomingTasks(
        accountUuid,
        {
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
        },
      );

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Upcoming tasks retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve upcoming tasks', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve upcoming tasks',
      });
    }
  }

  /**
   * 获取过期任务
   * GET /api/v1/tasks/overdue
   */
  static async getOverdueTasks(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { limit, offset } = req.query;
      const accountUuid = req.accountUuid!;

      const tasks = await TaskTemplateController.taskTemplateService!.getOverdueTasks(accountUuid, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Overdue tasks retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve overdue tasks', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve overdue tasks',
      });
    }
  }

  /**
   * 获取今日任务
   * GET /api/v1/tasks/today
   */
  static async getTodayTasks(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { limit, offset } = req.query;
      const accountUuid = req.accountUuid!;

      const tasks = await TaskTemplateController.taskTemplateService!.getTodayTasks(accountUuid, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      TaskTemplateController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Today tasks retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve today tasks', error);
      TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve today tasks',
      });
    }
  }
}
