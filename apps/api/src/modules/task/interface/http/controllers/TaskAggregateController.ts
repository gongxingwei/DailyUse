import type { Request, Response } from 'express';
import { TaskAggregateService } from '../../../application/services/TaskAggregateService';
import { PrismaTaskTemplateRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskTemplateRepository';
import { PrismaTaskInstanceRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskInstanceRepository';
import { PrismaTaskMetaTemplateRepository } from '../../../infrastructure/repositories/prisma/PrismaTaskMetaTemplateRepository';
import type { TaskContracts } from '@dailyuse/contracts';

type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type CreateTaskInstanceRequest = TaskContracts.CreateTaskInstanceRequest;
type UpdateTaskInstanceRequest = TaskContracts.UpdateTaskInstanceRequest;

// 这里需要实际的数据库连接，在真实项目中会通过依赖注入获取
const createAggregateService = () => {
  // 此处应该从容器或环境获取真实的数据库连接
  const mockPrisma = {} as any; // 临时mock，实际使用时替换为真实Prisma实例

  return new TaskAggregateService(
    new PrismaTaskTemplateRepository(mockPrisma),
    new PrismaTaskInstanceRepository(mockPrisma),
    new PrismaTaskMetaTemplateRepository(mockPrisma),
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
   * POST /api/accounts/:accountUuid/task-aggregates
   */
  static async createTemplateAggregate(req: Request, res: Response) {
    try {
      const request: CreateTaskTemplateRequest = req.body;
      const { accountUuid } = req.params;

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
   * POST /api/task-aggregates/:templateUuid/instances
   */
  static async createInstanceViaAggregate(req: Request, res: Response) {
    try {
      const request: CreateTaskInstanceRequest = req.body;
      const { templateUuid } = req.params;
      const { accountUuid } = req.body; // 从请求体获取accountUuid

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
}
