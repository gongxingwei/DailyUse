/**
 * UserPreferencesController
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserPreferencesApplicationService } from '../../../application/services/UserPreferencesApplicationService';
import { PrismaUserPreferencesRepository } from '../../../infrastructure/repositories/PrismaUserPreferencesRepository';
import { prisma } from '../../../../../config/prisma';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { ThemeMode } from '@dailyuse/contracts/src/modules/theme';

const logger = createLogger('UserPreferencesController');

export class UserPreferencesController {
  private static userPreferencesService = new UserPreferencesApplicationService(
    new PrismaUserPreferencesRepository(prisma),
  );
  private static responseBuilder = createResponseBuilder();

  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { accountUuid: string };
    return decoded.accountUuid;
  }

  static async getPreferences(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const preferences =
        await UserPreferencesController.userPreferencesService.getUserPreferences(accountUuid);
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }

  static async switchThemeMode(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const { themeMode } = req.body;
      if (!themeMode) {
        return UserPreferencesController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing themeMode',
        });
      }
      const preferences = await UserPreferencesController.userPreferencesService.switchThemeMode(
        accountUuid,
        themeMode as ThemeMode,
      );
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }

  static async changeLanguage(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const { language } = req.body;
      if (!language) {
        return UserPreferencesController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing language',
        });
      }
      const preferences = await UserPreferencesController.userPreferencesService.changeLanguage(
        accountUuid,
        language,
      );
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }

  static async updateNotificationPreferences(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const { notificationsEnabled, emailNotifications, pushNotifications } = req.body;
      const preferences =
        await UserPreferencesController.userPreferencesService.updateNotificationPreferences(
          accountUuid,
          { notificationsEnabled, emailNotifications, pushNotifications },
        );
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }

  static async updatePreferences(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const preferences = await UserPreferencesController.userPreferencesService.updatePreferences(
        accountUuid,
        req.body,
      );
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }

  static async resetToDefault(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = UserPreferencesController.extractAccountUuid(req);
      const preferences =
        await UserPreferencesController.userPreferencesService.resetToDefault(accountUuid);
      return UserPreferencesController.responseBuilder.sendSuccess(res, preferences, 'Success');
    } catch (error) {
      return UserPreferencesController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed',
      });
    }
  }
}
