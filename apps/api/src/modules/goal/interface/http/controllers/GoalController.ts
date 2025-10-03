import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalApplicationService } from '../../../application/services/GoalApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';

export class GoalController {
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

  /**
   * 创建目标
   */
  static async createGoal(req: Request, res: Response) {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const request: GoalContracts.CreateGoalRequest = req.body;

      const goal = await GoalController.goalService.createGoal(accountUuid, request);

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Goal created successfully',
      });
    } catch (error) {
      // ✅ 区分验证错误和服务器错误
      if (error instanceof Error && error.message.includes('Invalid UUID')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal',
      });
    }
  }

  /**
   * 获取目标列表
   * ✅ 返回格式: { success, data: { data: [...], total, page, limit, hasMore } }
   * 前端 axios 拦截器会返回 response.data，所以分页信息必须在 data 字段内
   */
  static async getGoals(req: Request, res: Response) {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const queryParams = req.query;
      const listResponse = await GoalController.goalService.getGoals(accountUuid, queryParams);

      // ✅ GoalListResponse 本身就包含 { data, total, page, limit, hasMore }
      // 直接放在 data 字段中，axios 拦截器会返回这个完整对象
      res.json({
        success: true,
        data: listResponse, // ✅ { data: [...], total, page, limit, hasMore }
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
   * 搜索目标
   */
  static async searchGoals(req: Request, res: Response) {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const queryParams = req.query;
      const goals = await GoalController.goalService.searchGoals(accountUuid, queryParams);

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
   * 根据ID获取目标
   */
  static async getGoalById(req: Request, res: Response) {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const goal = await GoalController.goalService.getGoalById(accountUuid, id);

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const request: GoalContracts.UpdateGoalRequest = req.body;

      console.log('🎯 Updating goal:', id);
      console.log('📝 Request body:', JSON.stringify(request, null, 2));

      const goal = await GoalController.goalService.updateGoal(accountUuid, id, request);

      res.json({
        success: true,
        data: goal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      console.error('📍 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      await GoalController.goalService.deleteGoal(accountUuid, id);

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const goal = await GoalController.goalService.activateGoal(accountUuid, id);

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const goal = await GoalController.goalService.pauseGoal(accountUuid, id);

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const goal = await GoalController.goalService.completeGoal(accountUuid, id);

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
      const accountUuid = GoalController.extractAccountUuid(req);
      const { id } = req.params;
      const goal = await GoalController.goalService.archiveGoal(accountUuid, id);

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
}
