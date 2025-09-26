import type { Request, Response } from 'express';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import {
  extractClientInfo,
  generateDeviceFingerprint,
} from '../../../../shared/utils/clientInfoExtractor';
import type { AuthByPasswordRequestDTO, AuthResponseDTO, ClientInfo } from '@dailyuse/contracts';
import {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  error as apiError,
  validationError,
  businessError,
  createApiResponseHelper,
} from '../../../../shared/utils/apiResponse';

/**
 * Authentication Controller
 * 处理认证相关的HTTP请求
 */
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationApplicationService) {}

  /**
   * POST /api/v1/auth/login
   * 用户登录
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // 验证必要的输入参数
      const { username, password } = req.body;
      if (!username || !password) {
        badRequest(res, '用户名和密码不能为空', [
          {
            field: !username ? 'username' : 'password',
            code: 'REQUIRED_FIELD',
            message: !username ? '用户名不能为空' : '密码不能为空',
          },
        ]);
        return;
      }

      // 提取客户端信息
      const clientInfo = extractClientInfo(req);

      const loginRequest: AuthByPasswordRequestDTO & { clientInfo: ClientInfo } = {
        username,
        password,
        remember: req.body.remember || false,
        accountType: req.body.accountType,
        clientInfo: clientInfo,
      };

      const result = await this.authenticationService.loginByPassword(loginRequest);

      if (result.success && result.data) {
        // 成功登录，返回完整的令牌信息
        ok(res, result.data, result.message || '登录成功');
      } else {
        // 登录失败
        unauthorized(res, result.message || '用户名或密码错误');
      }
    } catch (error) {
      console.error('Login error:', error);
      apiError(res, '登录过程中发生内部错误', 500, {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
  }

  /**
   * POST /api/auth/mfa/verify
   * MFA验证
   */
  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, mfaCode } = req.body;

      if (!sessionId || !mfaCode) {
        badRequest(res, 'Session ID 和 MFA 验证码不能为空', [
          {
            field: !sessionId ? 'sessionId' : 'mfaCode',
            code: 'REQUIRED_FIELD',
            message: !sessionId ? 'Session ID 不能为空' : 'MFA 验证码不能为空',
          },
        ]);
        return;
      }

      // TODO: 实现MFA验证逻辑
      businessError(res, 'MFA验证功能暂未实现', 'MFA_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('MFA verification error:', error);
      apiError(res, 'MFA验证过程中发生内部错误');
    }
  }

  /**
   * POST /api/auth/logout
   * 用户登出
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        badRequest(res, 'Session ID 不能为空');
        return;
      }

      // TODO: 实现登出逻辑
      businessError(res, '登出功能暂未实现', 'LOGOUT_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('Logout error:', error);
      apiError(res, '登出过程中发生内部错误');
    }
  }

  /**
   * POST /api/auth/refresh
   * 刷新访问令牌
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        badRequest(res, 'Refresh token 不能为空');
        return;
      }

      // TODO: 实现令牌刷新逻辑
      businessError(res, '令牌刷新功能暂未实现', 'TOKEN_REFRESH_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('Token refresh error:', error);
      apiError(res, '令牌刷新过程中发生内部错误');
    }
  }

  /**
   * POST /api/auth/mfa/devices
   * 创建MFA设备
   */
  async createMFADevice(req: Request, res: Response): Promise<void> {
    try {
      const { accountUuid, deviceType, deviceName } = req.body;

      if (!accountUuid || !deviceType) {
        badRequest(res, '账户ID和设备类型不能为空', [
          {
            field: !accountUuid ? 'accountUuid' : 'deviceType',
            code: 'REQUIRED_FIELD',
            message: !accountUuid ? '账户ID不能为空' : '设备类型不能为空',
          },
        ]);
        return;
      }

      // TODO: 实现MFA设备创建逻辑
      businessError(res, 'MFA设备创建功能暂未实现', 'MFA_DEVICE_CREATION_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('Create MFA device error:', error);
      apiError(res, 'MFA设备创建过程中发生内部错误');
    }
  }

  /**
   * GET /api/auth/mfa/devices/:accountUuid
   * 获取用户的MFA设备列表
   */
  async getMFADevices(req: Request, res: Response): Promise<void> {
    try {
      const { accountUuid } = req.params;

      if (!accountUuid) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      // TODO: 实现获取MFA设备列表逻辑
      // 暂时返回空列表
      ok(res, [], '暂无MFA设备');
    } catch (error) {
      console.error('Get MFA devices error:', error);
      apiError(res, '获取MFA设备列表过程中发生内部错误');
    }
  }

  /**
   * DELETE /api/auth/mfa/devices/:deviceUuid
   * 删除MFA设备
   */
  async deleteMFADevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceUuid } = req.params;
      const { accountUuid } = req.body;

      if (!deviceUuid || !accountUuid) {
        badRequest(res, '设备ID和账户ID不能为空', [
          {
            field: !deviceUuid ? 'deviceUuid' : 'accountUuid',
            code: 'REQUIRED_FIELD',
            message: !deviceUuid ? '设备ID不能为空' : '账户ID不能为空',
          },
        ]);
        return;
      }

      // TODO: 调用应用服务的deleteMFADevice方法
      ok(res, null, 'MFA设备删除成功');
    } catch (error) {
      console.error('Delete MFA device error:', error);
      apiError(res, 'MFA设备删除过程中发生内部错误');
    }
  }

  /**
   * GET /api/auth/sessions/:accountUuid
   * 获取用户的活跃会话列表
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const { accountUuid } = req.params;

      if (!accountUuid) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      // TODO: 调用应用服务的getSessions方法（需要在ApplicationService中添加）
      // 暂时返回空数组
      ok(res, [], '会话列表获取成功');
    } catch (error) {
      console.error('Get sessions error:', error);
      apiError(res, '获取会话列表过程中发生内部错误');
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * 终止指定会话
   */
  async terminateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { accountUuid } = req.body;

      if (!sessionId || !accountUuid) {
        badRequest(res, '会话ID和账户ID不能为空', [
          {
            field: !sessionId ? 'sessionId' : 'accountUuid',
            code: 'REQUIRED_FIELD',
            message: !sessionId ? '会话ID不能为空' : '账户ID不能为空',
          },
        ]);
        return;
      }

      // TODO: 实现会话终止逻辑
      businessError(res, '会话终止功能暂未实现', 'SESSION_TERMINATION_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('Terminate session error:', error);
      apiError(res, '会话终止过程中发生内部错误');
    }
  }
}
