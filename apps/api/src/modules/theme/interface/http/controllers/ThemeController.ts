/**
 * ThemeController
 * 主题控制器
 *
 * @description 处理主题相关的 HTTP 请求
 */

import type { Request, Response } from 'express';
import { ThemeApplicationService } from '../../../application/services/ThemeApplicationService';
import { PrismaUserThemePreferenceRepository } from '../../../infrastructure/repositories/PrismaUserThemePreferenceRepository';
import { PrismaClient } from '@prisma/client';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ThemeController');

// 初始化 Prisma 和服务
const prisma = new PrismaClient();
const preferenceRepository = new PrismaUserThemePreferenceRepository(prisma);
const themeService = new ThemeApplicationService(preferenceRepository);
const responseBuilder = createResponseBuilder();

export class ThemeController {
  /**
   * 获取用户主题偏好
   * GET /api/theme/preferences
   */
  static async getPreferences(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ThemeController.extractAccountUuid(req);

      logger.info('Getting theme preferences', { accountUuid });

      const preference = await themeService.getUserPreference(accountUuid);

      return responseBuilder.sendSuccess(
        res,
        preference,
        'Theme preferences retrieved successfully',
      );
    } catch (error) {
      logger.error('Failed to get theme preferences', error);

      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to retrieve theme preferences',
        debug: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 切换主题模式
   * POST /api/theme/preferences/mode
   */
  static async switchMode(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ThemeController.extractAccountUuid(req);
      const { mode } = req.body;

      if (!mode) {
        return responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Theme mode is required',
        });
      }

      logger.info('Switching theme mode', { accountUuid, mode });

      const preference = await themeService.switchThemeMode(accountUuid, mode);

      return responseBuilder.sendSuccess(res, preference, 'Theme mode switched successfully');
    } catch (error) {
      logger.error('Failed to switch theme mode', error);

      if (error instanceof Error && error.message.includes('Already in')) {
        return responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: error.message,
        });
      }

      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to switch theme mode',
        debug: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 应用自定义主题
   * POST /api/theme/preferences/apply
   */
  static async applyTheme(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ThemeController.extractAccountUuid(req);
      const { themeUuid } = req.body;

      if (!themeUuid) {
        return responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Theme UUID is required',
        });
      }

      logger.info('Applying custom theme', { accountUuid, themeUuid });

      const preference = await themeService.applyCustomTheme(accountUuid, themeUuid);

      return responseBuilder.sendSuccess(res, preference, 'Theme applied successfully');
    } catch (error) {
      logger.error('Failed to apply theme', error);

      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to apply theme',
        debug: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 配置自动切换
   * PUT /api/theme/preferences/auto-switch
   */
  static async configureAutoSwitch(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ThemeController.extractAccountUuid(req);
      const { enabled, scheduleStart, scheduleEnd } = req.body;

      if (typeof enabled !== 'boolean') {
        return responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Enabled flag is required',
        });
      }

      logger.info('Configuring auto-switch', { accountUuid, enabled, scheduleStart, scheduleEnd });

      const preference = await themeService.configureAutoSwitch(accountUuid, {
        enabled,
        scheduleStart,
        scheduleEnd,
      });

      return responseBuilder.sendSuccess(res, preference, 'Auto-switch configured successfully');
    } catch (error) {
      logger.error('Failed to configure auto-switch', error);

      if (error instanceof Error && error.message.includes('requires')) {
        return responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to configure auto-switch',
        debug: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 重置为默认偏好
   * POST /api/theme/preferences/reset
   */
  static async resetToDefault(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ThemeController.extractAccountUuid(req);

      logger.info('Resetting theme preferences to default', { accountUuid });

      const preference = await themeService.resetToDefault(accountUuid);

      return responseBuilder.sendSuccess(res, preference, 'Theme preferences reset successfully');
    } catch (error) {
      logger.error('Failed to reset theme preferences', error);

      return responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to reset theme preferences',
        debug: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 从请求中提取 accountUuid
   */
  private static extractAccountUuid(req: Request): string {
    const accountUuid = (req as any).user?.accountUuid;

    if (!accountUuid) {
      throw new Error('Account UUID not found in request');
    }

    return accountUuid;
  }
}
