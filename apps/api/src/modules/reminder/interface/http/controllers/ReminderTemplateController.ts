import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ReminderApplicationService } from '../../../application/services/ReminderApplicationService';
import { ReminderDomainService } from '../../../domain/services/ReminderDomainService';
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
const logger = createLogger('ReminderTemplateController');

/**
 * ReminderTemplateController - 提醒模板控制器
 * 专门处理 ReminderTemplate 聚合根的HTTP请求
 * 使用正确的DDD架构：应用服务协调领域服务
 * 遵循统一的API响应格式和错误处理模式
 */
export class ReminderTemplateController {
  private static applicationService: ReminderApplicationService | null = null;
  private static domainService = new ReminderDomainService();
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取 ReminderApplicationService 实例（单例模式）
   */
  private static async getApplicationService(): Promise<ReminderApplicationService> {
    if (!this.applicationService) {
      this.applicationService = await ReminderApplicationService.getInstance();
    }
    return this.applicationService;
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

      // ✅ 使用 DDD Contract 接口方法，传递 accountUuid
      const template = await ReminderTemplateController.domainService.createTemplate(
        request,
        accountUuid,
      );

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

      const templates =
        await ReminderTemplateController.domainService.getReminderTemplatesByAccount(accountUuid);

      const listResponse: ReminderContracts.ReminderTemplateListResponse = {
        reminders: templates,
        total: templates.length,
        page,
        limit,
        hasMore: templates.length >= limit,
      };

      logger.info('Reminder templates retrieved successfully', {
        accountUuid,
        total: templates.length,
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

      const template =
        await ReminderTemplateController.domainService.getReminderTemplate(templateUuid);

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

      const template = await ReminderTemplateController.domainService.updateReminderTemplate(
        templateUuid,
        request,
      );

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

      await ReminderTemplateController.domainService.deleteReminderTemplate(templateUuid);

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

      logger.info('Toggling reminder template enabled status', { templateUuid, enabled });

      await ReminderTemplateController.domainService.toggleReminderTemplateEnabled(
        templateUuid,
        enabled,
      );

      logger.info('Reminder template status toggled successfully', { templateUuid, enabled });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        { templateUuid, enabled },
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

      logger.error(
        error instanceof Error ? error.message : 'Failed to toggle template status',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to toggle template status',
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

      const templates = await ReminderTemplateController.domainService.searchReminderTemplates(
        accountUuid,
        searchTerm,
      );

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

      const stats =
        await ReminderTemplateController.domainService.getReminderTemplateStats(templateUuid);

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

      const stats = await ReminderTemplateController.domainService.getAccountStats(accountUuid);

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
   * 获取活跃的提醒模板
   * GET /reminders/templates/active
   */
  static async getActiveTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ReminderTemplateController.extractAccountUuid(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      logger.debug('Fetching active reminder templates', { accountUuid, page, limit });

      // 获取所有模板，然后过滤出活跃的
      const allTemplates =
        await ReminderTemplateController.domainService.getReminderTemplatesByAccount(accountUuid);
      const activeTemplates = allTemplates
        .filter((template: any) => template.enabled === true)
        .slice(0, limit);

      // 移除 schedules 字段，这应该由 Schedule 模块管理
      const cleanedTemplates = activeTemplates.map((template: any) => {
        const { schedules, ...templateWithoutSchedules } = template;
        return templateWithoutSchedules;
      });

      const listResponse: ReminderContracts.ReminderTemplateListResponse = {
        reminders: cleanedTemplates,
        total: cleanedTemplates.length,
        page,
        limit,
        hasMore: cleanedTemplates.length >= limit,
      };

      logger.info('Active reminder templates retrieved successfully', {
        accountUuid,
        total: cleanedTemplates.length,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        listResponse,
        'Active reminder templates retrieved successfully',
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
        error instanceof Error ? error.message : 'Failed to retrieve active templates',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve active templates',
      });
    }
  }

  /**
   * 为指定模板生成实例和调度
   * POST /reminders/templates/:templateUuid/generate-instances
   */
  static async generateInstancesAndSchedules(req: Request, res: Response): Promise<Response> {
    try {
      const { templateUuid } = req.params;
      const { days = 7, regenerate = false } = req.body;

      logger.info('Generating instances and schedules for template', {
        templateUuid,
        days,
        regenerate,
      });

      const applicationService = await ReminderTemplateController.getApplicationService();
      const result = await applicationService.generateInstancesAndSchedules(templateUuid, {
        days: parseInt(days, 10),
        regenerate,
      });

      logger.info('Instances and schedules generated successfully', {
        templateUuid,
        instanceCount: result.instanceCount,
        scheduleCount: result.scheduleCount,
      });

      return ReminderTemplateController.responseBuilder.sendSuccess(
        res,
        result,
        `Successfully generated ${result.instanceCount} instances and ${result.scheduleCount} schedules`,
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
        error instanceof Error ? error.message : 'Failed to generate instances and schedules',
        error,
      );
      return ReminderTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Failed to generate instances and schedules',
      });
    }
  }
}
