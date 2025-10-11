/**
 * NotificationTemplate Controller
 * @description 通知模板 REST API 控制�?
 * @author DailyUse Team
 * @date 2025-01-07
 *
 * 设计原则�?
 * 1. 聚合根控�?- NotificationTemplate 是聚合根，通过其方法进行状态变�?
 * 2. JWT 认证 - 所有端点都需�?JWT Bearer Token (�?route middleware 处理)
 * 3. 统一响应 - 使用 ResponseBuilder 提供一致的响应格式
 * 4. 错误分类 - 使用 ResponseCode 枚举分类错误
 * 5. 参考标�?- 遵循 Goal 模块的代码规范和模式
 */

import type { Request, Response } from 'express';
import { NotificationApplicationService } from '../../../application/services/NotificationApplicationService';
import { createLogger } from '@dailyuse/utils';
import type { NotificationContracts } from '@dailyuse/contracts';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';

const logger = createLogger('NotificationTemplateController');

/**
 * 通知模板控制�?
 */
export class NotificationTemplateController {
  private static instance: NotificationTemplateController;
  private templateService: NotificationApplicationService;
  private responseBuilder = createResponseBuilder();

  private constructor(templateService: NotificationApplicationService) {
    this.templateService = templateService;
  }

  /**
   * 创建控制器实例（在模块初始化时调用）
   */
  static createInstance(
    templateService?: NotificationApplicationService,
  ): NotificationTemplateController {
    if (!templateService) {
      templateService = NotificationApplicationService.getInstance();
    }
    NotificationTemplateController.instance = new NotificationTemplateController(templateService);
    return NotificationTemplateController.instance;
  }

  /**
   * 获取控制器单�?
   */
  static getInstance(): NotificationTemplateController {
    if (!NotificationTemplateController.instance) {
      throw new Error(
        'NotificationTemplateController not initialized. Call createInstance() first.',
      );
    }
    return NotificationTemplateController.instance;
  }

  /**
   * 创建通知模板
   * @route POST /notification-templates
   */
  async createTemplate(req: Request, res: Response): Promise<Response> {
    try {
      logger.debug('Creating notification template', { body: req.body });

      const request: NotificationContracts.CreateNotificationTemplateRequest = req.body;

      const template = await this.templateService.createTemplate(request);

      logger.info('Notification template created', { templateId: template.uuid });

      return this.responseBuilder.sendSuccess(
        res,
        template,
        'Notification template created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to create notification template', { error: error.message });

        if (error.message.includes('already exists')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }

        if (error.message.includes('Invalid')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create notification template',
      });
    }
  }

  /**
   * 获取模板列表
   * @route GET /notification-templates
   */
  async getTemplates(req: Request, res: Response): Promise<Response> {
    try {
      logger.debug('Getting notification templates', { query: req.query });

      const queryParams: NotificationContracts.QueryNotificationTemplatesRequest = {
        type: req.query.type as any,
        enabled: req.query.enabled ? req.query.enabled === 'true' : undefined,
        nameContains: req.query.nameContains as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const result = await this.templateService.getTemplates(queryParams);

      logger.debug('Notification templates retrieved', {
        total: result.total,
        returned: result.data.length,
      });

      return this.responseBuilder.sendSuccess(
        res,
        result,
        'Notification templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to get notification templates', {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get notification templates',
      });
    }
  }

  /**
   * 获取模板详情
   * @route GET /notification-templates/:id
   */
  async getTemplateById(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.debug('Getting notification template', { templateId });

      const template = await this.templateService.getTemplateById(templateId);

      if (!template) {
        logger.debug('Notification template not found', { templateId });
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification template not found',
        });
      }

      logger.debug('Notification template retrieved', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        template,
        'Notification template retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to get notification template', {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get notification template',
      });
    }
  }

  /**
   * 更新模板
   * @route PUT /notification-templates/:id
   */
  async updateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.debug('Updating notification template', { templateId, body: req.body });

      const request: NotificationContracts.UpdateNotificationTemplateRequest = req.body;

      const template = await this.templateService.updateTemplate(templateId, request);

      if (!template) {
        logger.debug('Notification template not found', { templateId });
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification template not found',
        });
      }

      logger.info('Notification template updated', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        template,
        'Notification template updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to update notification template', { error: error.message });

        if (error.message.includes('not found')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        if (error.message.includes('Invalid') || error.message.includes('already exists')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to update notification template',
      });
    }
  }

  /**
   * 删除模板
   * @route DELETE /notification-templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.info('Deleting notification template', { templateId });

      await this.templateService.deleteTemplate(templateId);

      logger.info('Notification template deleted', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        { deletedId: templateId },
        'Notification template deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to delete notification template', { error: error.message });

        if (error.message.includes('not found')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to delete notification template',
      });
    }
  }

  /**
   * 预览模板渲染
   * @route POST /notification-templates/:id/preview
   */
  async previewTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.debug('Previewing notification template', { templateId, body: req.body });

      const request: NotificationContracts.PreviewNotificationTemplateRequest = req.body;

      const preview = await this.templateService.previewTemplate(templateId, request.variables);

      logger.debug('Notification template preview generated', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        preview,
        'Notification template preview generated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to preview notification template', { error: error.message });

        if (error.message.includes('not found')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        if (
          error.message.includes('Missing required variable') ||
          error.message.includes('Invalid')
        ) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to preview notification template',
      });
    }
  }

  /**
   * 启用模板
   * @route POST /notification-templates/:id/enable
   */
  async enableTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.info('Enabling notification template', { templateId });

      const template = await this.templateService.enableTemplate(templateId);

      if (!template) {
        logger.debug('Notification template not found', { templateId });
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification template not found',
        });
      }

      logger.info('Notification template enabled', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        template,
        'Notification template enabled successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to enable notification template', { error: error.message });

        if (error.message.includes('not found')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to enable notification template',
      });
    }
  }

  /**
   * 禁用模板
   * @route POST /notification-templates/:id/disable
   */
  async disableTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const templateId = req.params.id;
      logger.info('Disabling notification template', { templateId });

      const template = await this.templateService.disableTemplate(templateId);

      if (!template) {
        logger.debug('Notification template not found', { templateId });
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification template not found',
        });
      }

      logger.info('Notification template disabled', { templateId });

      return this.responseBuilder.sendSuccess(
        res,
        template,
        'Notification template disabled successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to disable notification template', { error: error.message });

        if (error.message.includes('not found')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to disable notification template',
      });
    }
  }
}
