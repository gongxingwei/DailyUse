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
   * 发送成功响应
   */
  private static sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    statusCode = 200,
  ): Response {
    const response: SuccessResponse<T> = {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 发送错误响应
   */
  private static sendError(
    res: Response,
    code: ResponseCode,
    message: string,
    error?: any,
  ): Response {
    const httpStatus = getHttpStatusCode(code);
    const response: ErrorResponse = {
      code,
      success: false,
      message,
      timestamp: Date.now(),
    };

    // 记录错误日志
    if (error) {
      logger.error(message, error);
    } else {
      logger.warn(message);
    }

    return res.status(httpStatus).json(response);
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

      return GoalController.sendSuccess(res, goal, 'Goal created successfully', 201);
    } catch (error) {
      // 区分不同类型的错误
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          return GoalController.sendError(res, ResponseCode.VALIDATION_ERROR, error.message, error);
        }
        if (error.message.includes('Authentication')) {
          return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
        }
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to create goal',
        error,
      );
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
      return GoalController.sendSuccess(res, listResponse, 'Goals retrieved successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to retrieve goals',
        error,
      );
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

      return GoalController.sendSuccess(res, goals, 'Goals search completed successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to search goals',
        error,
      );
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
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, 'Goal not found');
      }

      logger.info('Goal retrieved successfully', { accountUuid, goalId: id });

      return GoalController.sendSuccess(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to retrieve goal',
        error,
      );
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

      return GoalController.sendSuccess(res, goal, 'Goal updated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to update goal',
        error,
      );
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

      return GoalController.sendSuccess(res, null, 'Goal deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to delete goal',
        error,
      );
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

      return GoalController.sendSuccess(res, goal, 'Goal activated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to activate goal',
        error,
      );
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

      return GoalController.sendSuccess(res, goal, 'Goal paused successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to pause goal',
        error,
      );
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

      return GoalController.sendSuccess(res, goal, 'Goal completed successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to complete goal',
        error,
      );
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

      return GoalController.sendSuccess(res, goal, 'Goal archived successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return GoalController.sendError(res, ResponseCode.NOT_FOUND, error.message, error);
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to archive goal',
        error,
      );
    }
  }
}
