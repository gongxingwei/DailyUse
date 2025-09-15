import type { Request, Response } from 'express';
import { ReminderAggregateService } from '../../../application/services/ReminderAggregateService';
import { PrismaReminderAggregateRepository } from '../../../infrastructure/repositories/prisma/PrismaReminderAggregateRepository';
import type { ReminderContracts } from '@dailyuse/contracts';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;

// 这里需要实际的数据库连接，在真实项目中会通过依赖注入获取
const createAggregateService = () => {
  // 此处应该从容器或环境获取真实的数据库连接
  const mockPrisma = {} as any; // 临时mock，实际使用时替换为真实Prisma实例

  return new ReminderAggregateService(new PrismaReminderAggregateRepository(mockPrisma));
};

/**
 * ReminderAggregateController - 提醒聚合根式控制器
 * 专注于展示聚合根控制模式的API设计
 * 通过路由结构体现ReminderTemplate聚合根对ReminderInstance实体的管理
 */
export class ReminderAggregateController {
  private static aggregateService = createAggregateService();

  /**
   * 创建提醒模板聚合根
   * POST /api/accounts/:accountUuid/reminder-aggregates
   */
  static async createTemplateAggregate(req: Request, res: Response) {
    try {
      const request: CreateReminderTemplateRequest = req.body;
      const { accountUuid } = req.params;

      const aggregate = await ReminderAggregateController.aggregateService.createReminderTemplate(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: aggregate.toDTO(),
        message: '提醒模板聚合根创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建提醒模板聚合根失败',
      });
    }
  }

  /**
   * 通过聚合根创建提醒实例
   * POST /api/reminder-aggregates/:templateUuid/instances
   */
  static async createInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const instanceData = req.body;

      const instance = await ReminderAggregateController.aggregateService.createReminderInstance(
        templateUuid,
        instanceData,
      );

      res.status(201).json({
        success: true,
        data: instance.toDTO(),
        message: '通过聚合根创建提醒实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根创建提醒实例失败',
      });
    }
  }

  /**
   * 通过聚合根调度提醒实例
   * POST /api/reminder-aggregates/:templateUuid/instances/:instanceUuid/schedule
   */
  static async scheduleInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;

      await ReminderAggregateController.aggregateService.scheduleReminderInstance(
        templateUuid,
        instanceUuid,
      );

      res.json({
        success: true,
        message: '通过聚合根调度提醒实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根调度提醒实例失败',
      });
    }
  }

  /**
   * 通过聚合根触发提醒实例
   * POST /api/reminder-aggregates/:templateUuid/instances/:instanceUuid/trigger
   */
  static async triggerInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;

      await ReminderAggregateController.aggregateService.triggerReminderInstance(
        templateUuid,
        instanceUuid,
      );

      res.json({
        success: true,
        message: '通过聚合根触发提醒实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根触发提醒实例失败',
      });
    }
  }

  /**
   * 通过聚合根处理用户响应（确认/忽略/稍后提醒/删除）
   * POST /api/reminder-aggregates/:templateUuid/instances/:instanceUuid/respond
   */
  static async processUserResponseViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;
      const { operation, snoozeUntil, reason } = req.body;

      await ReminderAggregateController.aggregateService.processUserResponse(
        templateUuid,
        instanceUuid,
        { operation, snoozeUntil, reason },
      );

      res.json({
        success: true,
        message: '通过聚合根处理用户响应成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根处理用户响应失败',
      });
    }
  }

  /**
   * 通过聚合根稍后提醒
   * POST /api/reminder-aggregates/:templateUuid/instances/:instanceUuid/snooze
   */
  static async snoozeInstanceViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;
      const { snoozeUntil, reason } = req.body;

      await ReminderAggregateController.aggregateService.snoozeReminderInstance(
        templateUuid,
        instanceUuid,
        new Date(snoozeUntil),
        reason,
      );

      res.json({
        success: true,
        message: '通过聚合根稍后提醒设置成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根稍后提醒设置失败',
      });
    }
  }

  /**
   * 通过聚合根取消稍后提醒
   * POST /api/reminder-aggregates/:templateUuid/instances/:instanceUuid/cancel-snooze
   */
  static async cancelSnoozeViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid, instanceUuid } = req.params;

      await ReminderAggregateController.aggregateService.cancelSnooze(templateUuid, instanceUuid);

      res.json({
        success: true,
        message: '通过聚合根取消稍后提醒成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根取消稍后提醒失败',
      });
    }
  }

  /**
   * 通过聚合根批量创建重复实例
   * POST /api/reminder-aggregates/:templateUuid/instances/recurring
   */
  static async createRecurringInstancesViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const { startDate, endDate, recurrenceRule, maxInstances } = req.body;

      const instances = await ReminderAggregateController.aggregateService.createRecurringInstances(
        templateUuid,
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          recurrenceRule,
          maxInstances,
        },
      );

      res.status(201).json({
        success: true,
        data: instances.map((instance) => instance.toDTO()),
        message: '通过聚合根批量创建重复实例成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '通过聚合根批量创建重复实例失败',
      });
    }
  }

  /**
   * 加载提醒模板聚合根（包含所有实例）
   * GET /api/reminder-aggregates/:templateUuid
   */
  static async loadTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const aggregate =
        await ReminderAggregateController.aggregateService.getReminderTemplate(templateUuid);

      if (!aggregate) {
        return res.status(404).json({
          success: false,
          error: '提醒模板聚合根不存在',
        });
      }

      res.json({
        success: true,
        data: aggregate.toDTO(),
        message: '加载提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '加载提醒模板聚合根失败',
      });
    }
  }

  /**
   * 获取账户下的所有提醒模板聚合根
   * GET /api/accounts/:accountUuid/reminder-aggregates
   */
  static async getTemplateAggregatesByAccount(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;

      const aggregates =
        await ReminderAggregateController.aggregateService.getReminderTemplatesByAccount(
          accountUuid,
        );

      res.json({
        success: true,
        data: aggregates.map((aggregate) => aggregate.toDTO()),
        message: '获取账户提醒模板聚合根列表成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取账户提醒模板聚合根列表失败',
      });
    }
  }

  /**
   * 按分组获取提醒模板聚合根
   * GET /api/reminder-groups/:groupUuid/aggregates
   */
  static async getTemplateAggregatesByGroup(req: Request, res: Response) {
    try {
      const { groupUuid } = req.params;

      const aggregates =
        await ReminderAggregateController.aggregateService.getReminderTemplatesByGroup(groupUuid);

      res.json({
        success: true,
        data: aggregates.map((aggregate) => aggregate.toDTO()),
        message: '获取分组提醒模板聚合根列表成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取分组提醒模板聚合根列表失败',
      });
    }
  }

  /**
   * 搜索提醒模板聚合根
   * GET /api/accounts/:accountUuid/reminder-aggregates/search
   */
  static async searchTemplateAggregates(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const query = req.query as any; // 从查询参数获取搜索条件

      const aggregates = await ReminderAggregateController.aggregateService.searchReminderTemplates(
        accountUuid,
        query,
      );

      res.json({
        success: true,
        data: aggregates.map((aggregate) => aggregate.toDTO()),
        message: '搜索提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索提醒模板聚合根失败',
      });
    }
  }

  /**
   * 获取提醒模板聚合根的统计信息
   * GET /api/reminder-aggregates/:templateUuid/stats
   */
  static async getTemplateAggregateStats(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const stats =
        await ReminderAggregateController.aggregateService.getReminderTemplateStats(templateUuid);

      res.json({
        success: true,
        data: stats,
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
   * 获取账户级别的聚合统计
   * GET /api/accounts/:accountUuid/reminder-aggregates/stats
   */
  static async getAccountAggregateStats(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;

      const stats = await ReminderAggregateController.aggregateService.getAccountStats(accountUuid);

      res.json({
        success: true,
        data: stats,
        message: '获取账户聚合统计成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取账户聚合统计失败',
      });
    }
  }

  /**
   * 批量处理聚合根下的实例
   * POST /api/reminder-aggregates/:templateUuid/instances/batch
   */
  static async batchProcessInstancesViaAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const { operation, instanceUuids, status } = req.body;

      switch (operation) {
        case 'updateStatus':
          await ReminderAggregateController.aggregateService.batchUpdateInstanceStatus(
            templateUuid,
            instanceUuids,
            status,
          );
          break;
        default:
          throw new Error(`不支持的批量操作: ${operation}`);
      }

      res.json({
        success: true,
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
   * 更新提醒模板聚合根
   * PUT /api/reminder-aggregates/:templateUuid
   */
  static async updateTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const updateRequest: UpdateReminderTemplateRequest = req.body;

      const aggregate = await ReminderAggregateController.aggregateService.updateReminderTemplate(
        templateUuid,
        updateRequest,
      );

      res.json({
        success: true,
        data: aggregate.toDTO(),
        message: '更新提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新提醒模板聚合根失败',
      });
    }
  }

  /**
   * 启用/禁用提醒模板聚合根
   * PUT /api/reminder-aggregates/:templateUuid/toggle
   */
  static async toggleTemplateAggregateEnabled(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      await ReminderAggregateController.aggregateService.toggleReminderTemplateEnabled(
        templateUuid,
      );

      res.json({
        success: true,
        message: '切换提醒模板聚合根状态成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '切换提醒模板聚合根状态失败',
      });
    }
  }

  /**
   * 删除提醒模板聚合根（连同所有实例）
   * DELETE /api/reminder-aggregates/:templateUuid
   */
  static async deleteTemplateAggregate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      await ReminderAggregateController.aggregateService.deleteReminderTemplate(templateUuid);

      res.json({
        success: true,
        message: '删除提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除提醒模板聚合根失败',
      });
    }
  }

  /**
   * 批量启用提醒模板聚合根
   * POST /api/reminder-aggregates/batch/enable
   */
  static async batchEnableTemplateAggregates(req: Request, res: Response) {
    try {
      const { templateUuids } = req.body;

      await ReminderAggregateController.aggregateService.batchEnableReminderTemplates(
        templateUuids,
      );

      res.json({
        success: true,
        message: '批量启用提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量启用提醒模板聚合根失败',
      });
    }
  }

  /**
   * 批量禁用提醒模板聚合根
   * POST /api/reminder-aggregates/batch/disable
   */
  static async batchDisableTemplateAggregates(req: Request, res: Response) {
    try {
      const { templateUuids } = req.body;

      await ReminderAggregateController.aggregateService.batchDisableReminderTemplates(
        templateUuids,
      );

      res.json({
        success: true,
        message: '批量禁用提醒模板聚合根成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量禁用提醒模板聚合根失败',
      });
    }
  }

  /**
   * 验证聚合根业务不变量
   * GET /api/reminder-aggregates/:templateUuid/validate
   */
  static async validateTemplateAggregateInvariants(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const validation =
        await ReminderAggregateController.aggregateService.validateReminderTemplateInvariants(
          templateUuid,
        );

      res.json({
        success: true,
        data: validation,
        message: '验证聚合根业务不变量成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '验证聚合根业务不变量失败',
      });
    }
  }

  /**
   * 修复聚合根数据一致性
   * POST /api/reminder-aggregates/:templateUuid/repair
   */
  static async repairTemplateAggregateConsistency(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const repair =
        await ReminderAggregateController.aggregateService.repairReminderTemplateConsistency(
          templateUuid,
        );

      res.json({
        success: true,
        data: repair,
        message: '修复聚合根数据一致性成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '修复聚合根数据一致性失败',
      });
    }
  }
}
