import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ReminderApplicationService } from '../../../application/services/ReminderApplicationService';
// import { ScheduleContainer } from '../../../../schedule/infrastructure/di/ScheduleContainer'; // DISABLED: Schedule module needs refactoring
import { PrismaClient } from '@prisma/client';
import type { ReminderContracts } from '@dailyuse/contracts';
import {
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import cronstrue from 'cronstrue/i18n';

// 创建 logger 实例
const logger = createLogger('ReminderTemplateController');

/**
 * ReminderTemplateController - 提醒模板控制器
 * 专门处理 ReminderTemplate 聚合根的HTTP请求
 * 使用正确的DDD架构：应用服务协调领域服务
 * 遵循统一的API响应格式和错误处理模式
 */
export class ReminderTemplateController {
  private static applicationService: ReminderApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取 ReminderApplicationService 实例（单例模式）
   */
  private static async getApplicationService(): Promise<ReminderApplicationService> {
    if (!this.applicationService) {
      this.applicationService = await ReminderApplicationService.getInstance();
    }
    return this.applicationService!;
  }

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
   * 创建提醒模板聚合根
   * POST /reminders/templates
   *
   * ⚠️ 架构更改：不再自动生成实例
   * 调度由 Schedule 模块的 RecurringScheduleTask 自动处理
   */
  static async createTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const request: ReminderContracts.CreateReminderTemplateRequest = req.body;

      logger.info('Creating reminder template', {
        accountUuid,
        templateName: request.name,
        uuid: request.uuid,
      });

      const applicationService = await ReminderTemplateController.getApplicationService();
      const template = await applicationService.createTemplate(accountUuid, request);

      logger.info('Reminder template created successfully', {
        templateUuid: template.uuid,
        accountUuid,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template created successfully',
        201,
      );
    } catch (error: unknown) {
      // 区分不同类型的错误
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          logger.error(error.message, error);
          return ReminderTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.error(error.message, error);
          return ReminderTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          logger.error(error.message, error);
          return ReminderTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: error.message,
          });
        }
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to create reminder template',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create reminder template',
      });
    }
  }

  /**
   * 获取账户的所有提醒模板
   * GET /reminders/templates
   */
  static async getTemplatesByAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      logger.debug('Fetching reminder templates list', { accountUuid, page, limit });

      const applicationService = await ReminderTemplateController.getApplicationService();
      const result = await applicationService.getTemplates(accountUuid);

      const listResponse: ReminderContracts.ReminderTemplateListResponse = {
        reminders: result.templates,
        total: result.total,
        page,
        limit,
        hasMore: result.templates.length >= limit,
      };

      logger.info('Reminder templates retrieved successfully', {
        accountUuid,
        total: result.total,
        page,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        listResponse,
        'Reminder templates retrieved successfully',
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to retrieve reminder templates',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder templates',
      });
    }
  }

  /**
   * 获取单个提醒模板
   * GET /reminders/templates/:templateUuid
   */
  static async getTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;

      logger.debug('Fetching reminder template', { templateUuid });

      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const applicationService = await ReminderTemplateController.getApplicationService();
      const template = await applicationService.getTemplateById(accountUuid, templateUuid);

      if (!template) {
        logger.warn(`Reminder template not found: ${templateUuid}`);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: `Reminder template not found: ${templateUuid}`,
        });
      }

      logger.info('Reminder template retrieved successfully', { templateUuid });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template retrieved successfully',
      );
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error.message : 'Failed to retrieve reminder template',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder template',
      });
    }
  }

  /**
   * 更新提醒模板
   * PUT /reminders/templates/:templateUuid
   */
  static async updateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;
      const request: ReminderContracts.UpdateReminderTemplateRequest = req.body;

      logger.info('Updating reminder template', {
        templateUuid,
        updateFields: Object.keys(request),
      });

      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const applicationService = await ReminderTemplateController.getApplicationService();
      const template = await applicationService.updateTemplate(accountUuid, templateUuid, request);

      logger.info('Reminder template updated successfully', { templateUuid });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Reminder template updated successfully',
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('不存在')) {
          logger.error(error.message, error);
          return ReminderTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Invalid') || error.message.includes('验证')) {
          logger.error(error.message, error);
          return ReminderTemplateController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to update reminder template',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to update reminder template',
      });
    }
  }

  /**
   * 删除提醒模板
   * DELETE /reminders/templates/:templateUuid
   */
  static async deleteTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;

      logger.info('Deleting reminder template', { templateUuid });

      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const applicationService = await ReminderTemplateController.getApplicationService();
      await applicationService.deleteTemplate(accountUuid, templateUuid);

      logger.info('Reminder template deleted successfully', { templateUuid });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        { deleted: true, templateUuid },
        'Reminder template deleted successfully',
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('不存在'))
      ) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to delete reminder template',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to delete reminder template',
      });
    }
  }

  /**
   * 切换模板启用状态
   * PATCH /reminders/templates/:templateUuid/toggle
   */
  static async toggleTemplateEnabled(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;
      const { enabled } = req.body;
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);

      logger.info('Updating reminder template self-enabled status', { templateUuid, enabled });

      // 获取应用服务
      const applicationService = await ReminderTemplateController.getApplicationService();

      // 使用 updateTemplateSelfEnabled 方法更新模板自身的启用状态
      const updatedTemplate = await applicationService.updateTemplateSelfEnabled(
        accountUuid,
        templateUuid,
        enabled,
      );

      logger.info('Reminder template self-enabled status updated successfully', {
        templateUuid,
        enabled,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        updatedTemplate,
        enabled ? 'Template enabled successfully' : 'Template disabled successfully',
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('不存在'))
      ) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      logger.error('Failed to update reminder template self-enabled status', error);
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to update template status',
      });
    }
  }

  /**
   * 搜索提醒模板
   * GET /reminders/templates/search
   */
  static async searchTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const { q: searchTerm } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      if (!searchTerm || typeof searchTerm !== 'string') {
        logger.error('Search query parameter "q" is required and must be a string');
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Search query parameter "q" is required and must be a string',
        });
      }

      logger.debug('Searching reminder templates', { accountUuid, searchTerm, page, limit });

      // TODO: 实现 searchTemplates 方法
      // const applicationService = await ReminderTemplateController.getApplicationService();
      // const templates = await applicationService.searchTemplates(
      //   accountUuid,
      //   searchTerm,
      // );
      const templates: any[] = [];

      const searchResponse = {
        data: {
          reminders: templates,
          total: templates.length,
          page,
          limit,
          query: searchTerm,
          hasMore: templates.length >= limit,
        },
      };

      logger.info('Reminder templates search completed', {
        accountUuid,
        searchTerm,
        resultsCount: templates.length,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        searchResponse,
        'Reminder templates search completed successfully',
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to search reminder templates',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to search reminder templates',
      });
    }
  }

  /**
   * 获取模板统计信息
   * GET /reminders/templates/:templateUuid/stats
   */
  static async getTemplateStats(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;

      logger.debug('Fetching reminder template stats', { templateUuid });

      // TODO: 实现 getReminderTemplateStats 方法
      // const applicationService = await ReminderTemplateController.getApplicationService();
      // const stats = await applicationService.getReminderTemplateStats(templateUuid);
      const stats = { totalInstances: 0, activeInstances: 0 };

      logger.info('Reminder template stats retrieved successfully', { templateUuid });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        stats,
        'Reminder template stats retrieved successfully',
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('不存在'))
      ) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to retrieve template stats',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve template stats',
      });
    }
  }

  /**
   * 获取账户统计信息
   * GET /reminders/templates/account-stats
   */
  static async getAccountStats(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);

      logger.debug('Fetching account reminder stats', { accountUuid });

      // TODO: 实现 getAccountStats 方法
      // const applicationService = await ReminderTemplateController.getApplicationService();
      // const stats = await applicationService.getAccountStats(accountUuid);
      const stats = { totalTemplates: 0, activeTemplates: 0 };

      logger.info('Account reminder stats retrieved successfully', { accountUuid });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        stats,
        'Account reminder stats retrieved successfully',
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.error(error.message, error);
        return ReminderTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error(
        error instanceof Error ? error.message : 'Failed to retrieve account stats',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve account stats',
      });
    }
  }

  /**
   * 获取模板的调度状态
   * GET /reminders/templates/:templateUuid/schedule-status
   *
   * 返回关联的 RecurringScheduleTask 信息
   *
   * ⚠️ DISABLED: Schedule module needs complete refactoring
   */
  static async getScheduleStatus(req: Request, res: Response): Promise<Response> {
    return ReminderTemplateController.responseBuilder.sendError(res, {
      code: ResponseCode.SERVICE_UNAVAILABLE,
      message:
        'Schedule module is temporarily unavailable - needs refactoring for new cron-based schema',
    });
  }

  /**
   * 获取即将到来的提醒列表
   * GET /reminders/templates/upcoming
   *
   * ⚠️ 架构变更：不依赖 Schedule 模块
   * 直接在 Reminder 模块内部根据 timeConfig 计算下次触发时间
   */
  static async getUpcomingReminders(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const limit = parseInt(req.query.limit as string) || 10;
      const timeWindow = parseInt(req.query.timeWindow as string) || 24;

      logger.info('Getting upcoming reminders', {
        accountUuid,
        limit,
        timeWindow,
      });

      const applicationService = await ReminderTemplateController.getApplicationService();
      const upcomingReminders = await applicationService.getUpcomingReminders(
        accountUuid,
        limit,
        timeWindow,
      );

      logger.info('Upcoming reminders retrieved successfully', {
        accountUuid,
        count: upcomingReminders.length,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        upcomingReminders,
        'Upcoming reminders retrieved successfully',
      );
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error.message : 'Failed to retrieve upcoming reminders',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve upcoming reminders',
      });
    }
  }
}
