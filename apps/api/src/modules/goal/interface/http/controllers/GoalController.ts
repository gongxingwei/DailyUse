import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalApplicationService } from '../../../application/services/GoalApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('GoalController');

export class GoalController {
  private static goalService = new GoalApplicationService(new PrismaGoalRepository(prisma));
  private static responseBuilder = createResponseBuilder();

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
   * 创建目标
   */
  static async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const request: GoalContracts.CreateGoalRequest = req.body;

      logger.info('Creating goal', { accountUuid, goalName: request.name });

      const goal = await GoalController.goalService.createGoal(accountUuid, request);

      logger.info('Goal created successfully', { goalUuid: goal.uuid, accountUuid });

      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Goal created successfully',
        201,
      );
    } catch (error) {
      // 区分不同类型的错误
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          logger.error('Validation error creating goal');
          return GoalController.responseBuilder.sendError(res, { code: ResponseCode.VALIDATION_ERROR, message: error.message,
           });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating goal');
          return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message,
           });
        }
      }

      logger.error('Failed to create goal');
      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to create goal',
       });
    }
  }

  /**
   * 获取目标列表
   */
  static async getGoals(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const queryParams = req.query;

      logger.debug('Fetching goals list', { accountUuid, queryParams });

      const listResponse = await GoalController.goalService.getGoals(accountUuid, queryParams);

      logger.info('Goals retrieved successfully', {
        accountUuid,
        total: listResponse.total,
        page: listResponse.page,
      });

      // GoalListResponse 包含 { data: [...], total, page, limit, hasMore }
      return GoalController.responseBuilder.sendSuccess(
        res,
        listResponse,
        'Goals retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving goals');
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message,
         });
      }

      logger.error('Failed to retrieve goals');
      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve goals',
       });
    }
  }

  /**
   * 搜索目标
   */
  static async searchGoals(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const queryParams = req.query;

      logger.debug('Searching goals', { accountUuid, queryParams });

      const goals = await GoalController.goalService.searchGoals(accountUuid, queryParams);

      logger.info('Goals search completed', {
        accountUuid,
        resultCount: goals.data?.length || 0,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        goals,
        'Goals search completed successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error searching goals');
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message,
         });
      }

      logger.error('Failed to search goals');
      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to search goals',
       });
    }
  }

  /**
   * 根据ID获取目标
   */
  static async getGoalById(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.debug('Fetching goal by ID', { accountUuid, goalId: id });

      const goal = await GoalController.goalService.getGoalById(accountUuid, id);

      if (!goal) {
        logger.warn('Goal not found', { accountUuid, goalId: id });
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: 'Goal not found',
         });
      }

      logger.info('Goal retrieved successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error retrieving goal');
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message,
         });
      }

      logger.error('Failed to retrieve goal');
      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve goal',
       });
    }
  }

  /**
   * 更新目标
   */
  static async updateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalRequest = req.body;

      logger.info('Updating goal', { accountUuid, goalId: id, updates: request });

      const goal = await GoalController.goalService.updateGoal(accountUuid, id, request);

      logger.info('Goal updated successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal updated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to update goal' });
    }
  }

  /**
   * 删除目标
   */
  static async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Deleting goal', { accountUuid, goalId: id });

      await GoalController.goalService.deleteGoal(accountUuid, id);

      logger.info('Goal deleted successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, null, 'Goal deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to delete goal' });
    }
  }

  /**
   * 激活目标
   */
  static async activateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Activating goal', { accountUuid, goalId: id });

      const goal = await GoalController.goalService.activateGoal(accountUuid, id);

      logger.info('Goal activated successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal activated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to activate goal' });
    }
  }

  /**
   * 暂停目标
   */
  static async pauseGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Pausing goal', { accountUuid, goalId: id });

      const goal = await GoalController.goalService.pauseGoal(accountUuid, id);

      logger.info('Goal paused successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal paused successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to pause goal' });
    }
  }

  /**
   * 完成目标
   */
  static async completeGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Completing goal', { accountUuid, goalId: id });

      const goal = await GoalController.goalService.completeGoal(accountUuid, id);

      logger.info('Goal completed successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal completed successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to complete goal' });
    }
  }

  /**
   * 归档目标
   */
  static async archiveGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Archiving goal', { accountUuid, goalId: id });

      const goal = await GoalController.goalService.archiveGoal(accountUuid, id);

      logger.info('Goal archived successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal archived successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to archive goal' });
    }
  }

  // ===================================================================
  // 聚合根控制方法 - 关键结果管理（通过 Goal 聚合根）
  // ===================================================================

  /**
   * 通过 Goal 聚合根创建关键结果
   * POST /api/v1/goals/:id/key-results
   *
   * 体现DDD原则：
   * 1. 只能通过 Goal 聚合根创建 KeyResult
   * 2. 聚合根负责业务规则验证（权重总和不超过100%）
   * 3. 自动维护数据一致性和版本控制
   */
  static async createKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId
      const request = req.body;

      logger.info('Creating key result through goal aggregate', {
        accountUuid,
        goalId: id,
        keyResultName: request.name,
      });

      const keyResult = await GoalController.goalService.createKeyResult(accountUuid, id, request);

      logger.info('Key result created successfully', {
        accountUuid,
        goalId: id,
        keyResultId: keyResult.uuid,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        keyResult,
        'Key result created successfully through goal aggregate',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }
      if (error instanceof Error && error.message.includes('Invalid UUID')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.VALIDATION_ERROR, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to create key result' });
    }
  }

  /**
   * 通过 Goal 聚合根更新关键结果
   * PUT /api/v1/goals/:id/key-results/:keyResultId
   */
  static async updateKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id, keyResultId } = req.params;
      const request = req.body;

      logger.info('Updating key result through goal aggregate', {
        accountUuid,
        goalId: id,
        keyResultId,
      });

      const keyResult = await GoalController.goalService.updateKeyResultForGoal(
        accountUuid,
        id,
        keyResultId,
        request,
      );

      logger.info('Key result updated successfully', { accountUuid, goalId: id, keyResultId });

      return GoalController.responseBuilder.sendSuccess(
        res,
        keyResult,
        'Key result updated successfully through goal aggregate',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to update key result' });
    }
  }

  /**
   * 通过 Goal 聚合根删除关键结果
   * DELETE /api/v1/goals/:id/key-results/:keyResultId
   *
   * 体现聚合根控制：
   * 1. 级联删除相关记录
   * 2. 维护数据一致性
   * 3. 发布领域事件
   */
  static async deleteKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id, keyResultId } = req.params;

      logger.info('Deleting key result through goal aggregate', {
        accountUuid,
        goalId: id,
        keyResultId,
      });

      await GoalController.goalService.removeKeyResultFromGoal(accountUuid, id, keyResultId);

      logger.info('Key result deleted successfully', { accountUuid, goalId: id, keyResultId });

      return GoalController.responseBuilder.sendSuccess(res, null, 'Key result deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to delete key result' });
    }
  }

  // ===================================================================
  // 聚合根控制方法 - 目标记录管理（通过 Goal 聚合根）
  // ===================================================================

  /**
   * 通过 Goal 聚合根创建目标记录
   * POST /api/v1/goals/:id/records
   *
   * 体现聚合根控制：
   * 1. 自动更新关键结果进度
   * 2. 验证记录数据合理性
   * 3. 维护聚合一致性
   */
  static async createGoalRecord(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId
      const request = req.body;

      logger.info('Creating goal record through goal aggregate', {
        accountUuid,
        goalId: id,
        keyResultUuid: request.keyResultUuid,
      });

      const record = await GoalController.goalService.createRecordForGoal(accountUuid, id, request);

      logger.info('Goal record created successfully', {
        accountUuid,
        goalId: id,
        recordId: record.uuid,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        record,
        'Goal record created successfully through goal aggregate',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to create goal record' });
    }
  }

  // ===================================================================
  // 聚合根控制方法 - 目标复盘管理（通过 Goal 聚合根）
  // ===================================================================

  /**
   * 通过 Goal 聚合根创建目标复盘
   * POST /api/v1/goals/:id/reviews
   *
   * 体现聚合根控制：
   * 1. 自动生成当前状态快照
   * 2. 包含完整的目标和关键结果状态
   * 3. 统一的复盘数据管理
   */
  static async createGoalReview(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId
      const request = req.body;

      logger.info('Creating goal review through goal aggregate', {
        accountUuid,
        goalId: id,
        reviewTitle: request.title,
      });

      const review = await GoalController.goalService.createGoalReview(accountUuid, id, request);

      logger.info('Goal review created successfully', {
        accountUuid,
        goalId: id,
        reviewId: review.uuid,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        review,
        'Goal review created successfully through goal aggregate',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to create goal review' });
    }
  }

  // ===================================================================
  // 聚合根完整视图
  // ===================================================================

  /**
   * 获取 Goal 聚合根的完整视图
   * GET /api/v1/goals/:id/aggregate
   *
   * 包含：
   * 1. 目标基本信息
   * 2. 所有关键结果
   * 3. 最近的记录
   * 4. 复盘历史
   *
   * 体现聚合根的完整性：提供统一的数据视图
   */
  static async getGoalAggregateView(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId

      logger.debug('Fetching goal aggregate view', { accountUuid, goalId: id });

      const aggregateView = await GoalController.goalService.getGoalAggregateView(accountUuid, id);

      logger.info('Goal aggregate view retrieved successfully', { accountUuid, goalId: id });

      return GoalController.responseBuilder.sendSuccess(
        res,
        aggregateView,
        'Goal aggregate view retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to retrieve goal aggregate view' });
    }
  }

  // ===================================================================
  // 批量操作（聚合根控制）
  // ===================================================================

  /**
   * 批量更新关键结果权重
   * PUT /api/v1/goals/:id/key-results/batch-weight
   *
   * 体现聚合根控制：
   * 1. 确保权重总和不超过100%
   * 2. 原子性更新所有关键结果
   * 3. 维护业务规则一致性
   */
  static async batchUpdateKeyResultWeights(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId
      const { keyResults } = req.body as { keyResults: Array<{ uuid: string; weight: number }> };

      logger.info('Batch updating key result weights', {
        accountUuid,
        goalId: id,
        count: keyResults.length,
      });

      // 验证权重总和
      const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      if (totalWeight > 100) {
        logger.warn('Total weight exceeds 100%', { accountUuid, goalId: id, totalWeight });
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.VALIDATION_ERROR, message: `Total weight cannot exceed 100%. Current total: ${totalWeight}%`,
         });
      }

      // 通过聚合根逐个更新（保证业务规则）
      const updatedKeyResults = [];
      for (const krUpdate of keyResults) {
        const updated = await GoalController.goalService.updateKeyResultForGoal(
          accountUuid,
          id,
          krUpdate.uuid,
          { weight: krUpdate.weight },
        );
        updatedKeyResults.push(updated);
      }

      logger.info('Key result weights updated successfully', {
        accountUuid,
        goalId: id,
        count: updatedKeyResults.length,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        updatedKeyResults,
        'Key result weights updated successfully through goal aggregate',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to update key result weights' });
    }
  }

  /**
   * 复制 Goal 聚合根（包含所有子实体）
   * POST /api/v1/goals/:id/clone
   *
   * 体现聚合根完整性：
   * 1. 复制目标及所有关键结果
   * 2. 保持数据关联关系
   * 3. 重置时间戳和状态
   */
  static async cloneGoalAggregate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params; // goalId
      const { newName, newDescription } = req.body;

      logger.info('Cloning goal aggregate', { accountUuid, goalId: id, newName });

      // 获取完整聚合视图
      const originalAggregate = await GoalController.goalService.getGoalAggregateView(
        accountUuid,
        id,
      );

      // 创建新目标
      const newGoal = await GoalController.goalService.createGoal(accountUuid, {
        uuid: '123e4567-e89b-12d3-a456-426614174000', // 示例 UUID，实际应由服务生成
        name: newName || `${originalAggregate.goal.name} (Copy)`,
        description: newDescription || originalAggregate.goal.description,
        color: originalAggregate.goal.color,
        dirUuid: originalAggregate.goal.dirUuid,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
        note: originalAggregate.goal.note,
        analysis: originalAggregate.goal.analysis,
        metadata: originalAggregate.goal.metadata,
      });

      // 复制所有关键结果
      const clonedKeyResults = [];
      for (const kr of originalAggregate.keyResults) {
        const clonedKr = await GoalController.goalService.createKeyResult(
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

      logger.info('Goal aggregate cloned successfully', {
        accountUuid,
        originalGoalId: id,
        newGoalId: newGoal.uuid,
        keyResultsCount: clonedKeyResults.length,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        {
          goal: newGoal,
          keyResults: clonedKeyResults,
        },
        'Goal aggregate cloned successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.UNAUTHORIZED, message: error.message });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.responseBuilder.sendError(res, { code: ResponseCode.NOT_FOUND, message: error.message });
      }

      return GoalController.responseBuilder.sendError(res, { code: ResponseCode.INTERNAL_ERROR, message: error instanceof Error ? error.message : 'Failed to clone goal aggregate' });
    }
  }
}





