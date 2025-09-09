import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { KeyResultApplicationService } from '../../../application/services/KeyResultApplicationService';
import { PrismaGoalRepository } from '../../../infrastructure/repositories/prismaGoalRepository';
import { prisma } from '../../../../../config/prisma';
import type { GoalContracts } from '@dailyuse/contracts';

export class KeyResultController {
  private static keyResultService = new KeyResultApplicationService(
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
   * 创建关键结果
   */
  static async createKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const request: GoalContracts.CreateKeyResultRequest = req.body;
      const keyResult = await KeyResultController.keyResultService.createKeyResult(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: keyResult,
        message: 'Key result created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create key result',
      });
    }
  }

  /**
   * 根据目标UUID获取关键结果列表
   */
  static async getKeyResultsByGoal(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const { goalId } = req.params;
      const keyResults = await KeyResultController.keyResultService.getKeyResultsByGoalUuid(
        accountUuid,
        goalId,
      );

      res.json({
        success: true,
        data: keyResults,
        message: 'Key results retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve key results',
      });
    }
  }

  /**
   * 根据ID获取关键结果
   */
  static async getKeyResultById(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const { id } = req.params;
      const keyResult = await KeyResultController.keyResultService.getKeyResultById(
        accountUuid,
        id,
      );

      if (!keyResult) {
        return res.status(404).json({
          success: false,
          message: 'Key result not found',
        });
      }

      res.json({
        success: true,
        data: keyResult,
        message: 'Key result retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve key result',
      });
    }
  }

  /**
   * 更新关键结果
   */
  static async updateKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const { id } = req.params;
      const request: GoalContracts.UpdateKeyResultRequest = req.body;
      const keyResult = await KeyResultController.keyResultService.updateKeyResult(
        accountUuid,
        id,
        request,
      );

      res.json({
        success: true,
        data: keyResult,
        message: 'Key result updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update key result',
      });
    }
  }

  /**
   * 更新关键结果进度
   */
  static async updateKeyResultProgress(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const { id } = req.params;
      const { increment, note } = req.body;
      const keyResult = await KeyResultController.keyResultService.updateKeyResultProgress(
        accountUuid,
        id,
        increment,
      );

      res.json({
        success: true,
        data: keyResult,
        message: 'Key result progress updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update key result progress',
      });
    }
  }

  /**
   * 删除关键结果
   */
  static async deleteKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = KeyResultController.extractAccountUuid(req);
      const { id } = req.params;
      await KeyResultController.keyResultService.deleteKeyResult(accountUuid, id);

      res.json({
        success: true,
        message: 'Key result deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete key result',
      });
    }
  }
}
