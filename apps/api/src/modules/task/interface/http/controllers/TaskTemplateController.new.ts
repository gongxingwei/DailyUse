import type { Request, Response } from 'express';
import type { TaskContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';
import { TaskContainer } from '../../../infrastructure/di/TaskContainer';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { TaskTemplateApplicationService } from '../../../application/services/TaskTemplateApplicationService.new';

// 创建 logger 实例
const logger = createLogger('TaskTemplateController');

/**
 * TaskTemplate 控制器
 * 职责：
 * 1. 管理 TaskTemplate 聚合根的 HTTP 接口
 * 2. 通过聚合根控制所有 TaskInstance 子实体操作
 * 3. 使用统一的响应格式
 *
 * 设计原则（参考 GoalController）：
 * - 聚合根驱动：所有子实体操作通过聚合根
 * - 统一响应：使用 ResponseBuilder
 * - 错误处理：统一的错误响应格式
 */
export class TaskTemplateController {
  private static taskTemplateApplicationService: TaskTemplateApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（使用依赖注入）
   */
  private static async initializeService(): Promise<void> {
    if (!this.taskTemplateApplicationService) {
      const container = TaskContainer.getInstance();
      const templateRepository = await container.getPrismaTaskTemplateRepository();
      const instanceRepository = await container.getPrismaTaskInstanceRepository();
      this.taskTemplateApplicationService = new TaskTemplateApplicationService(
        templateRepository,
        instanceRepository,
      );
    }
  }

  /**
   * 发送成功响应
   */
  private static sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    code: ResponseCode = ResponseCode.SUCCESS,
  ): void {
    const response = this.responseBuilder.success(data, message);
    const httpStatus = getHttpStatusCode(code);
    res.status(httpStatus).json(response);
  }

  /**
   * 发送错误响应
   */
  private static sendError(
    res: Response,
    error: Error,
    code: ResponseCode = ResponseCode.INTERNAL_ERROR,
    defaultMessage: string = 'Operation failed',
  ): void {
    logger.error(`${defaultMessage}:`, error);
    const response = this.responseBuilder.error(code, error.message || defaultMessage);
    const httpStatus = getHttpStatusCode(code);
    res.status(httpStatus).json(response);
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

      const template = await TaskTemplateController.taskTemplateApplicationService!.createTemplate(
        accountUuid,
        request,
      );

      TaskTemplateController.sendSuccess(res, template, 'Task template created successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to create task template',
      );
    }
  }

  /**
   * 获取任务模板列表
   * GET /api/v1/tasks/templates
   */
  static async getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const queryParams = req.query;
      const accountUuid = req.accountUuid!;

      const templates = await TaskTemplateController.taskTemplateApplicationService!.getTemplates(
        accountUuid,
        queryParams,
      );

      TaskTemplateController.sendSuccess(res, templates, 'Task templates retrieved successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to retrieve task templates',
      );
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

      const template = await TaskTemplateController.taskTemplateApplicationService!.getTemplateById(
        accountUuid,
        templateId,
      );

      if (!template) {
        return TaskTemplateController.sendError(
          res,
          new Error('Task template not found'),
          ResponseCode.NOT_FOUND,
          'Task template not found',
        );
      }

      TaskTemplateController.sendSuccess(res, template, 'Task template retrieved successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to retrieve task template',
      );
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

      const template = await TaskTemplateController.taskTemplateApplicationService!.updateTemplate(
        accountUuid,
        templateId,
        request,
      );

      TaskTemplateController.sendSuccess(res, template, 'Task template updated successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to update task template',
      );
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

      await TaskTemplateController.taskTemplateApplicationService!.deleteTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.sendSuccess(res, null, 'Task template deleted successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to delete task template',
      );
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

      const template =
        await TaskTemplateController.taskTemplateApplicationService!.activateTemplate(
          accountUuid,
          templateId,
        );

      TaskTemplateController.sendSuccess(res, template, 'Task template activated successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to activate task template',
      );
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

      const template = await TaskTemplateController.taskTemplateApplicationService!.pauseTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.sendSuccess(res, template, 'Task template paused successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to pause task template',
      );
    }
  }

  /**
   * 完成任务模板
   * POST /api/v1/tasks/templates/:templateId/complete
   */
  static async completeTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const template =
        await TaskTemplateController.taskTemplateApplicationService!.completeTemplate(
          accountUuid,
          templateId,
        );

      TaskTemplateController.sendSuccess(res, template, 'Task template completed successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to complete task template',
      );
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

      const template = await TaskTemplateController.taskTemplateApplicationService!.archiveTemplate(
        accountUuid,
        templateId,
      );

      TaskTemplateController.sendSuccess(res, template, 'Task template archived successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to archive task template',
      );
    }
  }

  // ===== DDD 聚合根控制 - TaskInstance 子实体管理 =====

  /**
   * 通过聚合根创建任务实例
   * POST /api/v1/tasks/templates/:templateId/instances
   *
   * 体现DDD原则：
   * - TaskInstance 必须通过 TaskTemplate 聚合根创建
   * - 聚合根负责业务规则验证
   * - 维护数据一致性
   */
  static async createInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const request: TaskContracts.CreateTaskInstanceRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateApplicationService!.createInstance(
        accountUuid,
        templateId,
        request,
      );

      TaskTemplateController.sendSuccess(res, instance, 'Task instance created successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to create task instance',
      );
    }
  }

  /**
   * 通过聚合根更新任务实例
   * PUT /api/v1/tasks/templates/:templateId/instances/:instanceId
   */
  static async updateInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId, instanceId } = req.params;
      const request: TaskContracts.UpdateTaskInstanceRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateApplicationService!.updateInstance(
        accountUuid,
        templateId,
        instanceId,
        request,
      );

      TaskTemplateController.sendSuccess(res, instance, 'Task instance updated successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to update task instance',
      );
    }
  }

  /**
   * 通过聚合根删除任务实例
   * DELETE /api/v1/tasks/templates/:templateId/instances/:instanceId
   */
  static async deleteInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId, instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      await TaskTemplateController.taskTemplateApplicationService!.deleteInstance(
        accountUuid,
        templateId,
        instanceId,
      );

      TaskTemplateController.sendSuccess(res, null, 'Task instance deleted successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to delete task instance',
      );
    }
  }

  /**
   * 获取模板的所有任务实例
   * GET /api/v1/tasks/templates/:templateId/instances
   */
  static async getTemplateInstances(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const queryParams = req.query;
      const accountUuid = req.accountUuid!;

      const instances =
        await TaskTemplateController.taskTemplateApplicationService!.getTemplateInstances(
          accountUuid,
          templateId,
          queryParams,
        );

      TaskTemplateController.sendSuccess(res, instances, 'Task instances retrieved successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to retrieve task instances',
      );
    }
  }

  // ===== TaskInstance 状态管理（通过聚合根）=====

  /**
   * 完成任务实例
   * POST /api/v1/tasks/templates/:templateId/instances/:instanceId/complete
   */
  static async completeInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId, instanceId } = req.params;
      const request: TaskContracts.CompleteTaskRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance =
        await TaskTemplateController.taskTemplateApplicationService!.completeInstance(
          accountUuid,
          templateId,
          instanceId,
          request,
        );

      TaskTemplateController.sendSuccess(res, instance, 'Task instance completed successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to complete task instance',
      );
    }
  }

  /**
   * 取消任务实例
   * POST /api/v1/tasks/templates/:templateId/instances/:instanceId/cancel
   */
  static async cancelInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId, instanceId } = req.params;
      const accountUuid = req.accountUuid!;

      const instance = await TaskTemplateController.taskTemplateApplicationService!.cancelInstance(
        accountUuid,
        templateId,
        instanceId,
      );

      TaskTemplateController.sendSuccess(res, instance, 'Task instance cancelled successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to cancel task instance',
      );
    }
  }

  /**
   * 重新调度任务实例
   * POST /api/v1/tasks/templates/:templateId/instances/:instanceId/reschedule
   */
  static async rescheduleInstance(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId, instanceId } = req.params;
      const request: TaskContracts.RescheduleTaskRequest = req.body;
      const accountUuid = req.accountUuid!;

      const instance =
        await TaskTemplateController.taskTemplateApplicationService!.rescheduleInstance(
          accountUuid,
          templateId,
          instanceId,
          request,
        );

      TaskTemplateController.sendSuccess(res, instance, 'Task instance rescheduled successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to reschedule task instance',
      );
    }
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取 TaskTemplate 聚合根的完整视图
   * GET /api/v1/tasks/templates/:templateId/aggregate
   *
   * 包含：
   * 1. 模板基本信息
   * 2. 所有任务实例
   * 3. 统计信息
   *
   * 体现聚合根的完整性：提供统一的数据视图
   */
  static async getTemplateAggregateView(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const aggregateView =
        await TaskTemplateController.taskTemplateApplicationService!.getTemplateAggregateView(
          accountUuid,
          templateId,
        );

      TaskTemplateController.sendSuccess(
        res,
        aggregateView,
        'Task template aggregate view retrieved successfully',
      );
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to retrieve task template aggregate view',
      );
    }
  }

  // ===== 统计和查询 =====

  /**
   * 获取模板统计信息
   * GET /api/v1/tasks/templates/:templateId/stats
   */
  static async getTemplateStats(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const accountUuid = req.accountUuid!;

      const stats = await TaskTemplateController.taskTemplateApplicationService!.getTemplateStats(
        accountUuid,
        templateId,
      );

      TaskTemplateController.sendSuccess(res, stats, 'Task template stats retrieved successfully');
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to retrieve task template stats',
      );
    }
  }

  /**
   * 批量生成任务实例（根据调度规则）
   * POST /api/v1/tasks/templates/:templateId/generate-instances
   */
  static async generateScheduledInstances(req: AuthenticatedRequest, res: Response) {
    try {
      await TaskTemplateController.initializeService();
      const { templateId } = req.params;
      const { startDate, endDate } = req.body;
      const accountUuid = req.accountUuid!;

      const instances =
        await TaskTemplateController.taskTemplateApplicationService!.generateScheduledInstances(
          accountUuid,
          templateId,
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
        );

      TaskTemplateController.sendSuccess(
        res,
        instances,
        `Generated ${instances.length} task instances successfully`,
      );
    } catch (error) {
      TaskTemplateController.sendError(
        res,
        error as Error,
        ResponseCode.INTERNAL_ERROR,
        'Failed to generate task instances',
      );
    }
  }
}
