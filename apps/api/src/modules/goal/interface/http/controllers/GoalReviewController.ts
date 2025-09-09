import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalReviewApplicationService } from '../../../application/services/GoalReviewApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';

export class GoalReviewController {
  private static goalReviewService = new GoalReviewApplicationService(
    new PrismaGoalRepository(prisma),
  );

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

  /**
   * 创建目标复盘
   */
  static async createGoalReview(req: Request, res: Response) {
    try {
      const accountUuid = GoalReviewController.extractAccountUuid(req);
      const { goalId } = req.params;
      const request: GoalContracts.CreateGoalReviewRequest = req.body;
      const goalReview = await GoalReviewController.goalReviewService.createGoalReview(
        accountUuid,
        goalId,
        request,
      );

      res.status(201).json({
        success: true,
        data: goalReview,
        message: 'Goal review created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal review',
      });
    }
  }

  /**
   * 根据目标UUID获取目标复盘列表
   */
  static async getGoalReviewsByGoal(req: Request, res: Response) {
    try {
      const accountUuid = GoalReviewController.extractAccountUuid(req);
      const { goalId } = req.params;
      const goalReviews = await GoalReviewController.goalReviewService.getGoalReviewsByGoal(
        accountUuid,
        goalId,
      );

      res.json({
        success: true,
        data: goalReviews.reviews,
        total: goalReviews.total,
        message: 'Goal reviews retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal reviews',
      });
    }
  }

  /**
   * 根据ID获取目标复盘
   */
  static async getGoalReviewById(req: Request, res: Response) {
    try {
      const accountUuid = GoalReviewController.extractAccountUuid(req);
      const { id } = req.params;
      const goalReview = await GoalReviewController.goalReviewService.getGoalReviewById(
        accountUuid,
        id,
      );

      if (!goalReview) {
        return res.status(404).json({
          success: false,
          message: 'Goal review not found',
        });
      }

      res.json({
        success: true,
        data: goalReview,
        message: 'Goal review retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal review',
      });
    }
  }

  /**
   * 更新目标复盘
   */
  static async updateGoalReview(req: Request, res: Response) {
    try {
      const accountUuid = GoalReviewController.extractAccountUuid(req);
      const { id } = req.params;
      const request: Partial<GoalContracts.CreateGoalReviewRequest> = req.body;
      const goalReview = await GoalReviewController.goalReviewService.updateGoalReview(
        accountUuid,
        id,
        request,
      );

      res.json({
        success: true,
        data: goalReview,
        message: 'Goal review updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update goal review',
      });
    }
  }

  /**
   * 删除目标复盘
   */
  static async deleteGoalReview(req: Request, res: Response) {
    try {
      const accountUuid = GoalReviewController.extractAccountUuid(req);
      const { id } = req.params;
      await GoalReviewController.goalReviewService.deleteGoalReview(accountUuid, id);

      res.json({
        success: true,
        message: 'Goal review deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete goal review',
      });
    }
  }
}
