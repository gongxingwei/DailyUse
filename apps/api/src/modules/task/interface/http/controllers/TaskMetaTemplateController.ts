import type { Response } from 'express';
import type { TaskContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';
import { TaskMetaTemplateApplicationService } from '../../../application/services/TaskMetaTemplateApplicationService';
import { ResponseCode, createResponseBuilder, getHttpStatusCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskMetaTemplateController');

/**
 * TaskMetaTemplate 控制器
 *
 * 职责：
 * 1. 管理 TaskMetaTemplate 独立聚合根的 HTTP 接口
 * 2. 使用统一的响应格式
 * 3. TaskMetaTemplate 是独立聚合根（无子实体）
 *
 * 设计原则：
 * - 独立聚合根：TaskMetaTemplate 不包含子实体
 * - 统一响应：使用 ResponseBuilder
 * - 错误处理：统一的错误响应格式
 */
export class TaskMetaTemplateController {
  private static metaTemplateService: TaskMetaTemplateApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（使用依赖注入）
   */
  private static async initializeService(): Promise<void> {
    if (!this.metaTemplateService) {
      this.metaTemplateService = await TaskMetaTemplateApplicationService.getInstance();
    }
  }

  // ===== TaskMetaTemplate CRUD =====

  /**
   * 创建任务元模板
   * POST /api/v1/tasks/meta-templates
   */
  static async createMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const request: TaskContracts.CreateTaskMetaTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;

      const metaTemplate = await TaskMetaTemplateController.metaTemplateService!.createMetaTemplate(
        accountUuid,
        request,
      );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Task meta-template created successfully',
      );
    } catch (error) {
      logger.error('Failed to create task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to create task meta-template',
       });
    }
  }

  /**
   * 获取任务元模板列表
   * GET /api/v1/tasks/meta-templates
   */
  static async getMetaTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const queryParams = req.query;
      const accountUuid = req.accountUuid!;

      const metaTemplates = await TaskMetaTemplateController.metaTemplateService!.getMetaTemplates(
        accountUuid,
        queryParams,
      );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplates,
        'Task meta-templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task meta-templates', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve task meta-templates',
       });
    }
  }

  /**
   * 获取任务元模板详情
   * GET /api/v1/tasks/meta-templates/:metaTemplateId
   */
  static async getMetaTemplateById(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const accountUuid = req.accountUuid!;

      const metaTemplate =
        await TaskMetaTemplateController.metaTemplateService!.getMetaTemplateById(
          accountUuid,
          metaTemplateId,
        );

      if (!metaTemplate) {
        logger.warn('Task meta-template not found', { metaTemplateId });
        return TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: 'Task meta-template not found',
         });
      }

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Task meta-template retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve task meta-template',
       });
    }
  }

  /**
   * 更新任务元模板
   * PUT /api/v1/tasks/meta-templates/:metaTemplateId
   */
  static async updateMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const request: TaskContracts.UpdateTaskMetaTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;

      const metaTemplate = await TaskMetaTemplateController.metaTemplateService!.updateMetaTemplate(
        accountUuid,
        metaTemplateId,
        request,
      );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Task meta-template updated successfully',
      );
    } catch (error) {
      logger.error('Failed to update task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to update task meta-template',
       });
    }
  }

  /**
   * 删除任务元模板
   * DELETE /api/v1/tasks/meta-templates/:metaTemplateId
   */
  static async deleteMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskMetaTemplateController.metaTemplateService!.deleteMetaTemplate(
        accountUuid,
        metaTemplateId,
      );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Task meta-template deleted successfully',
      );
    } catch (error) {
      logger.error('Failed to delete task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to delete task meta-template',
       });
    }
  }

  // ===== TaskMetaTemplate 状态管理 =====

  /**
   * 激活任务元模板
   * POST /api/v1/tasks/meta-templates/:metaTemplateId/activate
   */
  static async activateMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const accountUuid = req.accountUuid!;

      const metaTemplate =
        await TaskMetaTemplateController.metaTemplateService!.activateMetaTemplate(
          accountUuid,
          metaTemplateId,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Task meta-template activated successfully',
      );
    } catch (error) {
      logger.error('Failed to activate task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to activate task meta-template',
       });
    }
  }

  /**
   * 停用任务元模板
   * POST /api/v1/tasks/meta-templates/:metaTemplateId/deactivate
   */
  static async deactivateMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const accountUuid = req.accountUuid!;

      const metaTemplate =
        await TaskMetaTemplateController.metaTemplateService!.deactivateMetaTemplate(
          accountUuid,
          metaTemplateId,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Task meta-template deactivated successfully',
      );
    } catch (error) {
      logger.error('Failed to deactivate task meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to deactivate task meta-template',
       });
    }
  }

  /**
   * 切换收藏状态
   * POST /api/v1/tasks/meta-templates/:metaTemplateId/toggle-favorite
   */
  static async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const accountUuid = req.accountUuid!;

      const metaTemplate = await TaskMetaTemplateController.metaTemplateService!.toggleFavorite(
        accountUuid,
        metaTemplateId,
      );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplate,
        'Favorite status toggled successfully',
      );
    } catch (error) {
      logger.error('Failed to toggle favorite status', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to toggle favorite status',
       });
    }
  }

  // ===== 模板生成 =====

  /**
   * 从元模板创建任务模板
   * POST /api/v1/tasks/meta-templates/:metaTemplateId/create-template
   */
  static async createTemplateFromMetaTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { metaTemplateId } = req.params;
      const request: TaskContracts.CreateTaskTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;

      const template =
        await TaskMetaTemplateController.metaTemplateService!.createTemplateFromMetaTemplate(
          accountUuid,
          metaTemplateId,
          request,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template created from meta-template successfully',
      );
    } catch (error) {
      logger.error('Failed to create task template from meta-template', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error
          ? error.message
          : 'Failed to create task template from meta-template',
       });
    }
  }

  // ===== 查询方法 =====

  /**
   * 按类别获取元模板
   * GET /api/v1/tasks/meta-templates/by-category/:category
   */
  static async getMetaTemplatesByCategory(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { category } = req.params;
      const accountUuid = req.accountUuid!;

      const metaTemplates =
        await TaskMetaTemplateController.metaTemplateService!.getMetaTemplatesByCategory(
          accountUuid,
          category,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplates,
        'Meta-templates by category retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve meta-templates by category', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve meta-templates by category',
       });
    }
  }

  /**
   * 获取收藏的元模板
   * GET /api/v1/tasks/meta-templates/favorites
   */
  static async getFavoriteMetaTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const accountUuid = req.accountUuid!;

      const metaTemplates =
        await TaskMetaTemplateController.metaTemplateService!.getFavoriteMetaTemplates(accountUuid);

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplates,
        'Favorite meta-templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve favorite meta-templates', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve favorite meta-templates',
       });
    }
  }

  /**
   * 获取热门元模板
   * GET /api/v1/tasks/meta-templates/popular
   */
  static async getPopularMetaTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { limit } = req.query;
      const accountUuid = req.accountUuid!;

      const metaTemplates =
        await TaskMetaTemplateController.metaTemplateService!.getPopularMetaTemplates(
          accountUuid,
          limit ? parseInt(limit as string) : undefined,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplates,
        'Popular meta-templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve popular meta-templates', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve popular meta-templates',
       });
    }
  }

  /**
   * 获取最近使用的元模板
   * GET /api/v1/tasks/meta-templates/recently-used
   */
  static async getRecentlyUsedMetaTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskMetaTemplateController.initializeService();
      const { limit } = req.query;
      const accountUuid = req.accountUuid!;

      const metaTemplates =
        await TaskMetaTemplateController.metaTemplateService!.getRecentlyUsedMetaTemplates(
          accountUuid,
          limit ? parseInt(limit as string) : undefined,
        );

      TaskMetaTemplateController.responseBuilder.sendSuccess(
        res,
        metaTemplates,
        'Recently used meta-templates retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve recently used meta-templates', error);
      TaskMetaTemplateController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve recently used meta-templates',
       });
    }
  }
}

