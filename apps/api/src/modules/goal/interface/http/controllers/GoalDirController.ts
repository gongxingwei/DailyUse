import type { Request, Response } from 'express';
import { GoalDirApplicationService } from '../../../application/services/GoalDirApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';

export class GoalDirController {
  private static goalDirService = new GoalDirApplicationService();

  /**
   * 创建目标目录
   */
  static async createGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      const request: GoalContracts.CreateGoalDirRequest = req.body;

      // 从认证中间件获取用户UUID
      const accountUuid = req.accountUuid!; // 认证中间件保证存在

      const goalDir = await GoalDirController.goalDirService.createGoalDir(request, accountUuid);

      res.status(201).json({
        success: true,
        data: goalDir,
        message: 'Goal directory created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal directory',
      });
    }
  }

  /**
   * 获取目标目录列表
   */
  static async getGoalDirs(req: AuthenticatedRequest, res: Response) {
    try {
      const queryParams = req.query;

      // 从认证中间件获取用户UUID
      const accountUuid = req.accountUuid!; // 认证中间件保证存在

      const goalDirs = await GoalDirController.goalDirService.getGoalDirs(queryParams, accountUuid);

      res.json({
        success: true,
        data: goalDirs,
        message: 'Goal directories retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal directories',
      });
    }
  }

  /**
   * 根据ID获取目标目录
   */
  static async getGoalDirById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // 从认证中间件获取用户UUID
      const accountUuid = req.accountUuid!; // 认证中间件保证存在

      const goalDir = await GoalDirController.goalDirService.getGoalDirById(id, accountUuid);

      if (!goalDir) {
        return res.status(404).json({
          success: false,
          message: 'Goal directory not found',
        });
      }

      res.json({
        success: true,
        data: goalDir,
        message: 'Goal directory retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal directory',
      });
    }
  }

  /**
   * 更新目标目录
   */
  static async updateGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalDirRequest = req.body;

      // 从认证中间件获取用户UUID
      const accountUuid = req.accountUuid!; // 认证中间件保证存在

      const goalDir = await GoalDirController.goalDirService.updateGoalDir(
        id,
        request,
        accountUuid,
      );

      res.json({
        success: true,
        data: goalDir,
        message: 'Goal directory updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update goal directory',
      });
    }
  }

  /**
   * 删除目标目录
   */
  static async deleteGoalDir(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // 从认证中间件获取用户UUID
      const accountUuid = req.accountUuid!; // 认证中间件保证存在

      await GoalDirController.goalDirService.deleteGoalDir(id, accountUuid);

      res.json({
        success: true,
        message: 'Goal directory deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete goal directory',
      });
    }
  }
}
