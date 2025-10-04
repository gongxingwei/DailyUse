import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ScheduleContracts } from '@dailyuse/contracts';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';
import { PrismaClient } from '@prisma/client';

// 创建 logger 实例
const logger = createLogger('ScheduleController');

/**
 * Schedule Controller
 * 调度模块控制器 - 处理 HTTP 请求和响应
 */
export class ScheduleController {
  private prisma = new PrismaClient();
  private static responseBuilder = createResponseBuilder();

  private get scheduleService() {
    return ScheduleContainer.getInstance(this.prisma).scheduleApplicationService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private getAccountUuid(req: Request): string {
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

  // ==================== Schedule Management ====================

  /**
   * 获取所有计划任务
   */
  async getAllSchedules(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.getAccountUuid(req);
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
        schedules: result.tasks,
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        hasMore: result.pagination.hasMore,
      };

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        responseData,
        'Schedule tasks retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving schedule tasks');
        return ScheduleController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve schedule tasks', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule tasks',
      });
    }
  }

  /**
   * 获取单个计划任务
   */
  async getScheduleById(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.debug('Fetching schedule task by ID', { uuid, accountUuid });

      const schedule = await this.scheduleService.getScheduleTask(accountUuid, uuid);

      if (!schedule) {
        logger.warn('Schedule task not found', { uuid, accountUuid });
        return ScheduleController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      logger.info('Schedule task retrieved successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Schedule task retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving schedule task');
        return ScheduleController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule task',
      });
    }
  }

  /**
   * 创建计划任务
   */
  async createSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const scheduleData: ScheduleContracts.CreateScheduleTaskRequestDto = req.body;

      logger.info('Creating schedule task', { accountUuid, taskName: scheduleData.name });

      const newSchedule = await this.scheduleService.createScheduleTask(accountUuid, scheduleData);

      logger.info('Schedule task created successfully', {
        taskUuid: newSchedule.uuid,
        accountUuid,
      });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule: newSchedule },
        'Schedule task created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Scheduled time cannot be in the past')) {
          logger.error('Validation error creating schedule task');
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating schedule task');
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to create schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create schedule task',
      });
    }
  }

  /**
   * 更新计划任务
   */
  async updateSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const updateData: ScheduleContracts.UpdateScheduleTaskRequestDto = req.body;

      logger.info('Updating schedule task', { uuid, accountUuid });

      const updatedSchedule = await this.scheduleService.updateScheduleTask(
        accountUuid,
        uuid,
        updateData,
      );

      logger.info('Schedule task updated successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule: updatedSchedule },
        'Schedule task updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found for update', { uuid: req.params.uuid });
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error updating schedule task');
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to update schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to update schedule task',
      });
    }
  }

  /**
   * 删除计划任务
   */
  async deleteSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.info('Deleting schedule task', { uuid, accountUuid });

      await this.scheduleService.deleteScheduleTask(accountUuid, uuid);

      logger.info('Schedule task deleted successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found for deletion', { uuid: req.params.uuid });
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting schedule task');
          return ScheduleController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Failed to delete schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to delete schedule task',
      });
    }
  }

  // ==================== Schedule Operations ====================

  /**
   * 执行计划任务
   */
  async executeSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const { force } = req.body;

      logger.info('Executing schedule task', { uuid, accountUuid, force });

      const result = await this.scheduleService.executeScheduleTask(accountUuid, uuid, force);

      logger.info('Schedule task executed successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { executionResult: result },
        'Schedule task executed successfully',
      );
    } catch (error) {
      logger.error('Failed to execute schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to execute schedule task',
      });
    }
  }

  /**
   * 启用计划任务
   */
  async enableSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.info('Enabling schedule task', { uuid, accountUuid });

      const schedule = await this.scheduleService.enableScheduleTask(accountUuid, uuid);

      logger.info('Schedule task enabled successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Schedule task enabled successfully',
      );
    } catch (error) {
      logger.error('Failed to enable schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to enable schedule task',
      });
    }
  }

  /**
   * 禁用计划任务
   */
  async disableSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.info('Disabling schedule task', { uuid, accountUuid });

      const schedule = await this.scheduleService.disableScheduleTask(accountUuid, uuid);

      logger.info('Schedule task disabled successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Schedule task disabled successfully',
      );
    } catch (error) {
      logger.error('Failed to disable schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to disable schedule task',
      });
    }
  }

  /**
   * 暂停计划任务
   */
  async pauseSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.info('Pausing schedule task', { uuid, accountUuid });

      const schedule = await this.scheduleService.pauseScheduleTask(accountUuid, uuid);

      logger.info('Schedule task paused successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Schedule task paused successfully',
      );
    } catch (error) {
      logger.error('Failed to pause schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to pause schedule task',
      });
    }
  }

  /**
   * 恢复计划任务
   */
  async resumeSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      logger.info('Resuming schedule task', { uuid, accountUuid });

      const schedule = await this.scheduleService.resumeScheduleTask(accountUuid, uuid);

      logger.info('Schedule task resumed successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Schedule task resumed successfully',
      );
    } catch (error) {
      logger.error('Failed to resume schedule task', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to resume schedule task',
      });
    }
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const { snoozeMinutes, reason }: ScheduleContracts.SnoozeReminderRequestDto = req.body;

      logger.info('Snoozing reminder', { uuid, accountUuid, snoozeMinutes });

      const schedule = await this.scheduleService.snoozeReminder(accountUuid, {
        taskUuid: uuid,
        snoozeMinutes,
        reason,
      });

      logger.info('Reminder snoozed successfully', { uuid, accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Reminder snoozed successfully',
      );
    } catch (error) {
      logger.error('Failed to snooze reminder', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to snooze reminder',
      });
    }
  }

  // ==================== Additional Features ====================

  /**
   * 获取即将到来的任务
   */
  async getUpcomingSchedules(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.getAccountUuid(req);
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

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        result,
        'Upcoming tasks retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve upcoming tasks', error);
      return ScheduleController.responseBuilder.sendError(res, {
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
      const accountUuid = this.getAccountUuid(req);
      const reminderData: ScheduleContracts.QuickReminderRequestDto = req.body;

      logger.info('Creating quick reminder', { accountUuid, title: reminderData.title });

      const schedule = await this.scheduleService.createQuickReminder(accountUuid, reminderData);

      logger.info('Quick reminder created successfully', {
        taskUuid: schedule.uuid,
        accountUuid,
      });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { schedule },
        'Quick reminder created successfully',
        201,
      );
    } catch (error) {
      logger.error('Failed to create quick reminder', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create quick reminder',
      });
    }
  }

  /**
   * 批量操作计划任务
   */
  async batchOperateSchedules(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.getAccountUuid(req);
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

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        result,
        'Batch operation completed successfully',
      );
    } catch (error) {
      logger.error('Failed to perform batch operation', error);
      return ScheduleController.responseBuilder.sendError(res, {
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
      return ScheduleController.responseBuilder.sendSuccess(
        res,
        { history: [], total: 0 },
        'Execution history retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve execution history', error);
      return ScheduleController.responseBuilder.sendError(res, {
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
      const accountUuid = this.getAccountUuid(req);

      logger.debug('Fetching schedule statistics', { accountUuid });

      const container = ScheduleContainer.getInstance(this.prisma);
      const repository = container.scheduleRepository;
      const stats = await repository.getStatistics(accountUuid);

      logger.info('Schedule statistics retrieved successfully', { accountUuid });

      return ScheduleController.responseBuilder.sendSuccess(
        res,
        stats,
        'Schedule statistics retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve schedule statistics', error);
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve schedule statistics',
      });
    }
  }
}
