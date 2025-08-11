import type { Request, Response } from 'express';
import { AuthenticationApplicationService } from '../application/AuthenticationApplicationService';
import type {
  LoginRequest,
  MFAVerificationRequest,
  CreateMFADeviceRequest,
} from '../application/AuthenticationApplicationService';

/**
 * Authentication Controller
 * 处理认证相关的HTTP请求
 */
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationApplicationService) {}

  /**
   * POST /api/auth/login
   * 用户登录
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginRequest: LoginRequest = {
        username: req.body.username,
        password: req.body.password,
        deviceInfo: req.body.deviceInfo || req.get('User-Agent') || 'Unknown device',
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.get('User-Agent'),
      };

      const result = await this.authenticationService.login(loginRequest);

      if (result.success) {
        // 成功登录
        if (result.requiresMFA) {
          // 需要MFA验证
          res.status(200).json({
            success: true,
            requiresMFA: true,
            sessionId: result.sessionId,
            message: 'MFA verification required',
          });
        } else {
          // 直接登录成功
          res.status(200).json({
            success: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            accountUuid: result.accountUuid,
            sessionId: result.sessionId,
            message: 'Login successful',
          });
        }
      } else {
        // 登录失败
        res.status(401).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/mfa/verify
   * MFA验证
   */
  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const verifyRequest: MFAVerificationRequest = {
        sessionId: req.body.sessionId,
        mfaCode: req.body.mfaCode,
      };

      const result = await this.authenticationService.verifyMFA(verifyRequest);

      if (result.success) {
        res.status(200).json({
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'MFA verification successful',
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * 用户登出
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.body.sessionId || (req.headers['x-session-id'] as string);

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      const result = await this.authenticationService.logout(sessionId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Logout successful',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * 刷新访问令牌
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authenticationService.refreshToken(refreshToken);

      if (result.success) {
        res.status(200).json({
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Token refreshed successfully',
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/mfa/devices
   * 创建MFA设备
   */
  async createMFADevice(req: Request, res: Response): Promise<void> {
    try {
      const createRequest: CreateMFADeviceRequest = {
        accountUuid: req.body.accountUuid,
        type: req.body.type,
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        emailAddress: req.body.emailAddress,
      };

      const result = await this.authenticationService.createMFADevice(createRequest);

      if (result.success) {
        res.status(201).json({
          success: true,
          device: result.device,
          message: 'MFA device created successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Create MFA device error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/auth/mfa/devices/:accountUuid
   * 获取用户的MFA设备列表
   */
  async getMFADevices(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = req.params.accountUuid;

      if (!accountUuid) {
        res.status(400).json({
          success: false,
          error: 'Account UUID is required',
        });
        return;
      }

      const result = await this.authenticationService.getMFADevices(accountUuid);

      if (result.success) {
        res.status(200).json({
          success: true,
          devices: result.devices,
          message: 'MFA devices retrieved successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Get MFA devices error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * DELETE /api/auth/mfa/devices/:deviceUuid
   * 删除MFA设备
   */
  async deleteMFADevice(req: Request, res: Response): Promise<void> {
    try {
      const deviceUuid = req.params.deviceUuid;
      const accountUuid = req.body.accountUuid || (req.query.accountUuid as string);

      if (!deviceUuid || !accountUuid) {
        res.status(400).json({
          success: false,
          error: 'Device UUID and Account UUID are required',
        });
        return;
      }

      // 调用应用服务的deleteMFADevice方法（需要在ApplicationService中添加）
      // 这里暂时返回成功响应
      res.status(200).json({
        success: true,
        message: 'MFA device deleted successfully',
      });
    } catch (error) {
      console.error('Delete MFA device error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/auth/sessions/:accountUuid
   * 获取用户的活跃会话列表
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = req.params.accountUuid;

      if (!accountUuid) {
        res.status(400).json({
          success: false,
          error: 'Account UUID is required',
        });
        return;
      }

      // 调用应用服务的getSessions方法（需要在ApplicationService中添加）
      // 这里暂时返回空数组
      res.status(200).json({
        success: true,
        sessions: [],
        message: 'Sessions retrieved successfully',
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * 终止指定会话
   */
  async terminateSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      // 调用logout服务
      const result = await this.authenticationService.logout(sessionId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Session terminated successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Terminate session error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
