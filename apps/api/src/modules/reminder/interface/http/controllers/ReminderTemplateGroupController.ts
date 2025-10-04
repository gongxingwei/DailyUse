import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ReminderTemplateGroupApplicationService } from '../../../application/services/ReminderTemplateGroupApplicationService';
import type { ReminderContracts } from '@dailyuse/contracts';
import {
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('ReminderTemplateGroupController');

/**
 * ReminderTemplateGroupController - 提醒模板分组控制器
 * 专门处理 ReminderTemplateGroup 聚合根的HTTP请求
 * 使用正确的DDD架构：应用服务协调领域逻辑
 * 遵循统一的API响应格式和错误处理模式
 */
export class ReminderTemplateGroupController {
  private static applicationService = new ReminderTemplateGroupApplicationService();
  private static responseBuilder = createResponseBuilder();

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
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

  /**
   * 发送成功响应
   */
  private static sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    statusCode = 200,
  ): Response {
    const response: SuccessResponse<T> = {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 发送错误响应
   */
  private static sendError(
    res: Response,
    code: ResponseCode,
    message: string,
    error?: any,
  ): Response {
    const httpStatus = getHttpStatusCode(code);
    const response: ErrorResponse = {
      code,
      success: false,
      message,
      timestamp: Date.now(),
    };

    // 记录错误日志
    if (error) {
      logger.error(message, error);
    } else {
      logger.warn(message);
    }

    return res.status(httpStatus).json(response);
  }

  /**
   * 创建提醒模板分组
   * POST /reminders/groups
   */
  static async createTemplateGroup(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateGroupController.extractAccountUuid(req);
      const request: ReminderContracts.CreateReminderTemplateGroupRequest = req.body;

      logger.info('Creating reminder template group', {
        accountUuid,
        groupName: request.name,
        uuid: request.uuid,
      });

      const group =
        await ReminderTemplateGroupController.applicationService.createReminderTemplateGroup(
          accountUuid,
          request,
        );

      logger.info('Reminder template group created successfully', {
        groupUuid: group.uuid,
        accountUuid,
      });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        group,
        'Reminder template group created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          return ReminderTemplateGroupController.sendError(
            res,
            ResponseCode.VALIDATION_ERROR,
            error.message,
            error,
          );
        }
        if (error.message.includes('Authentication')) {
          return ReminderTemplateGroupController.sendError(
            res,
            ResponseCode.UNAUTHORIZED,
            error.message,
            error,
          );
        }
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          return ReminderTemplateGroupController.sendError(
            res,
            ResponseCode.CONFLICT,
            error.message,
            error,
          );
        }
      }

      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to create reminder template group',
        error,
      );
    }
  }

  /**
   * 获取账户的所有提醒模板分组
   * GET /reminders/groups
   */
  static async getTemplateGroups(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateGroupController.extractAccountUuid(req);

      logger.debug('Fetching reminder template groups', { accountUuid });

      const groups =
        await ReminderTemplateGroupController.applicationService.getReminderTemplateGroups(
          accountUuid,
        );

      const listResponse = {
        data: {
          groups: groups,
          total: groups.length,
          page: 1,
          limit: groups.length,
          hasMore: false,
        },
      };

      logger.info('Reminder template groups retrieved successfully', {
        accountUuid,
        total: groups.length,
      });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        listResponse,
        'Reminder template groups retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return ReminderTemplateGroupController.sendError(
          res,
          ResponseCode.UNAUTHORIZED,
          error.message,
          error,
        );
      }

      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to retrieve reminder template groups',
        error,
      );
    }
  }

  /**
   * 获取特定分组
   * GET /reminders/groups/:groupUuid
   */
  static async getTemplateGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { groupUuid } = req.params;

      logger.debug('Fetching reminder template group', { groupUuid });

      const group =
        await ReminderTemplateGroupController.applicationService.getReminderTemplateGroupById(
          groupUuid,
        );

      if (!group) {
        return ReminderTemplateGroupController.sendError(
          res,
          ResponseCode.NOT_FOUND,
          `Reminder template group not found: ${groupUuid}`,
        );
      }

      logger.info('Reminder template group retrieved successfully', { groupUuid });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        group,
        'Reminder template group retrieved successfully',
      );
    } catch (error) {
      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to retrieve reminder template group',
        error,
      );
    }
  }

  /**
   * 更新提醒模板分组
   * PUT /reminders/groups/:groupUuid
   */
  static async updateTemplateGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { groupUuid } = req.params;
      const request: ReminderContracts.UpdateReminderTemplateGroupRequest = req.body;

      logger.info('Updating reminder template group', {
        groupUuid,
        updateFields: Object.keys(request),
      });

      const group =
        await ReminderTemplateGroupController.applicationService.updateReminderTemplateGroupWithValidation(
          groupUuid,
          request,
        );

      logger.info('Reminder template group updated successfully', { groupUuid });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        group,
        'Reminder template group updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('不存在')) {
          return ReminderTemplateGroupController.sendError(
            res,
            ResponseCode.NOT_FOUND,
            error.message,
            error,
          );
        }
        if (error.message.includes('Invalid') || error.message.includes('验证')) {
          return ReminderTemplateGroupController.sendError(
            res,
            ResponseCode.VALIDATION_ERROR,
            error.message,
            error,
          );
        }
      }

      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to update reminder template group',
        error,
      );
    }
  }

  /**
   * 删除提醒模板分组
   * DELETE /reminders/groups/:groupUuid
   */
  static async deleteTemplateGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { groupUuid } = req.params;

      logger.info('Deleting reminder template group', { groupUuid });

      await ReminderTemplateGroupController.applicationService.deleteReminderTemplateGroupWithCleanup(
        groupUuid,
      );

      logger.info('Reminder template group deleted successfully', { groupUuid });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        { deleted: true, groupUuid },
        'Reminder template group deleted successfully',
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('不存在'))
      ) {
        return ReminderTemplateGroupController.sendError(
          res,
          ResponseCode.NOT_FOUND,
          error.message,
          error,
        );
      }

      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to delete reminder template group',
        error,
      );
    }
  }

  /**
   * 切换分组启用状态
   * PATCH /reminders/groups/:groupUuid/toggle
   */
  static async toggleTemplateGroupEnabled(req: Request, res: Response): Promise<Response> {
    try {
      const { groupUuid } = req.params;
      const { enabled } = req.body;

      logger.info('Toggling reminder template group enabled status', { groupUuid, enabled });

      await ReminderTemplateGroupController.applicationService.toggleReminderTemplateGroupEnabled(
        groupUuid,
        enabled,
      );

      logger.info('Reminder template group status toggled successfully', { groupUuid, enabled });

      return ReminderTemplateGroupController.sendSuccess(
        res,
        { groupUuid, enabled },
        enabled ? 'Group enabled successfully' : 'Group disabled successfully',
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('不存在'))
      ) {
        return ReminderTemplateGroupController.sendError(
          res,
          ResponseCode.NOT_FOUND,
          error.message,
          error,
        );
      }

      return ReminderTemplateGroupController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to toggle group status',
        error,
      );
    }
  }
}
