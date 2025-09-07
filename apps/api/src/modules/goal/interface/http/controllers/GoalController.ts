import type { Request, Response } from 'express';
import { GoalApplicationService } from '../../../application/services/GoalApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';

export class GoalController {
  private static goalService = new GoalApplicationService();

  /**
   * 创建目标
   */
  static async createGoal(req: Request, res: Response) {
    try {
      const request: GoalContracts.CreateGoalRequest = req.body;
      const goal = await GoalController.goalService.createGoal(request);

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Goal created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal',
      });
    }
  }

  /**
   * 获取目标列表
   */
  static async getGoals(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const goals = await GoalController.goalService.getGoals(queryParams);

      res.json({
        success: true,
        data: goals,
        message: 'Goals retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goals',
      });
    }
  }

  /**
   * 根据ID获取目标
   */
  static async getGoalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalController.goalService.getGoalById(id);

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }

      res.json({
        success: true,
        data: goal,
        message: 'Goal retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal',
      });
    }
  }

  /**
   * 更新目标
   */
  static async updateGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalRequest = req.body;
      const goal = await GoalController.goalService.updateGoal(id, request);

      res.json({
        success: true,
        data: goal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update goal',
      });
    }
  }

  /**
   * 删除目标
   */
  static async deleteGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await GoalController.goalService.deleteGoal(id);

      res.json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete goal',
      });
    }
  }

  /**
   * 激活目标
   */
  static async activateGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalController.goalService.activateGoal(id);

      res.json({
        success: true,
        data: goal,
        message: 'Goal activated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate goal',
      });
    }
  }

  /**
   * 暂停目标
   */
  static async pauseGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalController.goalService.pauseGoal(id);

      res.json({
        success: true,
        data: goal,
        message: 'Goal paused successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to pause goal',
      });
    }
  }

  /**
   * 完成目标
   */
  static async completeGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalController.goalService.completeGoal(id);

      res.json({
        success: true,
        data: goal,
        message: 'Goal completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete goal',
      });
    }
  }

  /**
   * 归档目标
   */
  static async archiveGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const goal = await GoalController.goalService.archiveGoal(id);

      res.json({
        success: true,
        data: goal,
        message: 'Goal archived successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to archive goal',
      });
    }
  }

  /**
   * 更新目标进度
   */
  static async updateProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const goal = await GoalController.goalService.updateProgress(id, progress);

      res.json({
        success: true,
        data: goal,
        message: 'Goal progress updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update goal progress',
      });
    }
  }

  /**
   * 记录里程碑
   */
  static async recordMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const milestoneData = req.body;
      const goal = await GoalController.goalService.recordMilestone(id, milestoneData);

      res.json({
        success: true,
        data: goal,
        message: 'Milestone recorded successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to record milestone',
      });
    }
  }

  /**
   * 获取目标统计
   */
  static async getGoalStats(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const stats = await GoalController.goalService.getGoalStats(queryParams);

      res.json({
        success: true,
        data: stats,
        message: 'Goal stats retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal stats',
      });
    }
  }

  /**
   * 获取目标时间线
   */
  static async getGoalTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const timeline = await GoalController.goalService.getGoalTimeline(id);

      res.json({
        success: true,
        data: timeline,
        message: 'Goal timeline retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal timeline',
      });
    }
  }

  /**
   * 搜索目标
   */
  static async searchGoals(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const goals = await GoalController.goalService.searchGoals(queryParams);

      res.json({
        success: true,
        data: goals,
        message: 'Goals search completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search goals',
      });
    }
  }

  /**
   * 获取活跃目标
   */
  static async getActiveGoals(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const goals = await GoalController.goalService.getActiveGoals(accountUuid);

      res.json({
        success: true,
        data: goals,
        message: 'Active goals retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve active goals',
      });
    }
  }

  /**
   * 获取已完成目标
   */
  static async getCompletedGoals(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { from, to } = req.query;
      const goals = await GoalController.goalService.getCompletedGoals(
        accountUuid,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
      );

      res.json({
        success: true,
        data: goals,
        message: 'Completed goals retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve completed goals',
      });
    }
  }
}
