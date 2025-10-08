import type { Request, Response } from 'express';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import {
  extractClientInfo,
  generateDeviceFingerprint,
} from '../../../../shared/utils/clientInfoExtractor';
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
const logger = createLogger('AuthenticationController');

/**
 * Authentication Controller
 * 处理认证相关的HTTP请求
 */
export class AuthenticationController {
  private static responseBuilder = createResponseBuilder();

  constructor(private readonly authenticationService: AuthenticationApplicationService) {}

  /**
   * POST /api/v1/auth/login
   * 用户登录
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      // 验证必要的输入参数
      const { username, password } = req.body;
      if (!username || !password) {
        logger.warn('Login validation failed - missing credentials');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: !username ? '用户名不能为空' : '密码不能为空',
        });
      }

      logger.info('Login attempt', { username });

      // 提取客户端信息
      const clientInfo = extractClientInfo(req);

      const loginRequest = {
        username,
        password,
        remember: req.body.remember || false,
        accountType: req.body.accountType,
        clientInfo: clientInfo,
      };

      const result = await this.authenticationService.loginByPassword(loginRequest);

      if (result.success && result.data) {
        // 成功登录，返回完整的令牌信息
        logger.info('Login successful', {
          username,
          userId: result.data.user?.uuid || 'unknown',
        });
        return AuthenticationController.responseBuilder.sendSuccess(
          res,
          result.data,
          result.message || '登录成功',
        );
      } else {
        // 登录失败
        logger.warn('Login failed', { username, reason: result.message });
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: result.message || '用户名或密码错误',
        });
      }
    } catch (error) {
      logger.error('Login error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '登录过程中发生内部错误',
      });
    }
  }

  /**
   * POST /api/auth/mfa/verify
   * MFA验证
   */
  async verifyMFA(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId, mfaCode } = req.body;

      if (!sessionId || !mfaCode) {
        logger.warn('MFA verification validation failed');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: !sessionId ? 'Session ID 不能为空' : 'MFA 验证码不能为空',
        });
      }

      logger.info('MFA verification attempt', { sessionId });

      // TODO: 实现MFA验证逻辑
      logger.warn('MFA verification not implemented');
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message: 'MFA验证功能暂未实现',
      });
    } catch (error) {
      logger.error('MFA verification error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'MFA验证过程中发生内部错误',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * 用户登出
   */
  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId, allSessions } = req.body;

      if (!sessionId && !allSessions) {
        logger.warn('Logout validation failed - missing sessionId and allSessions flag');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '请提供 sessionId 或设置 allSessions 标志',
        });
      }

      logger.info('Logout attempt', { sessionId, allSessions });

      let result;
      if (allSessions) {
        // 登出所有会话 - 需要从请求中获取 accountUuid
        const { accountUuid } = req.body;
        if (!accountUuid) {
          logger.warn('Logout all sessions validation failed - missing accountUuid');
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: '登出所有会话需要提供 accountUuid',
          });
        }
        result = await this.authenticationService.logoutAll(accountUuid);
      } else {
        // 登出单个会话
        const { accountUuid } = req.body; // 可选，用于验证
        result = await this.authenticationService.logout(sessionId, accountUuid);
      }

      if (result.success) {
        logger.info('Logout successful', {
          sessionId,
          allSessions,
          sessionsClosed: result.data?.sessionsClosed,
        });
        return AuthenticationController.responseBuilder.sendSuccess(
          res,
          result.data,
          result.message,
        );
      } else {
        logger.warn('Logout failed', { sessionId, reason: result.message });
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: result.message || '登出失败',
        });
      }
    } catch (error) {
      logger.error('Logout error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '登出过程中发生内部错误',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * 刷新访问令牌
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        logger.warn('Token refresh validation failed - missing refreshToken');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Refresh token 不能为空',
        });
      }

      logger.info('Token refresh attempt');

      // TODO: 实现令牌刷新逻辑
      logger.warn('Token refresh not implemented');
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message: '令牌刷新功能暂未实现',
      });
    } catch (error) {
      logger.error('Token refresh error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: '令牌刷新过程中发生内部错误',
      });
    }
  }

  /**
   * POST /api/auth/mfa/devices
   * 创建 MFA 设备
   */
  async createMFADevice(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, deviceType, deviceName } = req.body;

      if (!accountUuid || !deviceType) {
        logger.warn('Create MFA device validation failed');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: !accountUuid ? '账户ID不能为空' : '设备类型不能为空',
        });
      }

      logger.info('Create MFA device attempt', { accountUuid, deviceType });

      // TODO: 实现MFA设备创建逻辑
      logger.warn('MFA device creation not implemented');
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message: 'MFA设备创建功能暂未实现',
      });
    } catch (error) {
      logger.error('Create MFA device error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'MFA设备创建过程中发生内部错误',
      });
    }
  }

  /**
   * GET /api/auth/mfa/devices/:accountUuid
   * 获取用户的MFA设备列表
   */
  async getMFADevices(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      if (!accountUuid) {
        logger.warn('Get MFA devices validation failed - missing accountUuid');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      logger.info('Get MFA devices', { accountUuid });

      // TODO: 实现获取MFA设备列表逻辑
      // 暂时返回空列表
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { devices: [], total: 0 },
        '暂无MFA设备',
      );
    } catch (error) {
      logger.error('Get MFA devices error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: '获取MFA设备列表过程中发生内部错误',
      });
    }
  }

  /**
   * DELETE /api/auth/mfa/devices/:deviceUuid
   * 删除MFA设备
   */
  async deleteMFADevice(req: Request, res: Response): Promise<Response> {
    try {
      const { deviceUuid } = req.params;
      const { accountUuid } = req.body;

      if (!deviceUuid || !accountUuid) {
        logger.warn('Delete MFA device validation failed');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: !deviceUuid ? '设备ID不能为空' : '账户ID不能为空',
        });
      }

      logger.info('Delete MFA device', { deviceUuid, accountUuid });

      // TODO: 调用应用服务的deleteMFADevice方法
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { message: 'MFA设备删除成功' },
        'MFA设备删除成功',
      );
    } catch (error) {
      logger.error('Delete MFA device error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'MFA设备删除过程中发生内部错误',
      });
    }
  }

  /**
   * GET /api/auth/sessions/:accountUuid
   * 获取用户的活跃会话列表
   */
  async getSessions(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      if (!accountUuid) {
        logger.warn('Get sessions validation failed - missing accountUuid');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      logger.info('Get sessions', { accountUuid });

      // TODO: 调用应用服务的getSessions方法（需要在ApplicationService中添加）
      // 暂时返回空数组
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        { sessions: [], total: 0 },
        '会话列表获取成功',
      );
    } catch (error) {
      logger.error('Get sessions error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: '获取会话列表过程中发生内部错误',
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * 终止指定会话
   */
  async terminateSession(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const { accountUuid } = req.body;

      if (!sessionId || !accountUuid) {
        logger.warn('Terminate session validation failed');
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: !sessionId ? '会话ID不能为空' : '账户ID不能为空',
        });
      }

      logger.info('Terminate session', { sessionId, accountUuid });

      // TODO: 实现会话终止逻辑
      logger.warn('Session termination not implemented');
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message: '会话终止功能暂未实现',
      });
    } catch (error) {
      logger.error('Terminate session error', error);
      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: '会话终止过程中发生内部错误',
      });
    }
  }
}
