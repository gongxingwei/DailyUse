import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SettingApplicationService } from '../../../application/services/SettingApplicationService';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('SettingController');

export class SettingController {
  private static settingService: SettingApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getSettingService(): Promise<SettingApplicationService> {
    if (!SettingController.settingService) {
      SettingController.settingService = await SettingApplicationService.getInstance();
    }
    return SettingController.settingService;
  }

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
   * 创建设置
   * @route POST /api/settings
   */
  static async createSetting(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();

      logger.info('Creating setting', { accountUuid, key: req.body.key });

      const setting = await service.createSetting({
        ...req.body,
        accountUuid: req.body.scope === 'USER' ? accountUuid : undefined,
      });

      logger.info('Setting created successfully', { settingUuid: setting.uuid, accountUuid });

      return SettingController.responseBuilder.sendSuccess(
        res,
        setting,
        'Setting created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          logger.error('Setting key conflict');
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating setting');
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('Validation')) {
          logger.error('Validation error creating setting');
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }

        logger.error('Internal error creating setting', { error: error.message });
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to create setting',
        });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error',
      });
    }
  }

  /**
   * 获取设置详情
   * @route GET /api/settings/:id
   */
  static async getSetting(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { id } = req.params;
      const includeHistory = req.query.includeHistory === 'true';

      logger.info('Getting setting', { settingUuid: id });

      const setting = await service.getSetting(id, { includeHistory });

      if (!setting) {
        logger.warn('Setting not found', { settingUuid: id });
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Setting not found',
        });
      }

      return SettingController.responseBuilder.sendSuccess(
        res,
        setting,
        'Setting retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting setting', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to get setting',
      });
    }
  }

  /**
   * 通过 key 获取设置
   * @route GET /api/settings/key/:key
   */
  static async getSettingByKey(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const { key } = req.params;
      const scope = req.query.scope as string;

      logger.info('Getting setting by key', { key, scope });

      const contextUuid = scope === 'USER' ? accountUuid : undefined;
      const setting = await service.getSettingByKey(key, scope as any, contextUuid);

      if (!setting) {
        logger.warn('Setting not found', { key, scope });
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Setting not found',
        });
      }

      return SettingController.responseBuilder.sendSuccess(
        res,
        setting,
        'Setting retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting setting by key', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to get setting',
      });
    }
  }

  /**
   * 更新设置值
   * @route PATCH /api/settings/:id/value
   */
  static async updateSettingValue(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const { id } = req.params;
      const { value } = req.body;

      logger.info('Updating setting value', { settingUuid: id });

      const setting = await service.updateSettingValue(id, value, accountUuid);

      logger.info('Setting value updated successfully', { settingUuid: id });

      return SettingController.responseBuilder.sendSuccess(
        res,
        setting,
        'Setting value updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('Validation')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('read-only')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: error.message,
          });
        }

        logger.error('Error updating setting value', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to update setting value',
      });
    }
  }

  /**
   * 重置设置
   * @route POST /api/settings/:id/reset
   */
  static async resetSetting(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { id } = req.params;

      logger.info('Resetting setting', { settingUuid: id });

      const setting = await service.resetSetting(id);

      logger.info('Setting reset successfully', { settingUuid: id });

      return SettingController.responseBuilder.sendSuccess(
        res,
        setting,
        'Setting reset successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('read-only')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: error.message,
          });
        }

        logger.error('Error resetting setting', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to reset setting',
      });
    }
  }

  /**
   * 获取用户设置
   * @route GET /api/settings/user
   */
  static async getUserSettings(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const includeHistory = req.query.includeHistory === 'true';

      logger.info('Getting user settings', { accountUuid });

      const settings = await service.getUserSettings(accountUuid, { includeHistory });

      return SettingController.responseBuilder.sendSuccess(
        res,
        settings,
        'User settings retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting user settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to get user settings',
      });
    }
  }

  /**
   * 获取系统设置
   * @route GET /api/settings/system
   */
  static async getSystemSettings(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const includeHistory = req.query.includeHistory === 'true';

      logger.info('Getting system settings');

      const settings = await service.getSystemSettings({ includeHistory });

      return SettingController.responseBuilder.sendSuccess(
        res,
        settings,
        'System settings retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting system settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to get system settings',
      });
    }
  }

  /**
   * 搜索设置
   * @route GET /api/settings/search
   */
  static async searchSettings(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { query, scope } = req.query;

      if (!query || typeof query !== 'string') {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Query parameter is required',
        });
      }

      logger.info('Searching settings', { query, scope });

      const settings = await service.searchSettings(query, scope as any);

      return SettingController.responseBuilder.sendSuccess(
        res,
        settings,
        'Settings retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error searching settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to search settings',
      });
    }
  }

  /**
   * 批量更新设置
   * @route PATCH /api/settings/batch
   */
  static async updateManySettings(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Updates must be an array',
        });
      }

      logger.info('Batch updating settings', { count: updates.length });

      const updatedSettings = await service.updateManySettings(
        updates.map((u: any) => ({
          ...u,
          operatorUuid: accountUuid,
        })),
      );

      logger.info('Settings batch updated successfully', { count: updatedSettings.length });

      return SettingController.responseBuilder.sendSuccess(
        res,
        updatedSettings,
        'Settings updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error batch updating settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to update settings',
      });
    }
  }

  /**
   * 同步设置
   * @route POST /api/settings/:id/sync
   */
  static async syncSetting(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { id } = req.params;

      logger.info('Syncing setting', { settingUuid: id });

      await service.syncSetting(id);

      logger.info('Setting synced successfully', { settingUuid: id });

      return SettingController.responseBuilder.sendSuccess(
        res,
        null,
        'Setting synced successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        logger.error('Error syncing setting', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to sync setting',
      });
    }
  }

  /**
   * 删除设置
   * @route DELETE /api/settings/:id
   */
  static async deleteSetting(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { id } = req.params;

      logger.info('Deleting setting', { settingUuid: id });

      await service.deleteSetting(id);

      logger.info('Setting deleted successfully', { settingUuid: id });

      return SettingController.responseBuilder.sendSuccess(
        res,
        null,
        'Setting deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
        if (error.message.includes('system setting')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: error.message,
          });
        }

        logger.error('Error deleting setting', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to delete setting',
      });
    }
  }

  /**
   * 验证设置值
   * @route POST /api/settings/:id/validate
   */
  static async validateSettingValue(req: Request, res: Response): Promise<Response> {
    try {
      const service = await SettingController.getSettingService();
      const { id } = req.params;
      const { value } = req.body;

      logger.info('Validating setting value', { settingUuid: id });

      const result = await service.validateSettingValue(id, value);

      return SettingController.responseBuilder.sendSuccess(res, result, 'Validation result');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return SettingController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        logger.error('Error validating setting value', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to validate setting value',
      });
    }
  }

  /**
   * 导出设置配置
   * @route GET /api/settings/export
   */
  static async exportSettings(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const { scope } = req.query;

      if (!scope || typeof scope !== 'string') {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Scope parameter is required',
        });
      }

      logger.info('Exporting settings', { scope });

      const contextUuid = scope === 'USER' ? accountUuid : undefined;
      const config = await service.exportSettings(scope as any, contextUuid);

      return SettingController.responseBuilder.sendSuccess(
        res,
        config,
        'Settings exported successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error exporting settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to export settings',
      });
    }
  }

  /**
   * 导入设置配置
   * @route POST /api/settings/import
   */
  static async importSettings(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = SettingController.extractAccountUuid(req);
      const service = await SettingController.getSettingService();
      const { scope, config } = req.body;

      if (!scope || !config) {
        return SettingController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Scope and config are required',
        });
      }

      logger.info('Importing settings', { scope });

      const contextUuid = scope === 'USER' ? accountUuid : undefined;
      await service.importSettings(scope, config, contextUuid, accountUuid);

      logger.info('Settings imported successfully', { scope });

      return SettingController.responseBuilder.sendSuccess(
        res,
        null,
        'Settings imported successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error importing settings', { error: error.message });
      }

      return SettingController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to import settings',
      });
    }
  }
}
