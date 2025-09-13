import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalApplicationService } from '../../../application/services/GoalApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';

/**
 * Goal聚合根控制器
 * 体现DDD聚合根控制模式：
 * 1. 通过聚合根管理所有子实体操作
 * 2. 确保业务规则和数据一致性
 * 3. 提供聚合根完整视图
 *
 * 路由设计体现聚合根控制：
 * - POST /goals/:goalId/key-results (通过Goal创建KeyResult)
 * - PUT /goals/:goalId/key-results/:keyResultId (通过Goal更新KeyResult)
 * - DELETE /goals/:goalId/key-results/:keyResultId (通过Goal删除KeyResult)
 * - POST /goals/:goalId/records (通过Goal创建Record)
 * - POST /goals/:goalId/reviews (通过Goal创建Review)
 * - GET /goals/:goalId/aggregate (获取完整聚合视图)
 */
export class GoalAggregateController {
  private static goalService = new GoalApplicationService(new PrismaGoalRepository(prisma));

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  // ===== 聚合根控制：关键结果管理 =====

  /**
   * 通过Goal聚合根创建关键结果
   * POST /api/v1/goals/:goalId/key-results
   *
   * 体现DDD原则：
   * 1. 只能通过Goal聚合根创建KeyResult
   * 2. 聚合根负责业务规则验证（权重总和不超过100%）
   * 3. 自动维护数据一致性和版本控制
   */
  static async createKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const request = req.body;

      const keyResult = await GoalAggregateController.goalService.createKeyResult(
        accountUuid,
        goalId,
        request,
      );

      res.status(201).json({
        success: true,
        data: keyResult,
        message: 'Key result created successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create key result',
      });
    }
  }

  /**
   * 通过Goal聚合根更新关键结果
   * PUT /api/v1/goals/:goalId/key-results/:keyResultId
   */
  static async updateKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId, keyResultId } = req.params;
      const request = req.body;

      const keyResult = await GoalAggregateController.goalService.updateKeyResult(
        accountUuid,
        goalId,
        keyResultId,
        request,
      );

      res.json({
        success: true,
        data: keyResult,
        message: 'Key result updated successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update key result',
      });
    }
  }

  /**
   * 通过Goal聚合根删除关键结果
   * DELETE /api/v1/goals/:goalId/key-results/:keyResultId
   *
   * 体现聚合根控制：
   * 1. 级联删除相关记录
   * 2. 维护数据一致性
   * 3. 发布领域事件
   */
  static async deleteKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId, keyResultId } = req.params;

      await GoalAggregateController.goalService.deleteKeyResult(accountUuid, goalId, keyResultId);

      res.json({
        success: true,
        message: 'Key result deleted successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete key result',
      });
    }
  }

  // ===== 聚合根控制：目标记录管理 =====

  /**
   * 通过Goal聚合根创建目标记录
   * POST /api/v1/goals/:goalId/records
   *
   * 体现聚合根控制：
   * 1. 自动更新关键结果进度
   * 2. 验证记录数据合理性
   * 3. 维护聚合一致性
   */
  static async createGoalRecord(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const request = req.body;

      const record = await GoalAggregateController.goalService.createGoalRecord(
        accountUuid,
        goalId,
        request,
      );

      res.status(201).json({
        success: true,
        data: record,
        message: 'Goal record created successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal record',
      });
    }
  }

  // ===== 聚合根控制：目标复盘管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   * POST /api/v1/goals/:goalId/reviews
   *
   * 体现聚合根控制：
   * 1. 自动生成当前状态快照
   * 2. 包含完整的目标和关键结果状态
   * 3. 统一的复盘数据管理
   */
  static async createGoalReview(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const request = req.body;

      const review = await GoalAggregateController.goalService.createGoalReview(
        accountUuid,
        goalId,
        request,
      );

      res.status(201).json({
        success: true,
        data: review,
        message: 'Goal review created successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal review',
      });
    }
  }

  // ===== 聚合根完整视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * GET /api/v1/goals/:goalId/aggregate
   *
   * 包含：
   * 1. 目标基本信息
   * 2. 所有关键结果
   * 3. 最近的记录
   * 4. 复盘历史
   *
   * 体现聚合根的完整性：提供统一的数据视图
   */
  static async getGoalAggregateView(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;

      const aggregateView = await GoalAggregateController.goalService.getGoalAggregateView(
        accountUuid,
        goalId,
      );

      res.json({
        success: true,
        data: aggregateView,
        message: 'Goal aggregate view retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal aggregate view',
      });
    }
  }

  // ===== 批量操作（聚合根控制）=====

  /**
   * 批量更新关键结果权重
   * PUT /api/v1/goals/:goalId/key-results/batch-weight
   *
   * 体现聚合根控制：
   * 1. 确保权重总和不超过100%
   * 2. 原子性更新所有关键结果
   * 3. 维护业务规则一致性
   */
  static async batchUpdateKeyResultWeights(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const { keyResults } = req.body as { keyResults: Array<{ uuid: string; weight: number }> };

      // 验证权重总和
      const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      if (totalWeight > 100) {
        return res.status(400).json({
          success: false,
          message: `Total weight cannot exceed 100%. Current total: ${totalWeight}%`,
        });
      }

      // 通过聚合根逐个更新（保证业务规则）
      const updatedKeyResults = [];
      for (const krUpdate of keyResults) {
        const updated = await GoalAggregateController.goalService.updateKeyResult(
          accountUuid,
          goalId,
          krUpdate.uuid,
          { weight: krUpdate.weight },
        );
        updatedKeyResults.push(updated);
      }

      res.json({
        success: true,
        data: updatedKeyResults,
        message: 'Key result weights updated successfully through goal aggregate',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update key result weights',
      });
    }
  }

  /**
   * 复制Goal聚合根（包含所有子实体）
   * POST /api/v1/goals/:goalId/clone
   *
   * 体现聚合根完整性：
   * 1. 复制目标及所有关键结果
   * 2. 保持数据关联关系
   * 3. 重置时间戳和状态
   */
  static async cloneGoalAggregate(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const { newName, newDescription } = req.body;

      // 获取完整聚合视图
      const originalAggregate = await GoalAggregateController.goalService.getGoalAggregateView(
        accountUuid,
        goalId,
      );

      // 创建新目标
      const newGoal = await GoalAggregateController.goalService.createGoal(accountUuid, {
        name: newName || `${originalAggregate.goal.name} (Copy)`,
        description: newDescription || originalAggregate.goal.description,
        color: originalAggregate.goal.color,
        dirUuid: originalAggregate.goal.dirUuid,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
        note: originalAggregate.goal.note,
        analysis: originalAggregate.goal.analysis,
        metadata: originalAggregate.goal.metadata,
      });

      // 复制所有关键结果
      const clonedKeyResults = [];
      for (const kr of originalAggregate.keyResults) {
        const clonedKr = await GoalAggregateController.goalService.createKeyResult(
          accountUuid,
          newGoal.uuid,
          {
            name: kr.name,
            description: kr.description,
            startValue: kr.startValue,
            targetValue: kr.targetValue,
            currentValue: kr.startValue, // 重置为起始值
            unit: kr.unit,
            weight: kr.weight,
            calculationMethod: kr.calculationMethod,
          },
        );
        clonedKeyResults.push(clonedKr);
      }

      res.status(201).json({
        success: true,
        data: {
          goal: newGoal,
          keyResults: clonedKeyResults,
        },
        message: 'Goal aggregate cloned successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clone goal aggregate',
      });
    }
  }
}
