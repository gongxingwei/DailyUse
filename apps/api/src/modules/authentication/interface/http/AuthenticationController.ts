import type { Request, Response } from 'express';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationController');

/**
 * Authentication 控制器
 */
export class AuthenticationController {
  private static authService: AuthenticationApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getAuthService(): Promise<AuthenticationApplicationService> {
    if (!AuthenticationController.authService) {
      AuthenticationController.authService = await AuthenticationApplicationService.getInstance();
    }
    return AuthenticationController.authService;
  }

  /**
   * 创建密码凭证
   * @route POST /api/auth/credentials/password
   */
  static async createPasswordCredential(req: Request, res: Response): Promise<Response> {
    try {
      const service = await AuthenticationController.getAuthService();
      const credential = await service.createPasswordCredential(req.body);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        credential,
        'Password credential created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating password credential', { error: error.message });
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 验证密码
   * @route POST /api/auth/verify-password
   */
  static async verifyPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, hashedPassword } = req.body;
      const service = await AuthenticationController.getAuthService();
      const valid = await service.verifyPassword(accountUuid, hashedPassword);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { valid },
        valid ? 'Password verified' : 'Invalid password',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 修改密码
   * @route PUT /api/auth/password
   */
  static async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, newHashedPassword } = req.body;
      const service = await AuthenticationController.getAuthService();
      await service.changePassword(accountUuid, newHashedPassword);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Password changed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 创建会话
   * @route POST /api/auth/sessions
   */
  static async createSession(req: Request, res: Response): Promise<Response> {
    try {
      const service = await AuthenticationController.getAuthService();
      const session = await service.createSession(req.body);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        session,
        'Session created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取活跃会话
   * @route GET /api/auth/sessions/active/:accountUuid
   */
  static async getActiveSessions(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const service = await AuthenticationController.getAuthService();
      const sessions = await service.getActiveSessions(accountUuid);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        sessions,
        'Active sessions retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 撤销会话
   * @route DELETE /api/auth/sessions/:sessionUuid
   */
  static async revokeSession(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionUuid } = req.params;
      const service = await AuthenticationController.getAuthService();
      await service.revokeSession(sessionUuid);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Session revoked successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 启用双因素认证
   * @route POST /api/auth/two-factor/enable
   */
  static async enableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      const service = await AuthenticationController.getAuthService();
      const secret = await service.enableTwoFactor(req.body);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { secret },
        'Two-factor authentication enabled',
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 生成 API 密钥
   * @route POST /api/auth/api-keys
   */
  static async generateApiKey(req: Request, res: Response): Promise<Response> {
    try {
      const service = await AuthenticationController.getAuthService();
      const apiKey = await service.generateApiKey(req.body);
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { apiKey },
        'API key generated successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
