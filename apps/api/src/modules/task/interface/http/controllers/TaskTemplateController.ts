import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaskTemplateApplicationService } from '../../../application/services/TaskTemplateApplicationService';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { isTaskError } from '@dailyuse/domain-server';

// 创建 logger 实例
const logger = createLogger('TaskTemplateController');

export class TaskTemplateController {
  private static taskTemplateService: TaskTemplateApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getTaskTemplateService(): Promise<TaskTemplateApplicationService> {
    if (!TaskTemplateController.taskTemplateService) {
      TaskTemplateController.taskTemplateService =
        await TaskTemplateApplicationService.getInstance();
    }
    return TaskTemplateController.taskTemplateService;
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
   * 统一错误处理
   * 将领域错误转换为 HTTP 响应
   */
  private static handleError(res: Response, error: unknown): Response {
    logger.error('Request error', { error });

    // 检查是否为领域错误
    if (isTaskError(error)) {
      // 映射 HTTP 状态码到 ResponseCode
      const responseCode = TaskTemplateController.mapHttpStatusToResponseCode(error.httpStatus);
      
      return TaskTemplateController.responseBuilder.sendError(res, {
        code: responseCode,
        message: error.message,
        errorCode: error.code,
        debug: error.context,
      });
    }

    // 处理认证错误
    if (error instanceof Error && error.message === 'Authentication required') {
      return TaskTemplateController.responseBuilder.sendError(res, {
        code: ResponseCode.UNAUTHORIZED,
        message: error.message,
      });
    }

    // 处理未知错误
    return TaskTemplateController.responseBuilder.sendError(res, {
      code: ResponseCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  /**
   * 映射 HTTP 状态码到 ResponseCode
   */
  private static mapHttpStatusToResponseCode(httpStatus: number): ResponseCode {
    switch (httpStatus) {
      case 400:
        return ResponseCode.BAD_REQUEST;
      case 401:
        return ResponseCode.UNAUTHORIZED;
      case 403:
        return ResponseCode.FORBIDDEN;
      case 404:
        return ResponseCode.NOT_FOUND;
      case 409:
        return ResponseCode.CONFLICT;
      case 500:
        return ResponseCode.INTERNAL_ERROR;
      default:
        return ResponseCode.INTERNAL_ERROR;
    }
  }

  /**
   * 创建任务模板
   * @route POST /api/task-templates
   */
  static async createTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      logger.info('Creating task template', { accountUuid, title: req.body.title });

      const template = await service.createTaskTemplate({
        accountUuid,
        ...req.body,
      });

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template created successfully',
        201,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务模板详情
   * @route GET /api/task-templates/:id
   */
  static async getTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const template = await service.getTaskTemplate(id, includeChildren);

      if (!template) {
        return TaskTemplateController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Task template not found',
        });
      }

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 获取任务模板列表
   * @route GET /api/task-templates
   */
  static async getTaskTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = TaskTemplateController.extractAccountUuid(req);
      const service = await TaskTemplateController.getTaskTemplateService();

      const { status, folderUuid, goalUuid, tags } = req.query;

      let templates;

      if (status) {
        templates = await service.getTaskTemplatesByStatus(accountUuid, status as any);
      } else if (folderUuid) {
        templates = await service.getTaskTemplatesByFolder(folderUuid as string);
      } else if (goalUuid) {
        templates = await service.getTaskTemplatesByGoal(goalUuid as string);
      } else if (tags) {
        const tagArray = typeof tags === 'string' ? tags.split(',') : [];
        templates = await service.getTaskTemplatesByTags(accountUuid, tagArray);
      } else {
        templates = await service.getTaskTemplatesByAccount(accountUuid);
      }

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        templates,
        'Task templates retrieved successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 激活任务模板
   * @route POST /api/task-templates/:id/activate
   */
  static async activateTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.activateTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template activated successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 暂停任务模板
   * @route POST /api/task-templates/:id/pause
   */
  static async pauseTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.pauseTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template paused successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 归档任务模板
   * @route POST /api/task-templates/:id/archive
   */
  static async archiveTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.archiveTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template archived successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 生成任务实例
   * @route POST /api/task-templates/:id/generate-instances
   */
  static async generateInstances(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const { toDate } = req.body;

      const instances = await service.generateInstances(id, toDate);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        instances,
        `${instances.length} task instances generated successfully`,
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 绑定到目标
   * @route POST /api/task-templates/:id/bind-goal
   */
  static async bindToGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;
      const { goalUuid, keyResultUuid, incrementValue } = req.body;

      const template = await service.bindToGoal(id, {
        goalUuid,
        keyResultUuid,
        incrementValue,
      });

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template bound to goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 解除目标绑定
   * @route POST /api/task-templates/:id/unbind-goal
   */
  static async unbindFromGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      const template = await service.unbindFromGoal(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        template,
        'Task template unbound from goal successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }

  /**
   * 删除任务模板
   * @route DELETE /api/task-templates/:id
   */
  static async deleteTaskTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const service = await TaskTemplateController.getTaskTemplateService();
      const { id } = req.params;

      await service.deleteTaskTemplate(id);

      return TaskTemplateController.responseBuilder.sendSuccess(
        res,
        null,
        'Task template deleted successfully',
      );
    } catch (error) {
      return TaskTemplateController.handleError(res, error);
    }
  }
}
