import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoalRecordApplicationService } from '../../../application/services/GoalRecordApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';

export class GoalRecordController {
  private static goalRecordService = new GoalRecordApplicationService(
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
   * 创建目标记录
   */
  static async createGoalRecord(req: Request, res: Response) {
    try {
      const accountUuid = GoalRecordController.extractAccountUuid(req);
      const request: GoalContracts.CreateGoalRecordRequest = req.body;
      const goalRecord = await GoalRecordController.goalRecordService.createGoalRecord(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: goalRecord,
        message: 'Goal record created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create goal record',
      });
    }
  }

  /**
   * 根据目标UUID获取目标记录列表
   */
  static async getGoalRecordsByGoal(req: Request, res: Response) {
    try {
      const accountUuid = GoalRecordController.extractAccountUuid(req);
      const { goalId } = req.params;
      const goalRecords = await GoalRecordController.goalRecordService.getGoalRecordsByGoal(
        accountUuid,
        goalId,
      );

      res.json({
        success: true,
        data: goalRecords.data,
        total: goalRecords.total,
        message: 'Goal records retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal records',
      });
    }
  }

  /**
   * 根据关键结果UUID获取目标记录列表
   */
  static async getGoalRecordsByKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = GoalRecordController.extractAccountUuid(req);
      const { keyResultId } = req.params;
      const goalRecords = await GoalRecordController.goalRecordService.getGoalRecordsByKeyResult(
        accountUuid,
        keyResultId,
      );

      res.json({
        success: true,
        data: goalRecords.data,
        total: goalRecords.total,
        message: 'Goal records retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal records',
      });
    }
  }

  /**
   * 根据ID获取目标记录
   */
  static async getGoalRecordById(req: Request, res: Response) {
    try {
      const accountUuid = GoalRecordController.extractAccountUuid(req);
      const { id } = req.params;
      const goalRecord = await GoalRecordController.goalRecordService.getGoalRecordById(
        accountUuid,
        id,
      );

      if (!goalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Goal record not found',
        });
      }

      res.json({
        success: true,
        data: goalRecord,
        message: 'Goal record retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve goal record',
      });
    }
  }

  /**
   * 删除目标记录
   */
  static async deleteGoalRecord(req: Request, res: Response) {
    try {
      const accountUuid = GoalRecordController.extractAccountUuid(req);
      const { id } = req.params;
      await GoalRecordController.goalRecordService.deleteGoalRecord(accountUuid, id);

      res.json({
        success: true,
        message: 'Goal record deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete goal record',
      });
    }
  }
}
