import type { Request, Response } from 'express';
import { TaskAggregateService } from '../../../application/services/TaskAggregateService';
import { PrismaTaskTemplateRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskTemplateRepository';
import { PrismaTaskInstanceRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskInstanceRepository';
import { PrismaTaskMetaTemplateRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskMetaTemplateRepository';
import { PrismaClient } from '@prisma/client';
import type { TaskContracts } from '@dailyuse/contracts';

type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;

// 创建真实的Prisma客户端实例
const prisma = new PrismaClient();

// 创建聚合服务实例
const createAggregateService = () => {
  return new TaskAggregateService(
    new PrismaTaskTemplateRepository(prisma),
    new PrismaTaskInstanceRepository(prisma),
    new PrismaTaskMetaTemplateRepository(prisma),
  );
};

/**
 * TaskAggregateController - 聚合根式控制器
 * 专注于展示聚合根控制模式的API设计
 * 通过路由结构体现TaskTemplate聚合根对TaskInstance实体的管理
 */
export class TaskAggregateController {
  private static aggregateService = createAggregateService();

  /**
   * 创建任务模板聚合根
   * POST /api/v1/tasks/templates
   */
  static async createTemplateAggregate(req: Request, res: Response) {
    try {
      const request: CreateTaskTemplateRequest = req.body;
      // 从认证中间件获取accountUuid，而不是从路径参数
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少用户账户信息',
        });
      }

      const aggregate = await TaskAggregateController.aggregateService.createTaskTemplateAggregate(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: aggregate,
        message: '任务模板聚合根创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建任务模板聚合根失败',
      });
    }
  }

  /**
   * 通过聚合根创建任务实例
   * POST /api/v1/tasks/templates/:templateUuid/instances
   */
  static async createInstanceViaAggregate(req: Request, res: Response) {
    try {
      const request: CreateTaskInstanceRequest = req.body;
      const { templateUuid } = req.params;
      // 从认证中间件获取accountUuid
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少用户账户信息',
        });
      }

      const instance =
        await TaskAggregateController.aggregateService.createTaskInstanceViaAggregate(
          templateUuid,
          accountUuid,
          request,
        );

      res.status(201).json({
        success: true,
        data: instance,
        message: '通过聚合根创建实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根创建实例失败',
      });
    }
  }

  /**
   * 通过聚合根完成任务实例
   * PUT /api/task-aggregates/:templateUuid/instances/:instanceUuid/complete
   */
  static async completeInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;
      const { notes, actualDuration, actualStartTime, actualEndTime, progressPercentage } =
        req.body;

      const result =
        await TaskAggregateController.aggregateService.completeTaskInstanceViaAggregate(
          templateUuid,
          instanceUuid,
          { notes, actualDuration, actualStartTime, actualEndTime, progressPercentage },
        );

      res.json({
        success: true,
        data: result,
        message: '通过聚合根完成实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根完成实例失败',
      });
    }
  }

  /**
   * 通过聚合根更新任务实例
   * PUT /api/task-aggregates/:templateUuid/instances/:instanceUuid
   */
  static async updateInstanceViaAggregate(req: Request, res: Response) {
    try {
      const request: UpdateTaskInstanceRequest = req.body;
      const { templateUuid, instanceUuid } = req.params;

      const instance =
        await TaskAggregateController.aggregateService.updateTaskInstanceViaAggregate(
          templateUuid,
          instanceUuid,
          request,
        );

      res.json({
        success: true,
        data: instance,
        message: '通过聚合根更新实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根更新实例失败',
      });
    }
  }

  /**
   * 通过聚合根删除任务实例
   * DELETE /api/task-aggregates/:templateUuid/instances/:instanceUuid
   */
  static async deleteInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;

      await TaskAggregateController.aggregateService.deleteTaskInstanceViaAggregate(
        templateUuid,
        instanceUuid,
      );

      res.json({
        success: true,
        message: '通过聚合根删除实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根删除实例失败',
      });
    }
  }

  /**
   * 加载任务模板聚合根（包含所有实例）
   * GET /api/task-aggregates/:templateUuid
   */
  static async loadTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const aggregate =
        await TaskAggregateController.aggregateService.loadTaskTemplateAggregate(templateUuid);

      res.json({
        success: true,
        data: aggregate,
        message: '加载任务模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '加载任务模板聚合根失败',
      });
    }
  }

  /**
   * 获取任务模板聚合根的统计信息
   * GET /api/task-aggregates/:templateUuid/analytics
   */
  static async getTemplateAggregateAnalytics(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const analytics =
        await TaskAggregateController.aggregateService.getTaskTemplateAnalytics(templateUuid);

      res.json({
        success: true,
        data: analytics,
        message: '获取聚合根统计信息成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取聚合根统计信息失败',
      });
    }
  }

  /**
   * 批量处理聚合根下的实例
   * POST /api/task-aggregates/:templateUuid/instances/batch
   */
  static async batchProcessInstancesViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const { operation, instanceUuids, data } = req.body;

      let result;
      switch (operation) {
        case 'complete':
          // 批量完成实例
          result = await Promise.all(
            instanceUuids.map((instanceUuid: string) =>
              TaskAggregateController.aggregateService.completeTaskInstanceViaAggregate(
                templateUuid,
                instanceUuid,
                data,
              ),
            ),
          );
          break;
        case 'delete':
          // 批量删除实例
          await Promise.all(
            instanceUuids.map((instanceUuid: string) =>
              TaskAggregateController.aggregateService.deleteTaskInstanceViaAggregate(
                templateUuid,
                instanceUuid,
              ),
            ),
          );
          result = { processed: instanceUuids.length };
          break;
        default:
          throw new Error(`不支持的批量操作: ${operation}`);
      }

      res.json({
        success: true,
        data: result,
        message: `批量${operation}操作成功`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量操作失败',
      });
    }
  }

  /**
   * 更新任务模板聚合根
   * PUT /api/task-aggregates/:templateUuid
   */
  static async updateTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const updateRequest = req.body;

      const aggregate = await TaskAggregateController.aggregateService.updateTaskTemplateAggregate(
        templateUuid,
        updateRequest,
      );

      res.json({
        success: true,
        data: aggregate,
        message: '更新任务模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新任务模板聚合根失败',
      });
    }
  }

  /**
   * 删除任务模板聚合根（连同所有实例）
   * DELETE /api/task-aggregates/:templateUuid
   */
  static async deleteTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      await TaskAggregateController.aggregateService.deleteTaskTemplateAggregate(templateUuid);

      res.json({
        success: true,
        message: '删除任务模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除任务模板聚合根失败',
      });
    }
  }

  /**
   * 通过聚合根取消任务实例
   * POST /api/v1/tasks/templates/:templateUuid/instances/:instanceUuid/cancel
   */
  static async cancelInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;
      const { reason } = req.body;

      await TaskAggregateController.aggregateService.cancelTaskInstanceViaAggregate(
        templateUuid,
        instanceUuid,
        reason,
      );

      res.json({
        success: true,
        message: '通过聚合根取消实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根取消实例失败',
      });
    }
  }

  /**
   * 通过聚合根重新调度任务实例
   * POST /api/v1/tasks/templates/:templateUuid/instances/:instanceUuid/reschedule
   */
  static async rescheduleInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;
      const rescheduleRequest = req.body;

      await TaskAggregateController.aggregateService.rescheduleTaskInstanceViaAggregate(
        templateUuid,
        instanceUuid,
        rescheduleRequest,
      );

      res.json({
        success: true,
        message: '通过聚合根重新调度实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根重新调度实例失败',
      });
    }
  }

  /**
   * 获取账户的所有任务模板聚合根列表
   * GET /api/v1/tasks/template-aggregates
   */
  static async getAccountTemplateAggregates(req: Request, res: Response) {
    try {
      // 从认证中间件获取accountUuid
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少用户账户信息',
        });
      }

      const { includeInstances = false, limit = 20, offset = 0 } = req.query;

      const aggregates =
        await TaskAggregateController.aggregateService.getAccountTaskTemplateAggregates(
          accountUuid,
          {
            includeInstances: includeInstances === 'true',
            limit: Number(limit),
            offset: Number(offset),
          },
        );

      res.json({
        success: true,
        data: aggregates,
        message: '获取账户任务模板聚合根列表成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取账户任务模板聚合根列表失败',
      });
    }
  }

  /**
   * 搜索任务模板聚合根
   * GET /api/v1/tasks/template-aggregates/search
   */
  static async searchTemplateAggregates(req: Request, res: Response) {
    try {
      const { accountUuid, keyword, tags, status, limit = 20, offset = 0 } = req.query;

      // 此处应该调用 TaskAggregateService 的搜索方法
      // 暂时返回简单响应，实际实现需要在 TaskAggregateService 中添加相应方法
      res.json({
        success: true,
        data: {
          templates: [],
          total: 0,
          message: 'Search functionality not yet implemented in TaskAggregateService',
        },
        message: '搜索功能需要在TaskAggregateService中实现',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索任务模板聚合根失败',
      });
    }
  }
}
