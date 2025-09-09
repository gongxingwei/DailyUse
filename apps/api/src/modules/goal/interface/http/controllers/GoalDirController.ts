import type { Request, Response } from 'express';
import { GoalDirApplicationService } from '../../../application/services/GoalDirApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';

export class GoalDirController {
  private static goalDirService = new GoalDirApplicationService();

  /**
   * 创建目标目录
   */
  static async createGoalDir(req: Request, res: Response) {
    try {
      const request: GoalContracts.CreateGoalDirRequest = req.body;
      const goalDir = await GoalDirController.goalDirService.createGoalDir(request);

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
  static async getGoalDirs(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const goalDirs = await GoalDirController.goalDirService.getGoalDirs(queryParams);

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
  static async getGoalDirById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goalDir = await GoalDirController.goalDirService.getGoalDirById(id);

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
  static async updateGoalDir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalDirRequest = req.body;
      const goalDir = await GoalDirController.goalDirService.updateGoalDir(id, request);

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
  static async deleteGoalDir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await GoalDirController.goalDirService.deleteGoalDir(id);

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
