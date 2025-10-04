import type { Request, Response } from 'express';
import { GoalDirApplicationService } from '../../../application/services/GoalDirApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';
import { GoalContainer } from '../../../infrastructure/di/GoalContainer';
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
const logger = createLogger('GoalDirController');

export class GoalDirController {
  private static goalDirService: GoalDirApplicationService;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（使用依赖注入）
   */
  private static async initializeService(): Promise<void> {
    if (!this.goalDirService) {
      const container = GoalContainer.getInstance();
      const goalRepository = await container.getPrismaGoalRepository();
      this.goalDirService = new GoalDirApplicationService(goalRepository);
    }
  }

  /**
   * 创建目标目录
   */
  static async createGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      await GoalDirController.initializeService();
      const request: GoalContracts.CreateGoalDirRequest = req.body;
      const accountUuid = req.accountUuid!;

      const goalDir = await GoalDirController.goalDirService.createGoalDir(request, accountUuid);

      GoalDirController.responseBuilder.sendSuccess(
        res,
        goalDir,
        'Goal directory created successfully',
      );
    } catch (error) {
      logger.error('Failed to create goal directory', error);
      GoalDirController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to create goal directory',
      });
    }
  }

  /**
   * 获取目标目录列表
   */
  static async getGoalDirs(req: AuthenticatedRequest, res: Response) {
    try {
      await GoalDirController.initializeService();
      const queryParams = req.query;
      const accountUuid = req.accountUuid!;

      const goalDirs = await GoalDirController.goalDirService.getGoalDirs(queryParams, accountUuid);

      GoalDirController.responseBuilder.sendSuccess(
        res,
        goalDirs,
        'Goal directories retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve goal directories', error);
      GoalDirController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve goal directories',
      });
    }
  }

  /**
   * 根据ID获取目标目录
   */
  static async getGoalDirById(req: AuthenticatedRequest, res: Response) {
    try {
      await GoalDirController.initializeService();
      const { id } = req.params;
      const accountUuid = req.accountUuid!;

      const goalDir = await GoalDirController.goalDirService.getGoalDirById(id, accountUuid);

      if (!goalDir) {
        logger.warn('Goal directory not found');
        return GoalDirController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal directory not found',
        });
      }

      GoalDirController.responseBuilder.sendSuccess(
        res,
        goalDir,
        'Goal directory retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to retrieve goal directory', error);
      GoalDirController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to retrieve goal directory',
      });
    }
  }

  /**
   * 更新目标目录
   */
  static async updateGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      await GoalDirController.initializeService();
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalDirRequest = req.body;
      const accountUuid = req.accountUuid!;

      const goalDir = await GoalDirController.goalDirService.updateGoalDir(
        id,
        request,
        accountUuid,
      );

      GoalDirController.responseBuilder.sendSuccess(
        res,
        goalDir,
        'Goal directory updated successfully',
      );
    } catch (error) {
      logger.error('Failed to update goal directory', error);
      GoalDirController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to update goal directory',
      });
    }
  }

  /**
   * 删除目标目录
   */
  static async deleteGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      await GoalDirController.initializeService();
      const { id } = req.params;
      const accountUuid = req.accountUuid!;

      await GoalDirController.goalDirService.deleteGoalDir(id, accountUuid);

      GoalDirController.responseBuilder.sendSuccess(
        res,
        null,
        'Goal directory deleted successfully',
      );
    } catch (error) {
      logger.error('Failed to delete goal directory', error);
      GoalDirController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: (error as Error).message || 'Failed to delete goal directory',
      });
    }
  }
}
