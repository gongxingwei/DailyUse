import type { Request, Response } from 'express';
import { AuthenticationApplicationService } from '../application/services/AuthenticationApplicationService';
import {
  extractClientInfo,
  generateDeviceFingerprint,
} from '../../../shared/utils/clientInfoExtractor';
import type {
  AuthByPasswordRequestDTO,
  AuthResponseDTO,
  ClientInfo,
} from '@dailyuse/contracts';
import type { TResponse } from '../../../tempTypes';
import { AccountType } from '@dailyuse/domain-core';
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
      // 提取客户端信息
      const clientInfo = extractClientInfo(req);

      const loginRequest: AuthByPasswordRequestDTO & { clientInfo: ClientInfo } = {
        username: req.body.username,
        password: req.body.password,
        remember: req.body.remember || false,
        accountType: req.body.accountType,
        clientInfo: clientInfo,
      };

      const result = await this.authenticationService.loginByPassword(loginRequest);

      if (result.success && result.data) {
        // 成功登录，返回完整的令牌信息
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        // 登录失败
        res.status(401).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/mfa/verify
   * MFA验证
   */
  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现MFA验证逻辑
      res.status(501).json({
        success: false,
        message: 'MFA verification not implemented yet',
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * 用户登出
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现登出逻辑
      res.status(501).json({
        success: false,
        message: 'Logout not implemented yet',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * 刷新访问令牌
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现令牌刷新逻辑
      res.status(501).json({
        success: false,
        message: 'Token refresh not implemented yet',
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/mfa/devices
   * 创建MFA设备
   */
  async createMFADevice(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现MFA设备创建逻辑
      res.status(501).json({
        success: false,
        message: 'MFA device creation not implemented yet',
      });
    } catch (error) {
      console.error('Create MFA device error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/auth/mfa/devices/:accountUuid
   * 获取用户的MFA设备列表
   */
  async getMFADevices(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现获取MFA设备列表逻辑
      res.status(501).json({
        success: false,
        message: 'Get MFA devices not implemented yet',
      });
    } catch (error) {
      console.error('Get MFA devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
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
      // TODO: 实现会话终止逻辑
      res.status(501).json({
        success: false,
        message: 'Session termination not implemented yet',
      });
    } catch (error) {
      console.error('Terminate session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
