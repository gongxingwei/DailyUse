import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ScheduleContracts } from '@dailyuse/contracts';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { ScheduleContainer } from '../../../infrastructure/di/ScheduleContainer';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('ScheduleTaskController');

/**
 * ScheduleTask Controller
 * 调度任务聚合根控制器 - 处理调度任务相关的 HTTP 请求
 *
 * 职责:
 * - 处理 HTTP 请求和响应
 * - 身份验证和授权
 * - 输入验证和错误处理
 * - 调用 ApplicationService 完成业务逻辑
 */
export class ScheduleTaskController {
  private prisma = new PrismaClient();
  private static responseBuilder = createResponseBuilder();

  private get scheduleService() {
    return ScheduleContainer.getInstance(this.prisma).scheduleApplicationService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  // ==================== CRUD Operations ====================

  /**
   * 获取所有调度任务
   */
  async getAllScheduleTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { page = 1, limit = 50, status, taskType, enabled, tags } = req.query;

      logger.debug('Fetching schedule tasks list', { accountUuid, page, limit });

      // 构建查询参数
      const query: ScheduleContracts.IScheduleTaskQuery = {
        createdBy: accountUuid,
        pagination: {
          offset: (Number(page) - 1) * Number(limit),
          limit: Number(limit),
        },
        sorting: {
          field: 'scheduledTime',
          order: 'asc',
        },
      };

      // 添加过滤条件
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        query.status = statusArray.map((s) => s as ScheduleContracts.ScheduleStatus);
      }

      if (taskType) {
        const taskTypeArray = Array.isArray(taskType) ? taskType : [taskType];
        query.taskType = taskTypeArray.map((t) => t as ScheduleContracts.ScheduleTaskType);
      }

      if (enabled !== undefined) {
        query.enabled = enabled === 'true';
      }

      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        query.tags = tagsArray.map((tag) => tag as string);
      }

      const result = await this.scheduleService.getScheduleTasks(accountUuid, query);

      logger.info('Schedule tasks retrieved successfully', {
        accountUuid,
        total: result.total,
        page: Number(page),
      });

      const responseData = {
        tasks: result.tasks,
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        hasMore: result.pagination.hasMore,
      };

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        responseData,
        'Schedule tasks retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving schedule tasks');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve schedule tasks', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule tasks',
      });
    }
  }

  /**
   * 获取单个调度任务
   */
  async getScheduleTaskById(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.debug('Fetching schedule task by ID', { uuid, accountUuid });

      const task = await this.scheduleService.getScheduleTask(accountUuid, uuid);

      if (!task) {
        logger.warn('Schedule task not found', { uuid, accountUuid });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      logger.info('Schedule task retrieved successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Schedule task retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving schedule task');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule task',
      });
    }
  }

  /**
   * 创建调度任务
   */
  async createScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const taskData: ScheduleContracts.CreateScheduleTaskRequestDto = req.body;

      logger.info('Creating schedule task', { accountUuid, taskName: taskData.name });

      const newTask = await this.scheduleService.createScheduleTask(accountUuid, taskData);

      logger.info('Schedule task created successfully', {
        taskUuid: newTask.uuid,
        accountUuid,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task: newTask },
        'Schedule task created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Scheduled time cannot be in the past')) {
          logger.error('Validation error creating schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to create schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create schedule task',
      });
    }
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);
      const updateData: ScheduleContracts.UpdateScheduleTaskRequestDto = req.body;

      logger.info('Updating schedule task', { uuid, accountUuid });

      const updatedTask = await this.scheduleService.updateScheduleTask(
        accountUuid,
        uuid,
        updateData,
      );

      logger.info('Schedule task updated successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task: updatedTask },
        'Schedule task updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found for update', { uuid: req.params.uuid });
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error updating schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to update schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to update schedule task',
      });
    }
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.info('Deleting schedule task', { uuid, accountUuid });

      await this.scheduleService.deleteScheduleTask(accountUuid, uuid);

      logger.info('Schedule task deleted successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found for deletion', { uuid: req.params.uuid });
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to delete schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to delete schedule task',
      });
    }
  }

  // ==================== State Management ====================

  /**
   * 启用调度任务
   */
  async enableScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.info('Enabling schedule task', { uuid, accountUuid });

      const task = await this.scheduleService.enableScheduleTask(accountUuid, uuid);

      logger.info('Schedule task enabled successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Schedule task enabled successfully',
      );
    } catch (error) {
      logger.error('Failed to enable schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to enable schedule task',
      });
    }
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.info('Disabling schedule task', { uuid, accountUuid });

      const task = await this.scheduleService.disableScheduleTask(accountUuid, uuid);

      logger.info('Schedule task disabled successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Schedule task disabled successfully',
      );
    } catch (error) {
      logger.error('Failed to disable schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to disable schedule task',
      });
    }
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.info('Pausing schedule task', { uuid, accountUuid });

      const task = await this.scheduleService.pauseScheduleTask(accountUuid, uuid);

      logger.info('Schedule task paused successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Schedule task paused successfully',
      );
    } catch (error) {
      logger.error('Failed to pause schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to pause schedule task',
      });
    }
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);

      logger.info('Resuming schedule task', { uuid, accountUuid });

      const task = await this.scheduleService.resumeScheduleTask(accountUuid, uuid);

      logger.info('Schedule task resumed successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Schedule task resumed successfully',
      );
    } catch (error) {
      logger.error('Failed to resume schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to resume schedule task',
      });
    }
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);
      const { force } = req.body;

      logger.info('Executing schedule task', { uuid, accountUuid, force });

      const result = await this.scheduleService.executeScheduleTask(accountUuid, uuid, force);

      logger.info('Schedule task executed successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { executionResult: result },
        'Schedule task executed successfully',
      );
    } catch (error) {
      logger.error('Failed to execute schedule task', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to execute schedule task',
      });
    }
  }

  // ==================== Additional Features ====================

  /**
   * 延后提醒
   */
  async snoozeReminder(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.extractAccountUuid(req);
      const { snoozeMinutes, reason }: ScheduleContracts.SnoozeReminderRequestDto = req.body;

      logger.info('Snoozing reminder', { uuid, accountUuid, snoozeMinutes });

      const task = await this.scheduleService.snoozeReminder(accountUuid, {
        taskUuid: uuid,
        snoozeMinutes,
        reason,
      });

      logger.info('Reminder snoozed successfully', { uuid, accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Reminder snoozed successfully',
      );
    } catch (error) {
      logger.error('Failed to snooze reminder', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to snooze reminder',
      });
    }
  }

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { withinMinutes = 60, limit = 100 } = req.query;

      logger.debug('Fetching upcoming tasks', { accountUuid, withinMinutes, limit });

      const result = await this.scheduleService.getUpcomingTasks(
        accountUuid,
        Number(withinMinutes),
        Number(limit),
      );

      logger.info('Upcoming tasks retrieved successfully', {
        accountUuid,
        count: result.tasks.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        result,
        'Upcoming tasks retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve upcoming tasks', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve upcoming tasks',
      });
    }
  }

  /**
   * 快速创建提醒
   */
  async createQuickReminder(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const reminderData: ScheduleContracts.QuickReminderRequestDto = req.body;

      logger.info('Creating quick reminder', { accountUuid, title: reminderData.title });

      const task = await this.scheduleService.createQuickReminder(accountUuid, reminderData);

      logger.info('Quick reminder created successfully', {
        taskUuid: task.uuid,
        accountUuid,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { task },
        'Quick reminder created successfully',
        201,
      );
    } catch (error) {
      logger.error('Failed to create quick reminder', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create quick reminder',
      });
    }
  }

  /**
   * 批量操作调度任务
   */
  async batchOperateTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const batchRequest: ScheduleContracts.BatchScheduleTaskOperationRequestDto = req.body;

      logger.info('Batch operating schedule tasks', {
        accountUuid,
        operation: batchRequest.operation,
        taskCount: batchRequest.taskUuids.length,
      });

      const result = await this.scheduleService.batchOperateScheduleTasks(
        accountUuid,
        batchRequest,
      );

      logger.info('Batch operation completed', {
        accountUuid,
        successCount: result.summary.success,
        failureCount: result.summary.failed,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        result,
        'Batch operation completed successfully',
      );
    } catch (error) {
      logger.error('Failed to perform batch operation', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to perform batch operation',
      });
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(req: Request, res: Response): Promise<Response> {
    try {
      logger.debug('Fetching execution history (placeholder)');

      // TODO: 实现执行历史功能
      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        { history: [], total: 0 },
        'Execution history retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve execution history', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve execution history',
      });
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);

      logger.debug('Fetching schedule statistics', { accountUuid });

      const container = ScheduleContainer.getInstance(this.prisma);
      const repository = container.scheduleRepository;
      const stats = await repository.getStatistics(accountUuid);

      logger.info('Schedule statistics retrieved successfully', { accountUuid });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        stats,
        'Schedule statistics retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve schedule statistics', error);
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule statistics',
      });
    }
  }
}
