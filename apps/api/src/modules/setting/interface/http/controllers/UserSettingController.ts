/**
 * UserSetting Controller
 * 用户设置控制器
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 *
 * Endpoints:
 * - POST   /api/user-settings              - 创建用户设置
 * - GET    /api/user-settings/:uuid        - 获取用户设置详情
 * - GET    /api/user-settings/account/:accountUuid - 根据账户获取用户设置
 * - PUT    /api/user-settings/:uuid        - 更新用户设置
 * - PATCH  /api/user-settings/:uuid/appearance - 更新外观设置
 * - PATCH  /api/user-settings/:uuid/locale - 更新语言区域设置
 * - PATCH  /api/user-settings/:uuid/shortcuts - 更新快捷键
 * - DELETE /api/user-settings/:uuid        - 删除用户设置
 * - POST   /api/user-settings/get-or-create - 获取或创建用户设置
 */

import type { Request, Response } from 'express';
import { UserSettingApplicationService } from '../../../application/services/UserSettingApplicationService';
import {
  type ApiResponse,
  ResponseCode,
  createResponseBuilder,
  type SettingContracts,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('UserSettingController');

export class UserSettingController {
  private static userSettingService: UserSettingApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getUserSettingService(): Promise<UserSettingApplicationService> {
    if (!UserSettingController.userSettingService) {
      // Import dynamically to avoid circular dependencies
      const { UserSettingApplicationService } = await import(
        '../../../application/services/UserSettingApplicationService'
      );
      UserSettingController.userSettingService =
        await UserSettingApplicationService.getInstance();
    }
    return UserSettingController.userSettingService;
  }

  /**
   * 创建用户设置
   * @route POST /api/user-settings
   */
  static async createUserSetting(req: Request, res: Response): Promise<Response> {
    try {
      const request: SettingContracts.CreateUserSettingRequest = req.body;

      if (!request.accountUuid) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'accountUuid is required',
        });
      }

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.createUserSetting(request);

      logger.info('User setting created successfully', { uuid: userSetting.uuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'User setting created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating user setting', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户设置详情
   * @route GET /api/user-settings/:uuid
   */
  static async getUserSetting(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.getUserSettingByUuid(uuid);

      if (!userSetting) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'User setting not found',
        });
      }

      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'User setting retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user setting', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 根据账户获取用户设置
   * @route GET /api/user-settings/account/:accountUuid
   */
  static async getUserSettingByAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.getUserSettingByAccountUuid(accountUuid);

      if (!userSetting) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'User setting not found',
        });
      }

      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'User setting retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user setting by account', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新用户设置
   * @route PUT /api/user-settings/:uuid
   */
  static async updateUserSetting(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid,
        ...req.body,
      };

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateUserSetting(uuid, request);

      logger.info('User setting updated successfully', { uuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'User setting updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating user setting', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新外观设置
   * @route PATCH /api/user-settings/:uuid/appearance
   */
  static async updateAppearance(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const appearance: SettingContracts.UpdateAppearanceRequest = req.body;

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateUserSetting(uuid, {
        uuid,
        appearance,
      });

      logger.info('Appearance settings updated successfully', { uuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Appearance settings updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating appearance settings', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新语言区域设置
   * @route PATCH /api/user-settings/:uuid/locale
   */
  static async updateLocale(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const locale: SettingContracts.UpdateLocaleRequest = req.body;

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateUserSetting(uuid, {
        uuid,
        locale,
      });

      logger.info('Locale settings updated successfully', { uuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Locale settings updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating locale settings', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新快捷键
   * @route PATCH /api/user-settings/:uuid/shortcuts/:action
   */
  static async updateShortcut(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid, action } = req.params;
      const { shortcut } = req.body;

      if (!shortcut) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'shortcut is required',
        });
      }

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateShortcut(uuid, { action, shortcut });

      logger.info('Shortcut updated successfully', { uuid, action });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Shortcut updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating shortcut', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除快捷键
   * @route DELETE /api/user-settings/:uuid/shortcuts/:action
   */
  static async removeShortcut(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid, action } = req.params;

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.removeShortcut(uuid, action);

      logger.info('Shortcut removed successfully', { uuid, action });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Shortcut removed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error removing shortcut', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新主题
   * @route PATCH /api/user-settings/:uuid/theme
   */
  static async updateTheme(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const { theme } = req.body;

      if (!theme) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'theme is required',
        });
      }

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateTheme(uuid, theme);

      logger.info('Theme updated successfully', { uuid, theme });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Theme updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating theme', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新语言
   * @route PATCH /api/user-settings/:uuid/language
   */
  static async updateLanguage(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const { language } = req.body;

      if (!language) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'language is required',
        });
      }

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.updateLanguage(uuid, language);

      logger.info('Language updated successfully', { uuid, language });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'Language updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating language', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除用户设置
   * @route DELETE /api/user-settings/:uuid
   */
  static async deleteUserSetting(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await UserSettingController.getUserSettingService();
      await service.deleteUserSetting(uuid);

      logger.info('User setting deleted successfully', { uuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        null,
        'User setting deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting user setting', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取或创建用户设置
   * @route POST /api/user-settings/get-or-create
   */
  static async getOrCreateUserSetting(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.body;

      if (!accountUuid) {
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'accountUuid is required',
        });
      }

      const service = await UserSettingController.getUserSettingService();
      const userSetting = await service.getOrCreate(accountUuid);

      logger.info('User setting retrieved or created successfully', { accountUuid });
      return UserSettingController.responseBuilder.sendSuccess(
        res,
        userSetting,
        'User setting retrieved or created successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting or creating user setting', { error: error.message });
        return UserSettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return UserSettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
