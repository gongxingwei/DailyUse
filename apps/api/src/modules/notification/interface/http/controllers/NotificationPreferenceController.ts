/**
 * Notification Preference Controller
 * @description 用户通知偏好设置控制器
 * @author DailyUse Team
 * @date 2025-01-07
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { NotificationApplicationService } from '../../../application/services/NotificationApplicationService';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { NotificationPreferenceRepository } from '../../../infrastructure/repositories/NotificationPreferenceRepository';
import { prisma } from '../../../../../config/prisma';
import type { NotificationContracts } from '@dailyuse/contracts';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationPreferenceController');

export class NotificationPreferenceController {
  private static notificationService = new NotificationApplicationService(
    new NotificationRepository(prisma),
    {} as any, // TODO: 实现 NotificationTemplateRepository
    new NotificationPreferenceRepository(prisma),
  );
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
   * 获取用户通知偏好设置
   * GET /api/v1/notification-preferences
   */
  static async getPreference(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = NotificationPreferenceController.extractAccountUuid(req);

      logger.debug('Getting user notification preference', { accountUuid });

      const preference =
        await NotificationPreferenceController.notificationService.getUserPreference(accountUuid);

      logger.info('User notification preference retrieved', { accountUuid });

      return NotificationPreferenceController.responseBuilder.sendSuccess(
        res,
        preference,
        'Notification preference retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return NotificationPreferenceController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to get notification preference', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NotificationPreferenceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get notification preference',
      });
    }
  }

  /**
   * 更新用户通知偏好设置
   * PUT /api/v1/notification-preferences
   */
  static async updatePreference(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = NotificationPreferenceController.extractAccountUuid(req);
      const updates: NotificationContracts.UpsertNotificationPreferenceRequest = req.body;

      logger.info('Updating user notification preference', { accountUuid, updates });

      const preference =
        await NotificationPreferenceController.notificationService.updateUserPreference(
          accountUuid,
          updates,
        );

      logger.info('User notification preference updated', { accountUuid });

      return NotificationPreferenceController.responseBuilder.sendSuccess(
        res,
        preference,
        'Notification preference updated successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return NotificationPreferenceController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to update notification preference', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NotificationPreferenceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Failed to update notification preference',
      });
    }
  }

  /**
   * 更新指定渠道的设置
   * PATCH /api/v1/notification-preferences/channels/:channel
   */
  static async updateChannelPreference(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = NotificationPreferenceController.extractAccountUuid(req);
      const { channel } = req.params;
      const settings = req.body;

      logger.info('Updating channel preference', { accountUuid, channel, settings });

      const preference =
        await NotificationPreferenceController.notificationService.updateUserPreference(
          accountUuid,
          {
            channelPreferences: {
              [channel]: settings,
            },
          },
        );

      logger.info('Channel preference updated', { accountUuid, channel });

      return NotificationPreferenceController.responseBuilder.sendSuccess(
        res,
        preference,
        'Channel preference updated successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return NotificationPreferenceController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to update channel preference', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NotificationPreferenceController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to update channel preference',
      });
    }
  }
}
